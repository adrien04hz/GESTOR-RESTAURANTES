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
from Models.MetodosPago import CreditCardRequest, DebitCardRequest, PaypalRequest
from Models.PedidosProductos import Cart
from Models.Cliente import *


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
EstadosPedidoPagado = db["EstadosPedidoPagado"]
HorariosAdmin = db["HorariosAdmin"]
HorariosEmpleados = db["HorariosEmpleados"]
LogSistemaAdmin = db["LogSistemaAdmin"]
LogSistemaEmpleados = db["LogSistemaEmpleados"]
PayPalCliente = db["PayPalCliente"]
PedidosCliente = db["PedidosCliente"]
Productos = db["Productos"]
ProductosPedidos = db["ProductosPedidos"]
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
    if not user or not verify_password(datos.contrasena, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token({"sub": user["email"]})
    return TokenResponse(access_token=token)

@app.post('/add-credit-card')
async def add_credit_card(card: CreditCardRequest, current_user=Depends(get_current_user)):
    id_cliente = current_user["id"]

    tarjetas = TarjetasCredito.find({'id_cliente': id_cliente})
    tarjetas = [t async for t in tarjetas]

    if len(tarjetas) >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='No es posible agregar más métodos para este cliente'
        )

    datos_tarjeta = card.model_dump()
    datos_tarjeta["id_cliente"] = id_cliente

    await TarjetasCredito.insert_one(datos_tarjeta)

    return {"success": True, "message": "Tarjeta de crédito agregada correctamente"}
        
        
@app.post('/add-debit-card')
async def add_debit_card(card: DebitCardRequest, current_user=Depends(get_current_user)):
    id_cliente = current_user["id"]

    tarjetas = TarjetasDebito.find({'id_cliente': id_cliente})
    tarjetas = [t async for t in tarjetas]

    if len(tarjetas) >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='No es posible agregar más métodos para este cliente'
        )

    datos_tarjeta = card.model_dump()
    datos_tarjeta["id_cliente"] = id_cliente

    await TarjetasDebito.insert_one(datos_tarjeta)

    return {"success": True, "message": "Tarjeta de débito agregada correctamente"}

@app.post('/add-paypal')
async def add_paypal(paypal_data: PaypalRequest, current_user=Depends(get_current_user)):
    id_cliente = current_user['id']
    paypal = PayPalCliente.find({'id_cliente':id_cliente})
    paypal = [p async for p in paypal]
    if len(paypal) >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='No es posible agregar más métodos para este cliente'
        )
    datos_paypal = paypal_data.model_dump()
    datos_paypal['id_cliente'] = id_cliente
    datos_paypal['password'] = hash_password(datos_paypal['password'])
    await PayPalCliente.insert_one(datos_paypal)
    return {'success': True, 'message': 'Referencia de Paypal agregada'}

@app.get('/get-payment-methods')
async def get_payments(current_user=Depends(get_current_user)):
    id_cliente = current_user['id']
    tarjetas_credito = TarjetasCredito.find({'id_cliente':id_cliente}, {'_id':0, 'cvv':0, 'id':0, 'id_cliente':0})
    tarjetas_credito = [t async for t in tarjetas_credito]
    tarjetas_debito = TarjetasDebito.find({'id_cliente':id_cliente}, {'_id':0, 'id':0, 'cvv':0, 'id_cliente':0})
    tarjetas_debito = [td async for td in tarjetas_debito]
    paypals = PayPalCliente.find({'id_cliente':id_cliente}, {'_id':0, 'id':0, 'id_cliente':0, 'password':0})
    paypals = [p async for p in paypals]
    
    if tarjetas_credito or tarjetas_debito or paypals:
        metodos_cliente = {
            'credit': tarjetas_credito,
            'debit': tarjetas_debito,
            'paypal': paypals
        }
        
        return {
            'success': True,
            'data': metodos_cliente
        }
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='No se encontraron metodos de pago')
    
@app.get('/get-cart-client/{id}')
async def get_cart(id:int):
    id_client = id
    carrito = await Carrito.find_one({'id_cliente':id_client}, {'_id':0})
    if carrito:
        id_sucursal = carrito['id_sucursal']
        cliente = await Clientes.find_one({'id':id_client}, {'_id':0, 'password':0})
        sucursal = await Sucursales.find_one({'id':id_sucursal}, {'_id':0, 'nombre':1})
        
        datos = {
            'id_cliente': id_client,
            'client': cliente,
            'sucursal': sucursal
        }
        return {
            'success': True,
            'data': datos
        }
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='El carrito del cliente no existe')



# endpoints para caso de uso 1
# pedidos en linea
@app.post('/pedidosEnLinea', response_model=PedidoResponse, status_code=200)
async def pedidosEnLinea( datos : PedidoRequest):
    
    # Crear cliente
    cliente = await Cliente.crear_cliente(db, datos.id_cliente)  
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # 1 : realizar pedido
    confirmacion = await cliente.realizarPedidoEnLinea(db, datos.id_sucursal)


    if confirmacion:
        return PedidoResponse(mensaje="Pedido realizado con éxito")
    else:
        raise HTTPException(status_code=500, detail="Error al realizar el pedido")


