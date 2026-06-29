# app/models/domain.py
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4
from enum import Enum

# --- Enums ---
class TipoMovimiento(str, Enum):
    CARGO = "CARGO"
    ABONO = "ABONO"
    TRANSFERENCIA = "TRANSFERENCIA"

# --- Modelos de Base de Datos ---

class Familia(SQLModel, table=True):
    __tablename__ = "familias"
    
    id: str = Field(primary_key=True, max_length=50)
    nombre_familia: str = Field(unique=True, index=True, max_length=100)
    
    # Relación inversa
    categorias: List["Categoria"] = Relationship(back_populates="familia")


class Categoria(SQLModel, table=True):
    __tablename__ = "categorias"
    
    id: str = Field(primary_key=True, max_length=20)
    nombre_categoria: str = Field(max_length=100)
    presupuesto_mensual: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    icono: Optional[str] = Field(default=None, max_length=50)
    familia_id: str = Field(foreign_key="familias.id")
    
    # Relaciones
    familia: Familia = Relationship(back_populates="categorias")
    transacciones: List["Transaccion"] = Relationship(back_populates="categoria")


class Cuenta(SQLModel, table=True):
    __tablename__ = "cuentas"
    
    id: str = Field(primary_key=True, max_length=20)
    nombre_cuenta: str = Field(max_length=100)
    saldo_inicial: Decimal = Field(default=Decimal("0.00"), max_digits=15, decimal_places=2)
    moneda: str = Field(default="MXN", max_length=3)
    tipo_cuenta: str = Field(max_length=50)
    
    # Relaciones (Transacciones donde esta cuenta es origen)
    transacciones_origen: List["Transaccion"] = Relationship(
        back_populates="cuenta_origen",
        sa_relationship_kwargs={"foreign_keys": "Transaccion.cuenta_id"}
    )
    # Relaciones (Transacciones donde esta cuenta es destino)
    transacciones_destino: List["Transaccion"] = Relationship(
        back_populates="cuenta_destino",
        sa_relationship_kwargs={"foreign_keys": "Transaccion.cuenta_destino_id"}
    )


class Transaccion(SQLModel, table=True):
    __tablename__ = "transacciones"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    fecha: date = Field(index=True)
    monto: Decimal = Field(max_digits=15, decimal_places=2)
    tipo: TipoMovimiento
    categoria_id: str = Field(foreign_key="categorias.id")
    cuenta_id: str = Field(foreign_key="cuentas.id")
    cuenta_destino_id: Optional[str] = Field(default=None, foreign_key="cuentas.id")
    tipo_de_cambio: Decimal = Field(default=Decimal("1.0000"), max_digits=10, decimal_places=4)
    descripcion: Optional[str] = None
    
    # Relaciones
    categoria: Categoria = Relationship(back_populates="transacciones")
    cuenta_origen: Cuenta = Relationship(
        back_populates="transacciones_origen",
        sa_relationship_kwargs={"foreign_keys": "[Transaccion.cuenta_id]"}
    )
    cuenta_destino: Optional[Cuenta] = Relationship(
        back_populates="transacciones_destino",
        sa_relationship_kwargs={"foreign_keys": "[Transaccion.cuenta_destino_id]"}
    )
    
class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(..., description="Contraseña encriptada con bcrypt")
    is_active: bool = Field(default=True)    