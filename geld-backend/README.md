GELD API - Core Financiero

Motor transaccional backend desarrollado por Innova Praxis. Diseñado para ofrecer gestión de finanzas personales de alta disponibilidad, con un enfoque estricto en la integridad matemática y el rendimiento.

--- TECNOLOGÍAS PRINCIPALES ---
* Framework: FastAPI (Python)
* Base de Datos: PostgreSQL
* ORM & Validación: SQLModel + Pydantic (Cálculos de precisión con Decimal)
* Migraciones: Alembic
* Seguridad: Autenticación JWT (JSON Web Tokens) y cifrado Bcrypt
* Testing: Pytest

--- ARQUITECTURA CLEAN & LÓGICA DE NEGOCIO ---
La aplicación está construida separando responsabilidades (Schemas, CRUD, Endpoints). Destacan las siguientes implementaciones técnicas:

* Cálculo de Saldos al Vuelo: Uso de funciones agregadas y coalesce en PostgreSQL para calcular balances vivos en tiempo real.
* Manejo Estricto del Cero: Configuración paramétrica que garantiza que los saldos iniciales en cero literal sean operables y no generen errores nulos.
* Interceptores Globales: Manejo centralizado de excepciones (HTTP 400 y 500) para evitar exposición de trazas de base de datos.
* Consultas Maximizadas: Endpoints con paginación optimizada y filtros dinámicos.

--- INSTALACIÓN Y EJECUCIÓN LOCAL ---

1. Clonar el repositorio y crear entorno virtual:
   python -m venv venv
   venv\Scripts\activate  (Para Windows)

2. Instalar dependencias:
   pip install -r requirements.txt

3. Configurar variables de entorno:
   Crear un archivo .env en la raíz con DATABASE_URL y SECRET_KEY.

4. Ejecutar migraciones para construir la base de datos:
   alembic upgrade head

5. Levantar el servidor de desarrollo:
   uvicorn app.main:app --reload

La documentación interactiva (Swagger UI) estará disponible en http://127.0.0.1:8000/docs.