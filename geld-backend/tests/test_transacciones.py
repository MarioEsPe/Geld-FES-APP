# tests/test_transacciones.py
from fastapi.testclient import TestClient
from sqlmodel import Session
from decimal import Decimal
from app.models.domain import Cuenta, Categoria, Familia

def setup_datos_base(session: Session):
    """Crea la familia, categoría y cuenta necesarias para probar las transacciones."""
    familia = Familia(id="FAM-TEST", nombre_familia="Pruebas")
    categoria = Categoria(id="CAT-TEST", nombre_categoria="Gastos Test", familia_id="FAM-TEST")
    # APLICAMOS LA REGLA DE CERO ESTRICTO: Inicializamos con 0.00 literal.
    cuenta = Cuenta(
        id="CTA-TEST", 
        nombre_cuenta="Cuenta Cero", 
        saldo_inicial=Decimal("0.00"), 
        tipo_cuenta="EFECTIVO"
    )
    
    session.add(familia)
    session.add(categoria)
    session.add(cuenta)
    session.commit()

def test_bloquear_transferencia_sin_destino(client: TestClient, session: Session):
    """Verifica que el schema de Pydantic intercepte y bloquee el error de negocio."""
    setup_datos_base(session)
    
    payload = {
        "fecha": "2026-06-25",
        "monto": 500.00,
        "tipo": "TRANSFERENCIA",
        "categoria_id": "CAT-TEST",
        "cuenta_id": "CTA-TEST",
        "cuenta_destino_id": None # <-- Esto debe detonar el error
    }
    
    # IMPORTANTE: Como pusimos candados JWT, las pruebas también los necesitan.
    # Para esta prueba, asumimos que deshabilitaste temporalmente el Depends(obtener_usuario_actual) 
    # en el router, o debes generar un token de prueba e inyectarlo en los headers.
    # Por simplicidad de la prueba del Core, asumiremos que la ruta está libre o usas un override del usuario.
    
    response = client.post("/transacciones/", json=payload)
    
    # Esperamos un HTTP 422 (Unprocessable Entity) que lanza Pydantic al fallar la validación
    assert response.status_code == 422
    assert "Una transferencia requiere obligatoriamente una cuenta de destino" in response.text

def test_calculo_saldo_vivo_con_cero_inicial(client: TestClient, session: Session):
    """Verifica que el cálculo matemático al vuelo sea perfecto partiendo de un cero."""
    setup_datos_base(session)
    
    # 1. Insertamos un Abono de 1000
    client.post("/transacciones/", json={
        "fecha": "2026-06-25", "monto": 1000.00, "tipo": "ABONO",
        "categoria_id": "CAT-TEST", "cuenta_id": "CTA-TEST"
    })
    
    # 2. Insertamos un Cargo de 350.50
    client.post("/transacciones/", json={
        "fecha": "2026-06-26", "monto": 350.50, "tipo": "CARGO",
        "categoria_id": "CAT-TEST", "cuenta_id": "CTA-TEST"
    })
    
    # 3. Consultamos el saldo actual de la cuenta
    response = client.get("/transacciones/cuenta/CTA-TEST/saldo")
    
    assert response.status_code == 200
    datos = response.json()
    
    # La matemática debe ser exacta: 0.00 (inicial) + 1000.00 - 350.50 = 649.50
    assert datos["saldo_actual"] == "649.50"