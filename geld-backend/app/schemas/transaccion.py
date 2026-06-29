# app/schemas/transaccion.py
from pydantic import BaseModel, Field, model_validator, ConfigDict
from decimal import Decimal
from datetime import date
from typing import Optional
from uuid import UUID
from app.models.domain import TipoMovimiento
from typing import List

class TransaccionCreate(BaseModel):
    fecha: date
    # Validamos que el monto siempre sea mayor a 0 (el tipo de movimiento define si suma o resta)
    monto: Decimal = Field(..., gt=0, decimal_places=2)
    tipo: TipoMovimiento
    categoria_id: str = Field(..., max_length=20)
    cuenta_id: str = Field(..., max_length=20)
    cuenta_destino_id: Optional[str] = Field(default=None, max_length=20)
    tipo_de_cambio: Decimal = Field(default=Decimal("1.0000"), decimal_places=4)
    descripcion: Optional[str] = None

    @model_validator(mode='after')
    def check_reglas_negocio(self) -> 'TransaccionCreate':
        # 1. Regla de Transferencias
        if self.tipo == TipoMovimiento.TRANSFERENCIA and not self.cuenta_destino_id:
            raise ValueError('Una transferencia requiere obligatoriamente una cuenta de destino')
        
        # 2. Evitar cuenta destino en cargos/abonos normales
        if self.tipo != TipoMovimiento.TRANSFERENCIA and self.cuenta_destino_id:
            raise ValueError('Solo las transferencias pueden tener una cuenta de destino')
        
        # 3. Prevenir transferencias a la misma cuenta
        if self.cuenta_id == self.cuenta_destino_id:
            raise ValueError('La cuenta origen y destino no pueden ser la misma')
            
        return self
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "fecha": "2026-06-25",
                "monto": 1500.50,
                "tipo": "TRANSFERENCIA",
                "categoria_id": "CAT-001",
                "cuenta_id": "CTA-001",
                "cuenta_destino_id": "CTA-002",
                "tipo_de_cambio": 1.0000,
                "descripcion": "Traspaso a cuenta de ahorro"
            }
        }
    )

class TransaccionRead(BaseModel):
    id: UUID
    fecha: date
    monto: Decimal
    tipo: TipoMovimiento
    categoria_id: str
    cuenta_id: str
    cuenta_destino_id: Optional[str]
    tipo_de_cambio: Decimal
    descripcion: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)
    
class PaginatedTransacciones(BaseModel):
    total_registros: int
    skip: int
    limit: int
    data: List[TransaccionRead]
    
    model_config = ConfigDict(from_attributes=True)    