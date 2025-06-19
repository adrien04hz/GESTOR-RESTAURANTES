# main.py
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from Models.Cliente import ClienteCreate, ClienteResponse, LoginRequest, LoginResponse
from Models.Cliente import Cliente as DomainCliente
from Models.Token import TokenResponse

from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)

load_dotenv()

app = FastAPI()

# =======================================================
# Configuración de CORS
# =======================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# =======================================================


# ======================================================
# Conexión a la base de datos MongoDB
# ======================================================
MONGO_URL = os.getenv("MONGO_URL")  
client = AsyncIOMotorClient(MONGO_URL)
db = client["sistema_resta"]
# ======================================================


# ======================================================
# colecciones de toda la base de datos
# ======================================================
Carrito = db["Carrito"]
Clientes = db["Clientes"]
Departamentos = db["Departamentos"]
DetallesCarrito = db["DetallesCarrito"]
Empleados = db["Empleados"]
EmpleadosAdmin = db["EmpleadosAdmin"]
EstadosPedido = db["EstadosPedido"]
HorariosAdmin = db["HorariosAdmin"]
HorariosEmpleados = db["HorariosEmpleados"]
LogSistemaAdmin = db["LogSistemaAdmin"]
LogSistemaEmpleados = db["LogSistemaEmpleados"]
PayPalCliente = db["PayPalCliente"]
PedidosCliente = db["PedidosCliente"]
Productos = db["Productos"]
ProductosPedido = db["ProductosPedido"]
Roles = db["Roles"]
RolesAdmin = db["RolesAdmin"]
Sucursales = db["Sucursales"]
TarjetasCredito = db["TarjetasCredito"]
TarjetasDebito = db["TarjetasDebito"]
# ======================================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    email: str | None = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await Clientes.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@app.get("/")
async def root():
    return {"message": "Mongo conectado"}


# endpoint para listar todos los productos de una sucursal
@app.get("/Productos/{sucursal}")
async def listar(sucursal: int):
    cursor = Productos.find({"id_sucursal": sucursal}, {"_id": 0}).sort("id", 1)
    productos = [doc async for doc in cursor]

    if productos:
        return {
            "success": True,
            "count": len(productos),
            "data": productos
        }
    else:
        return {
            "success": False,
            "message": "No se encontraron productos para la sucursal especificada."
        }


@app.get("/mis-datos")
async def mis_datos(current_user=Depends(get_current_user)):
    cliente = await Clientes.find_one(
        {"email": current_user["email"]},
        {"_id": 0, "id": 0}
    )

    if not cliente:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "No se encontró al cliente"},
        )
    cliente['contrasena'] = "********"
    return {
        "success": True,
        "data": cliente
    }
        
@app.post("/create-client", response_model=TokenResponse, status_code=201)
async def create_client(cliente: ClienteCreate):
    if await Clientes.find_one({"$or": [{"email": cliente.email}, {"id": cliente.id}]}):
        raise HTTPException(
            status_code=409,
            detail="El correo o el id ya existe dentro de la base de datos",
        )

    doc = cliente.model_dump()
    doc["contrasena"] = hash_password(doc["contrasena"])
    await Clientes.insert_one(doc)

    # token con el email como sujeto
    token = create_access_token({"sub": cliente.email})
    return TokenResponse(access_token=token)
    

@app.post("/login", response_model=TokenResponse, status_code=200)
async def login(datos: LoginRequest):
    user = await Clientes.find_one({"email": datos.email})
    if not user or not verify_password(datos.contrasena, user["contrasena"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token({"sub": user["email"]})
    return TokenResponse(access_token=token)