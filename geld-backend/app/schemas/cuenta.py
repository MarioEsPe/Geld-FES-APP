# app/schemas/cuenta.py
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional

# 1. Lo que requerimos para crear una cuenta
class CuentaCreate(BaseModel):
    id: str = Field(..., max_length=20, description="ID único, ej. CTA-001")
    nombre_cuenta: str = Field(..., max_length=100)
    # Exigimos Decimal para evitar errores de coma flotante. Un 0 literal será un Decimal("0.00") válido.
    saldo_inicial: Decimal = Field(default=Decimal("0.00"), decimal_places=2)
    moneda: str = Field(default="MXN", max_length=3)
    tipo_cuenta: str = Field(..., max_length=50, description="Ej. EFECTIVO, DEBITO, TARJETA DE CREDITO")

# 2. Lo que devolvemos al consultar
class CuentaRead(BaseModel):
    id: str
    nombre_cuenta: str
    saldo_inicial: Decimal
    moneda: str
    tipo_cuenta: str
    
    model_config = ConfigDict(from_attributes=True)
    
class CuentaUpdate(BaseModel):
    nombre_cuenta: Optional[str] = None
    saldo_inicial: Optional[Decimal] = None
    moneda: Optional[str] = None    