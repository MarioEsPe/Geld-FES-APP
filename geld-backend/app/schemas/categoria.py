# app/schemas/categoria.py
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional

class CategoriaCreate(BaseModel):
    id: str = Field(..., max_length=20, description="ID único, ej. CAT-001")
    nombre_categoria: str = Field(..., max_length=100)
    presupuesto_mensual: Decimal = Field(default=Decimal("0.00"), decimal_places=2)
    icono: Optional[str] = Field(default=None, max_length=50)
    familia_id: str = Field(..., description="ID de la familia a la que pertenece")

class CategoriaRead(BaseModel):
    id: str
    nombre_categoria: str
    presupuesto_mensual: Decimal
    icono: Optional[str]
    familia_id: str
    
    model_config = ConfigDict(from_attributes=True)