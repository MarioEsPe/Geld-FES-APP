# app/crud/crud_transaccion.py
from datetime import date
from typing import Optional, Tuple, List
from sqlmodel import Session, select, func
from decimal import Decimal
from app.models.domain import Transaccion, Cuenta, TipoMovimiento, Categoria, Familia
from app.schemas.transaccion import TransaccionCreate
from uuid import UUID

def create_transaccion(session: Session, transaccion_in: TransaccionCreate, usuario_id: UUID) -> Transaccion:
    datos_dict = transaccion_in.model_dump()
    datos_dict["usuario_id"] = usuario_id
    db_transaccion = Transaccion(**datos_dict)
    
    session.add(db_transaccion)
    session.commit()
    session.refresh(db_transaccion)
    return db_transaccion

def get_saldo_cuenta_al_vuelo(session: Session, cuenta_id: str, usuario_id: UUID) -> Decimal:
    cuenta = session.exec(select(Cuenta).where(Cuenta.id == cuenta_id, Cuenta.usuario_id == usuario_id)).first()
    if not cuenta:
        return None
        
    saldo_base = cuenta.saldo_inicial
    monto_calc = Transaccion.monto * Transaccion.tipo_de_cambio if cuenta.moneda == "MXN" else Transaccion.monto

    abonos = session.exec(select(func.coalesce(func.sum(monto_calc), Decimal("0.00"))).where(Transaccion.cuenta_id == cuenta_id, Transaccion.tipo == TipoMovimiento.ABONO, Transaccion.usuario_id == usuario_id)).one()
    cargos = session.exec(select(func.coalesce(func.sum(monto_calc), Decimal("0.00"))).where(Transaccion.cuenta_id == cuenta_id, Transaccion.tipo == TipoMovimiento.CARGO, Transaccion.usuario_id == usuario_id)).one()
    transf_salidas = session.exec(select(func.coalesce(func.sum(monto_calc), Decimal("0.00"))).where(Transaccion.cuenta_id == cuenta_id, Transaccion.tipo == TipoMovimiento.TRANSFERENCIA, Transaccion.usuario_id == usuario_id)).one()
    transf_entradas = session.exec(select(func.coalesce(func.sum(monto_calc), Decimal("0.00"))).where(Transaccion.cuenta_destino_id == cuenta_id, Transaccion.tipo == TipoMovimiento.TRANSFERENCIA, Transaccion.usuario_id == usuario_id)).one()

    return saldo_base + abonos - cargos - transf_salidas + transf_entradas

def get_transacciones(session: Session, usuario_id: UUID, skip: int = 0, limit: int = 100, cuenta_id: Optional[str] = None, tipo: Optional[TipoMovimiento] = None, fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None) -> Tuple[int, List[Transaccion]]:
    query = select(Transaccion).where(Transaccion.usuario_id == usuario_id)
    
    if cuenta_id:
        query = query.where((Transaccion.cuenta_id == cuenta_id) | (Transaccion.cuenta_destino_id == cuenta_id))
    if tipo:
        query = query.where(Transaccion.tipo == tipo)
    if fecha_inicio:
        query = query.where(Transaccion.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.where(Transaccion.fecha <= fecha_fin)
        
    count_query = select(func.count()).select_from(query.subquery())
    total_registros = session.exec(count_query).one()
    
    query = query.order_by(Transaccion.fecha.desc()).offset(skip).limit(limit)
    transacciones = session.exec(query).all()
    
    return total_registros, transacciones

def obtener_resumen_mes_actual(session: Session, usuario_id: UUID) -> dict:
    hoy = date.today()
    primer_dia_mes = hoy.replace(day=1)
    dias_transcurridos = hoy.day

    monto_mxn = Transaccion.monto * Transaccion.tipo_de_cambio

    total_gastos = session.exec(
        select(func.coalesce(func.sum(monto_mxn), Decimal("0.00")))
        .where(Transaccion.tipo == "CARGO", Transaccion.usuario_id == usuario_id)
        .where(Transaccion.fecha >= primer_dia_mes)
        .where(Transaccion.fecha <= hoy)
    ).one()

    promedio_diario = total_gastos / Decimal(dias_transcurridos) if dias_transcurridos > 0 else Decimal("0.00")

    statement = (
        select(Familia.nombre_familia, Categoria.nombre_categoria, Categoria.icono, Categoria.presupuesto_mensual, func.sum(monto_mxn).label("total_gastado"))
        .join(Categoria, Transaccion.categoria_id == Categoria.id)
        .join(Familia, Categoria.familia_id == Familia.id)
        .where(Transaccion.tipo == "CARGO", Transaccion.usuario_id == usuario_id)
        .where(Transaccion.fecha >= primer_dia_mes)
        .where(Transaccion.fecha <= hoy)
        .group_by(Familia.nombre_familia, Categoria.nombre_categoria, Categoria.icono, Categoria.presupuesto_mensual)
        .order_by(func.sum(monto_mxn).desc()) 
    )
    
    resultados_db = session.exec(statement).all()
    
    desglose = []
    for familia_nom, cat_nom, icono, ppto, gastado in resultados_db:
        ppto_dec = ppto or Decimal("0.00")
        porcentaje = (gastado / ppto_dec * Decimal("100.00")) if ppto_dec > 0 else Decimal("0.00")
        desglose.append({
            "categoria_principal": familia_nom, "subcategoria": cat_nom, "icono": icono or "🏷️",
            "total_gastado": gastado, "presupuesto_mensual": ppto_dec, "porcentaje_usado": round(porcentaje, 2)
        })

    return {"total_gastos": round(total_gastos, 2), "dias_transcurridos": dias_transcurridos, "promedio_diario": round(promedio_diario, 2), "desglose": desglose}