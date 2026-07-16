# app/crud/crud_transaccion.py
from datetime import date
from typing import Optional, Tuple, List
from sqlmodel import Session, select, func
from decimal import Decimal
from sqlalchemy import func
from app.models.domain import Transaccion, Cuenta, TipoMovimiento, Categoria, Familia
from app.schemas.transaccion import TransaccionCreate

def create_transaccion(session: Session, transaccion_in: TransaccionCreate) -> Transaccion:
    db_transaccion = Transaccion.model_validate(transaccion_in)
    session.add(db_transaccion)
    session.commit()
    session.refresh(db_transaccion)
    return db_transaccion

def get_saldo_cuenta_al_vuelo(session: Session, cuenta_id: str) -> Decimal:
    """
    Calcula el saldo real iterando sobre el saldo inicial y el historial de transacciones.
    Garantiza la exactitud procesando todos los valores como Decimal.
    """
    cuenta = session.get(Cuenta, cuenta_id)
    if not cuenta:
        return None
        
    saldo_base = cuenta.saldo_inicial

    # Sumatoria de Abonos
    abonos = session.exec(
        select(func.coalesce(func.sum(Transaccion.monto), Decimal("0.00")))
        .where(Transaccion.cuenta_id == cuenta_id, Transaccion.tipo == TipoMovimiento.ABONO)
    ).one()

    # Sumatoria de Cargos
    cargos = session.exec(
        select(func.coalesce(func.sum(Transaccion.monto), Decimal("0.00")))
        .where(Transaccion.cuenta_id == cuenta_id, Transaccion.tipo == TipoMovimiento.CARGO)
    ).one()

    # Sumatoria de Transferencias (Salidas)
    transf_salidas = session.exec(
        select(func.coalesce(func.sum(Transaccion.monto), Decimal("0.00")))
        .where(Transaccion.cuenta_id == cuenta_id, Transaccion.tipo == TipoMovimiento.TRANSFERENCIA)
    ).one()

    # Sumatoria de Transferencias (Entradas)
    transf_entradas = session.exec(
        select(func.coalesce(func.sum(Transaccion.monto), Decimal("0.00")))
        .where(Transaccion.cuenta_destino_id == cuenta_id, Transaccion.tipo == TipoMovimiento.TRANSFERENCIA)
    ).one()

    # Ecuación final de balance
    saldo_actual = saldo_base + abonos - cargos - transf_salidas + transf_entradas
    return saldo_actual

def get_transacciones(
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    cuenta_id: Optional[str] = None,
    tipo: Optional[TipoMovimiento] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
) -> Tuple[int, List[Transaccion]]:
    """
    Obtiene transacciones con filtros dinámicos y paginación.
    Retorna una tupla con (Total de registros, Lista de transacciones).
    """
    # 1. Iniciamos la base de la consulta
    query = select(Transaccion)
    
    # 2. Aplicamos filtros dinámicamente solo si el usuario los proporcionó
    if cuenta_id:
        # Filtramos transacciones donde la cuenta sea origen O destino (para transferencias)
        query = query.where(
            (Transaccion.cuenta_id == cuenta_id) | (Transaccion.cuenta_destino_id == cuenta_id)
        )
    if tipo:
        query = query.where(Transaccion.tipo == tipo)
    if fecha_inicio:
        query = query.where(Transaccion.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.where(Transaccion.fecha <= fecha_fin)
        
    # 3. Contamos el total de registros que coinciden con los filtros (antes de paginar)
    count_query = select(func.count()).select_from(query.subquery())
    total_registros = session.exec(count_query).one()
    
    # 4. Aplicamos paginación y ordenamos de la más reciente a la más antigua
    query = query.order_by(Transaccion.fecha.desc()).offset(skip).limit(limit)
    
    # 5. Ejecutamos la consulta final
    transacciones = session.exec(query).all()
    
    return total_registros, transacciones

def obtener_resumen_mes_actual(session: Session) -> dict:
    hoy = date.today()
    primer_dia_mes = hoy.replace(day=1)
    dias_transcurridos = hoy.day

    # 1. Calcular el total de gastos (CARGOS) del mes en curso
    total_gastos = session.exec(
        select(func.sum(Transaccion.monto))
        .where(Transaccion.tipo == "CARGO")
        .where(Transaccion.fecha >= primer_dia_mes)
        .where(Transaccion.fecha <= hoy)
    ).first() or Decimal("0.00")

    # 2. Calcular promedio diario
    promedio_diario = total_gastos / Decimal(dias_transcurridos) if dias_transcurridos > 0 else Decimal("0.00")

    # 3. Extraer desglose agrupado haciendo JOIN con Categorías y Familias
    statement = (
        select(
            Familia.nombre_familia,
            Categoria.nombre_categoria,
            Categoria.icono,
            Categoria.presupuesto_mensual,
            func.sum(Transaccion.monto).label("total_gastado")
        )
        .join(Categoria, Transaccion.categoria_id == Categoria.id)
        .join(Familia, Categoria.familia_id == Familia.id)
        .where(Transaccion.tipo == "CARGO")
        .where(Transaccion.fecha >= primer_dia_mes)
        .where(Transaccion.fecha <= hoy)
        .group_by(Familia.nombre_familia, Categoria.nombre_categoria, Categoria.icono, Categoria.presupuesto_mensual)
        .order_by(func.sum(Transaccion.monto).desc()) # Ordenar de mayor a menor gasto
    )
    
    resultados_db = session.exec(statement).all()
    
    desglose = []
    for familia_nom, cat_nom, icono, ppto, gastado in resultados_db:
        ppto_dec = ppto or Decimal("0.00")
        # Calculamos el porcentaje, evitando divisiones por cero
        porcentaje = (gastado / ppto_dec * Decimal("100.00")) if ppto_dec > 0 else Decimal("0.00")
        
        desglose.append({
            "categoria_principal": familia_nom,
            "subcategoria": cat_nom,
            "icono": icono or "🏷️",
            "total_gastado": gastado,
            "presupuesto_mensual": ppto_dec,
            "porcentaje_usado": round(porcentaje, 2)
        })

    return {
        "total_gastos": round(total_gastos, 2),
        "dias_transcurridos": dias_transcurridos,
        "promedio_diario": round(promedio_diario, 2),
        "desglose": desglose
    }