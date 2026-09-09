# app/api/endpoints/transacciones.py
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session
from decimal import Decimal
from typing import Dict
from sqlalchemy import select, func
import google.generativeai as genai
import PyPDF2
import json


from app.db.database import get_session
from app.schemas.transaccion import TransaccionCreate, TransaccionRead, PaginatedTransacciones, GastoPorCategoria, TransaccionUpdate, ResumenMesActual
from app.crud import crud_transaccion
from app.models.domain import TipoMovimiento

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario, Transaccion, Categoria
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=TransaccionRead, status_code=201)
def registrar_transaccion(
    transaccion: TransaccionCreate, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Registra un movimiento asegurando la integridad de reglas de transferencia.
    *Ruta Protegida: Requiere Token JWT.*
    """
    # Nota: Si el schema falla (ej. falta cuenta destino), FastAPI devuelve error automático antes de llegar aquí.
    return crud_transaccion.create_transaccion(session=session, transaccion_in=transaccion)

# Configuramos la llave directamente desde el entorno
genai.configure(api_key=settings.GEMINI_API_KEY)

@router.post("/extraer-pdf")
async def extraer_datos_pdf(file: UploadFile = File(...)):
    # 1. Extraer texto del PDF
    lector = PyPDF2.PdfReader(file.file)
    texto_crudo = "".join([pagina.extract_text() for pagina in lector.pages])

    # 2. El Prompt Sistémico (Usando el modelo universal)
    modelo = genai.GenerativeModel('gemini-3.5-flash')
    prompt = f'''
    Actúa como un analista financiero. Analiza el siguiente texto de un estado de cuenta.
    Extrae todas las transacciones y devuelve EXCLUSIVAMENTE un arreglo en formato JSON válido.
    Cada transacción debe tener esta estructura exacta:
    {{"fecha": "YYYY-MM-DD", "monto": 0.00 (siempre positivo), "tipo": "CARGO" o "ABONO", "descripcion": "Concepto del movimiento"}}
    No incluyas texto adicional, ni saludos, ni formato Markdown (```json). Solo devuelve el JSON puro.
    
    Texto del banco: {texto_crudo}
    '''

    # 3. Procesamiento con IA
    respuesta = modelo.generate_content(prompt)
    
    # 4. Limpiamos la respuesta y la convertimos en un objeto de Python
    texto_limpio = respuesta.text.strip().removeprefix("```json").removesuffix("```").strip()
    
    return json.loads(texto_limpio)

@router.get("/cuenta/{cuenta_id}/saldo", response_model=Dict[str, Decimal])
def obtener_saldo_actual(
    cuenta_id: str, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Ejecuta el recálculo dinámico del balance vivo de una cuenta específica.
    *Ruta Protegida: Requiere Token JWT.*
    """
    saldo = crud_transaccion.get_saldo_cuenta_al_vuelo(session=session, cuenta_id=cuenta_id)
    if saldo is None:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    return {"saldo_actual": saldo}

@router.get("/resumen/mes-actual", response_model=ResumenMesActual)
def resumen_mensual(
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """
    Obtiene el tablero de control del mes actual: Total de gastos, 
    promedio diario y desglose porcentual por subcategoría.
    """
    return crud_transaccion.obtener_resumen_mes_actual(session)

@router.get("/analitica/gastos", response_model=list[GastoPorCategoria])
def obtener_analitica_gastos(
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """
    Agrupa todos los movimientos de tipo CARGO por categoría, 
    calculando su valor real en moneda base (MXN).
    """
    monto_mxn = Transaccion.monto * Transaccion.tipo_de_cambio
    
    consulta = (
        select(
            Categoria.nombre_categoria.label("nombre"),
            func.sum(monto_mxn).label("total")
        )
        .join(Categoria, Transaccion.categoria_id == Categoria.id)
        .where(Transaccion.tipo == "CARGO")
        .group_by(Categoria.nombre_categoria)
        .order_by(func.sum(monto_mxn).desc())
    )
    
    resultados = session.exec(consulta).all()
    return [{"nombre": row.nombre, "total": row.total} for row in resultados]

@router.get("/", response_model=PaginatedTransacciones)
def listar_transacciones(
    skip: int = 0, 
    limit: int = 50,
    cuenta_id: Optional[str] = None,
    tipo: Optional[TipoMovimiento] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Obtiene el historial de transacciones. 
    Permite filtrar por cuenta, tipo de movimiento y rango de fechas.
    Resultados paginados y ordenados por fecha descendente.
    *Ruta Protegida: Requiere Token JWT.*
    """
    total, registros = crud_transaccion.get_transacciones(
        session=session,
        skip=skip,
        limit=limit,
        cuenta_id=cuenta_id,
        tipo=tipo,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

    return {
        "total_registros": total,
        "skip": skip,
        "limit": limit,
        "data": registros
    }
    
@router.delete("/{transaccion_id}")
def eliminar_transaccion(
    transaccion_id: str, 
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Elimina un movimiento histórico. Los saldos se recalcularán automáticamente."""
    transaccion = session.get(Transaccion, transaccion_id)
    if not transaccion:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    session.delete(transaccion)
    session.commit()
    return {"mensaje": "Transacción eliminada correctamente"}


@router.put("/{transaccion_id}")
def actualizar_transaccion(
    transaccion_id: str,
    datos_actualizados: TransaccionUpdate,
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza uno o varios campos de un movimiento existente."""
    transaccion = session.get(Transaccion, transaccion_id)
    if not transaccion:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    # model_dump(exclude_unset=True) asegura que solo actualicemos lo que el usuario envió
    datos_dict = datos_actualizados.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(transaccion, key, value)
        
    session.add(transaccion)
    session.commit()
    session.refresh(transaccion)
    
    return transaccion