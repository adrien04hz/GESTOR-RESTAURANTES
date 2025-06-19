# En tu archivo routes/autenticacion.py o similar
Add comment
More actions

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from bcrypt import hashpw, checkpw, gensalt # Para hashear contraseñas
# from ..database import db_client # Importar tu cliente de DB


# from ..models import ClienteDB # Tu modelo Pydantic para el cliente en DB

router = APIRouter()

# Modelos Pydantic para la entrada y salida

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    cliente_id: str
    nombre_cliente: str


# **Aquí entra la clase Cliente de tu lógica de negocio (no la de Pydantic/DB)**
# Podrías tener un "Servicio" o "Manager" que encapsule esta lógica


class ClienteManager:

    def __init__(self, db_collection):
        self.clientes_collection = db_collection

    # Este método es una versión de tu iniciarSesion

    async def autenticar_cliente(self, email: str, contrasena: str):

        # 1. Buscar el cliente en la base de datos

        cliente_data = await self.clientes_collection.find_one({"email": email})

        if not cliente_data:
            return None # Cliente no encontrado

        # 2. Verificar la contraseña hasheada


        # Asumiendo que guardaste el hash de la contraseña en la DB

        if checkpw(contrasena.encode('utf-8'), cliente_data["password"].encode('utf-8')):

            # Si las credenciales son correctas, puedes crear una instancia de tu clase Cliente

            # para acceder a otras propiedades o métodos si fuera necesario en este punto

            # cliente_obj = Cliente(nombre=cliente_data["nombre"], ...)

            return cliente_data # Retorna los datos del cliente autenticado
        return None # Contraseña incorrecta

# En tu endpoint de FastAPI


@router.post("/autenticar/cliente", response_model=LoginResponse)

async def login_cliente(login_data: LoginRequest):

    # Asumiendo que 'db' es tu objeto de base de datos de MongoDB

    cliente_manager = ClienteManager(db.clientes) # Inicializas tu "manager" con la colección de clientes

    cliente_autenticado_data = await cliente_manager.autenticar_cliente(
        login_data.email,
        login_data.password
    )

    if not cliente_autenticado_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # Generar un token JWT si el inicio de sesión fue exitoso

    access_token = "tu_token_jwt_aqui" # Lógica real para generar JWT

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        cliente_id=str(cliente_autenticado_data["_id"]), # Convertir ObjectId a string
        nombre_cliente=cliente_autenticado_data["nombre"]
    )