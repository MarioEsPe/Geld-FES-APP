# app/api/endpoints/transacciones.py
from datetime import date
from typing import Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from decimal import Decimal
from sqlalchemy import func
import google.generativeai as genai
import PyPDF2
import json

from app.db.database import get_session
from app.schemas.transaccion import TransaccionCreate, TransaccionRead, PaginatedTransacciones, GastoPorCategoria, TransaccionUpdate, ResumenMesActual
from app.crud import crud_transaccion
from app.models.domain import TipoMovimiento, Usuario, Transaccion, Categoria
from app.api.deps import obtener_usuario_actual
from app.core.config import settings

router = APIRouter()
genai.configure(api_key=settings.GEMINI_API_KEY)

@router.post("/", response_model=TransaccionRead, status_code=201)
def registrar_transaccion(transaccion: TransaccionCreate, session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    return crud_transaccion.create_transaccion(session=session, transaccion_in=transaccion, usuario_id=usuario_actual.id)

@router.post("/extraer-pdf")
async def extraer_datos_pdf(file: UploadFile = File(...), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    lector = PyPDF2.PdfReader(file.file)
    texto_crudo = "".join([pagina.extract_text() for pagina in lector.pages])

    modelo = genai.GenerativeModel('gemini-3.5-flash')
    prompt = f'''
    Actúa como un analista financiero. Analiza el siguiente texto de un estado de cuenta.
    Extrae todas las transacciones y devuelve EXCLUSIVAMENTE un arreglo en formato JSON válido.
    Cada transacción debe tener esta estructura exacta:
    {{"fecha": "YYYY-MM-DD", "monto": 0.00 (siempre positivo), "tipo": "CARGO" o "ABONO", "descripcion": "Concepto del movimiento"}}
    No incluyas texto adicional, ni saludos, ni formato Markdown (```json). Solo devuelve el JSON puro.
    Texto del banco: {texto_crudo}
    '''
    respuesta = modelo.generate_content(prompt)
    texto_limpio = respuesta.text.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(texto_limpio)

@router.get("/cuenta/{cuenta_id}/saldo", response_model=Dict[str, Decimal])
def obtener_saldo_actual(cuenta_id: str, session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    saldo = crud_transaccion.get_saldo_cuenta_al_vuelo(session=session, cuenta_id=cuenta_id, usuario_id=usuario_actual.id)
    if saldo is None:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return {"saldo_actual": saldo}

@router.get("/resumen/mes-actual", response_model=ResumenMesActual)
def resumen_mensual(session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    return crud_transaccion.obtener_resumen_mes_actual(session, usuario_actual.id)

@router.get("/analitica/gastos", response_model=list[GastoPorCategoria])
def obtener_analitica_gastos(session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    monto_mxn = Transaccion.monto * Transaccion.tipo_de_cambio
    consulta = (
        select(Categoria.nombre_categoria.label("nombre"), func.sum(monto_mxn).label("total"))
        .join(Categoria, Transaccion.categoria_id == Categoria.id)
        .where(Transaccion.tipo == "CARGO", Transaccion.usuario_id == usuario_actual.id)
        .group_by(Categoria.nombre_categoria)
        .order_by(func.sum(monto_mxn).desc())
    )
    resultados = session.exec(consulta).all()
    return [{"nombre": row.nombre, "total": row.total} for row in resultados]

@router.get("/", response_model=PaginatedTransacciones)
def listar_transacciones(skip: int = 0, limit: int = 50, cuenta_id: Optional[str] = None, tipo: Optional[TipoMovimiento] = None, fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None, session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    total, registros = crud_transaccion.get_transacciones(session=session, usuario_id=usuario_actual.id, skip=skip, limit=limit, cuenta_id=cuenta_id, tipo=tipo, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
    return {"total_registros": total, "skip": skip, "limit": limit, "data": registros}
    
@router.delete("/{transaccion_id}")
def eliminar_transaccion(transaccion_id: str, session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    transaccion = session.exec(select(Transaccion).where(Transaccion.id == transaccion_id, Transaccion.usuario_id == usuario_actual.id)).first()
    if not transaccion:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    session.delete(transaccion)
    session.commit()
    return {"mensaje": "Transacción eliminada correctamente"}

@router.put("/{transaccion_id}")
def actualizar_transaccion(transaccion_id: str, datos_actualizados: TransaccionUpdate, session: Session = Depends(get_session), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    transaccion = session.exec(select(Transaccion).where(Transaccion.id == transaccion_id, Transaccion.usuario_id == usuario_actual.id)).first()
    if not transaccion:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    datos_dict = datos_actualizados.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(transaccion, key, value)
        
    session.add(transaccion)
    session.commit()
    session.refresh(transaccion)
    return transaccion