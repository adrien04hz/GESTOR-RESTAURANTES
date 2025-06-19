# main.py
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt
import os
import traceback
from Models.Cliente import ClienteCreate, ClienteResponse
from Models.Cliente import Cliente as DomainCliente

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

def hash_password(passw:str):
        return bcrypt.hashpw(passw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

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


@app.get('/details-client/{client}')
async def get_client(client: int):
    cliente = Clientes.find({'id':client}, {'_id':0, 'password':0})
    if cliente:
        datos_cliente = [cli async for cli in cliente]
        return {
            "success": True,
            "count": 1,
            "data": datos_cliente
        }
    else:
        return {
            "success": False,
            "message": "No se encontro al cliente"
        }
        
@app.post('/create-client', response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_client(cliente: ClienteCreate):
    correo_existe = await Clientes.find_one(
        {"email": cliente.email},
        {"_id": 0},
    )
    
    id_existe = await Clientes.find_one(
        {'id':cliente.id},
        {'_id':0},
    )
    
    if correo_existe or id_existe:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo o el id ya existe dentro de la base de datos",
        )

    documento = cliente.model_dump()
    documento["contrasena"] = hash_password(documento["contrasena"])

    resultado = await Clientes.insert_one(documento)

    return ClienteResponse(
        id=str(documento['id']),
        nombre=documento["nombre"],
        apellido=documento["apellido"],
        email=documento["email"],
        metodosPago=documento.get("metodosPago", []),
        id_carrito=documento["id_carrito"],
    )