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
from Models.EmpleadosAdmin import *
from Models.Empleados import *
from Models.PedidosProductos import PaymentRequest, PayAtBranchRequest
from datetime import datetime


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
ProductosPedido = db["ProductosPedidos"]
ProductosPedidos = db["ProductosPedidos"]
Roles = db["Roles"]
RolesAdmin = db["RolesAdmin"]
Sucursales = db["Sucursales"]
TarjetasCredito = db["TarjetasCredito"]
TarjetasDebito = db["TarjetasDebito"]
EstadoPedidoPagado = db['EstadoPedidoPagado']
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
    cursor = Productos.find({"id_sucursal": sucursal}, {"_id": 0}).sort("id", 1).limit(30)
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
    if await Clientes.find_one({"email": cliente.email}):
        raise HTTPException(status_code=409, detail="El correo ya existe")

    ultimo = await Clientes.find_one(sort=[("id", -1)])  # el mayor id
    next_id = 1 if not ultimo else ultimo["id"] + 1

    doc = cliente.model_dump()
    doc["id"] = next_id
    doc["password"] = hash_password(doc["password"])
    await Clientes.insert_one(doc)

    payload = {
        "sub": doc["email"],
        "id": doc["id"],
        "id_rol": None,
        "rol_nombre": "cliente",
        "nombre": doc["nombre"],
        "apellido": doc["apellido"],
    }
    token = create_access_token(payload)

    return TokenResponse(access_token=token, user=payload)
    

@app.post("/login", response_model=TokenResponse)
async def login(datos: LoginRequest):
    """
    Intenta autenticar **en este orden**:
    1. Cliente         (colección `Clientes`)
    2. Empleado Admin  (colección `EmpleadosAdmin`)
    3. Empleado        (colección `Empleados`)
    Devuelve un JWT + datos resumidos del usuario autenticado.
    """
    
    user = await Clientes.find_one({"email": datos.email})
    if user and verify_password(datos.password, user["password"]):
        id_rol   = 0
        rol_name = "cliente"
    
    else:
        user = await EmpleadosAdmin.find_one({"email": datos.email})
        if user and verify_password(datos.password, user["password"]):
            id_rol   = user["id_rolAdmin"]
            rol_doc  = await RolesAdmin.find_one({"id": id_rol}, {"_id": 0, "nombre": 1})
            rol_name = rol_doc["nombre"] if rol_doc else "admin"
        
        else:
            user = await Empleados.find_one({"email": datos.email})
            if user and verify_password(datos.password, user["password"]):
                id_rol   = user["id_rol"]
                if id_rol == 4:
                    id_rol = 1
                rol_doc  = await Roles.find_one({"id_rol": id_rol}, {"_id": 0, "nombre": 1})
                rol_name = rol_doc["nombre"] if rol_doc else "empleado"
            else:
                raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token_payload = {
        "sub":         user["email"],
        "id":          user["id"],
        "id_rol":      id_rol,
        "rol_nombre":  rol_name,
        "id_sucursal": user.get("id_sucursal"),
        "nombre":      user["nombre"],
        "apellido":    user["apellido"],
    }
    access_token = create_access_token(token_payload)

    return TokenResponse(access_token=access_token, user=token_payload)
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
    
@app.get('/get-cart-client')
async def get_cart(current_user=Depends(get_current_user)):
    id_client = current_user['id']



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
    
@app.post("/pay-online")
async def pay_online(payment_data: PaymentRequest, current_user=Depends(get_current_user)):
    id_cliente_autenticado = current_user["id"]

    # 1. (Implícito) Cliente inicia pagarPedido() al llamar a este endpoint.

    # 2. Sistema: pedido = consultarPedido()
    pedido = await PedidosCliente.find_one({
        "id": payment_data.order_id,
        "id_cliente": id_cliente_autenticado
    })
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado o no pertenece a este usuario.")

    #Se obtiene el ID del estado 'Pagado'
    estado_pagado_doc = await db["stadoPedidoPagado"].find_one({"estado": "Pagado"})
    if not estado_pagado_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Configuración de estado de pago 'Pagado' no encontrada en la base de datos.")
    id_estado_pagado_exitoso = estado_pagado_doc["id"]

    # Verificar que el pedido no esté ya pagado
    if pedido.get("id_estado_pagado") == id_estado_pagado_exitoso:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este pedido ya ha sido pagado.")

    # **Paso crucial 2: Obtener el ID del estado 'En espera'**
    estado_en_espera_doc = await EstadoPedidoPagado.find_one({"estado": "En espera"})
    if not estado_en_espera_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Configuración de estado de pedido 'En espera' no encontrada en la base de datos.")
    id_estado_en_espera = estado_en_espera_doc["id"]


    # 3. y 4. Simulación de envío a sucursal
    id_sucursal = pedido.get("id_sucursal")
    if not id_sucursal:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="El pedido no tiene una sucursal asociada.")


    # 5. Consultar método de pago
    metodo_pago = None
    if payment_data.payment_method_type == "credit_card":
        metodo_pago = await TarjetasCredito.find_one({"id": payment_data.payment_method_id, "id_cliente": id_cliente_autenticado})
    elif payment_data.payment_method_type == "debit_card":
        metodo_pago = await TarjetasDebito.find_one({"id": payment_data.payment_method_id, "id_cliente": id_cliente_autenticado})
    elif payment_data.payment_method_type == "paypal":
        metodo_pago = await PayPalCliente.find_one({"id": payment_data.payment_method_id, "id_cliente": id_cliente_autenticado})
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de método de pago inválido. Debe ser 'credit_card', 'debit_card' o 'paypal'.")

    if not metodo_pago:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Método de pago no encontrado o no pertenece a este usuario.")

    # 6. Validar consulta (simulación de pasarela de pago)
    print(f"DEBUG: Procesando pago de {pedido.get('monto_total', 0)} con método {payment_data.payment_method_type} ID: {payment_data.payment_method_id}")
    pago_exitoso = True # Esto se determinaría por la pasarela de pago real

    if not pago_exitoso:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El procesamiento del pago falló.")

    # 7. Sistema: setEstadoPedidoPago()
    # Actualiza el estado de pago del pedido y el estado principal del pedido a "En espera"
    update_fields = {
        "id_estado_pagado": id_estado_pagado_exitoso, # Marcar como pagado
        "id_estado": id_estado_en_espera,             # Cambiar el estado del pedido a "En espera"
        "fecha": datetime.utcnow().isoformat()        # Actualizar la fecha
    }

    updated_pedido_result = await PedidosCliente.update_one(
        {"id": payment_data.order_id},
        {"$set": update_fields}
    )

    if updated_pedido_result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo actualizar el estado del pedido.")

    # 8. Cliente: confirmarPagoLinea()
    return {
        "success": True,
        "message": "Pago procesado y pedido confirmado.",
        "order_id": payment_data.order_id,
        "payment_status_id": id_estado_pagado_exitoso,
        "payment_status_name": estado_pagado_doc["estado"],
        "order_main_status_id": id_estado_en_espera,
        "order_main_status_name": estado_en_espera_doc["estado"]
    }
    
@app.post("/pay-at-branch")
async def pay_at_branch(
    payment_data: PayAtBranchRequest,
    current_user=Depends(get_current_user)
):

    # 1. Verificar que el usuario autenticado sea un Cajero
    if current_user.get("rol_nombre") != "cajero":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo los cajeros pueden procesar pagos en sucursal."
        )

    id_cliente_solicitado = payment_data.client_id
    order_id = payment_data.order_id

    # 2. y 3. Sistema: new() y id_cliente = getID()
    # Se crea una instancia conceptual de Cliente, y su ID se obtiene de la solicitud.

    # 4. Sistema: nombre_cliente = getNombreCompleto()
    cliente = await Clientes.find_one({"id": id_cliente_solicitado})
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")
    
    nombre_completo_cliente = f"{cliente.get('nombre')} {cliente.get('apellido')}"

    # 5. Sistema: monto = getMonto()
    # 6. BDPedidos: monto = consultarMonto()
    pedido = await PedidosCliente.find_one({"id": order_id, "id_cliente": id_cliente_solicitado})
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado para este cliente.")

    monto_total_pedido = pedido.get("monto_total")
    if monto_total_pedido is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Monto total del pedido no especificado.")

    # **Obtener el ID del estado 'Pagado' de estadoPedidoPagado**
    estado_pagado_doc = await db["estadoPedidoPagado"].find_one({"estado": "Pagado"})
    if not estado_pagado_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Configuración de estado de pago 'Pagado' no encontrada en la base de datos.")
    id_estado_pagado_exitoso = estado_pagado_doc["id"]

    # Verificar que el pedido no esté ya pagado
    if pedido.get("id_estado_pagado") == id_estado_pagado_exitoso:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este pedido ya ha sido pagado.")

    # **Obtener el ID del estado 'En espera' de estadoPedido**
    estado_en_espera_doc = await db["EstadosPedido"].find_one({"estado": "En espera"})
    if not estado_en_espera_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Configuración de estado de pedido 'En espera' no encontrada en la base de datos.")
    id_estado_en_espera = estado_en_espera_doc["id"]

    # 7. Sistema: telefono = consultarTelefono()
    # 8. BDClientes: telefono = consultarTelefono()
    telefono_cliente = cliente.get("telefono")
    if not telefono_cliente:
        print(f"Advertencia: Teléfono no encontrado para el cliente {id_cliente_solicitado}")

    # 9. BDPedidos: confirmacion = validarMetodo()
    pago_validado_por_cajero = True

    if not pago_validado_por_cajero:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El cajero no pudo validar el pago.")

    # 10. BDPedidos: confirmacion = setEstadoPedidoPagado("Pagado")
    # Actualizar el estado de pago del pedido y el estado principal del pedido a "En espera"
    update_fields = {
        "id_estado_pagado": id_estado_pagado_exitoso,  # Marcar como pagado
        "id_estado": id_estado_en_espera,              # Cambiar el estado del pedido a "En espera"
        "fecha": datetime.utcnow().isoformat()         # Actualizar la fecha del pedido al momento del pago
    }

    updated_pedido_result = await PedidosCliente.update_one(
        {"id": order_id, "id_cliente": id_cliente_solicitado},
        {"$set": update_fields}
    )

    if updated_pedido_result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo actualizar el estado del pedido a 'pagado'/'en espera'.")

    # 11. Sistema: ticket = generarTicket()
    ticket_info = {
        "order_id": order_id,
        "client_name": nombre_completo_cliente,
        "total_amount": monto_total_pedido,
        "payment_type": "Pago en Sucursal",
        "date": datetime.utcnow().isoformat(),
        "status_pago": estado_pagado_doc["estado"],
        "estado_pedido": estado_en_espera_doc["estado"],
        "cajero_id": current_user["id"],
        "cajero_nombre": f"{current_user.get('nombre')} {current_user.get('apellido')}"
    }

    # 12. Cajero: entregarTicket()
    return {
        "success": True,
        "message": "Pago en sucursal procesado exitosamente.",
        "ticket": ticket_info
    }



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



# endpoints para caso de uso 2
# alta de personal
@app.post('/altaPersonal', response_model=AltaEmpleadoResponse, status_code=200)
async def altaPersonal(datos: AltaEmpleadoRequest):

    # Crear empleado RRHH
    empleado_rrhh = await EmpleadoDptoRRHH.generarEmpleadoRRHH(db, datos.id_admin)
    if not empleado_rrhh:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # 1 : alta de personal
    confirmacion = await empleado_rrhh.altaPersonal(db,datos)

    if not confirmacion:
        raise HTTPException(status_code=400, detail="Error al dar de alta el personal")
    return AltaEmpleadoResponse(mensaje="Personal dado de alta correctamente")


# endpoints para caso de uso 3
# gestion de horarios
@app.post('/gestionHorarios', response_model=HorarioResponse, status_code=200)
async def gestionHorarios(datos: HorarioRequest):
    gerente = Gerente(db)

    # 1 : gestionar horarios
    confirmacion = await gerente.gestionarHorario(datos)

    if not confirmacion:
        raise HTTPException(status_code=400, detail="Error al gestionar los horarios, mamaste")
    
    # 5 : generar empleado
    empleado = await Empleado.generarEmpleado(db, datos.email_empleado)

    # 6 : enviar correo al empleado
    confirmar = empleado.recibirCorreo()

    if not confirmar:
        raise HTTPException(status_code=500, detail="Error al enviar el correo al empleado")
    
    # 8 : registrar log
    try:
        last_log = await db["LogSistemaEmpleado"].find_one({}, {"_id": 0}, sort=[("id", DESCENDING)])

        last_id = last_log["id"] if last_log else 0

        nuevo_id = last_id + 1
        log_entry = {
            "id": nuevo_id,
            "id_admin": datos.id_gerente,
            "accion": f"Gestion de horarios de {empleado.getNombreCompleto()}",
            "fecha": datetime.now().isoformat().split("T")[0]  # Formato YYYY-MM-DD
        }

        await db["LogSistemaEmpleado"].insert_one(log_entry)
        return HorarioResponse(mensaje="Horarios gestionados correctamente")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar el log: {str(e)}")



# endpoint para regresar todos los empleados
@app.get('/empleados')
async def get_empleados():
    empleados = await Empleados.find({}, {"_id": 0}).to_list(length=None)
    if empleados:
        return {
            "success": True,
            "data": empleados
        }
    else:
        return {
            "success": False,
            "message": "No se encontraron empleados"
        }



# endpoint para retornar todos los roles
@app.get('/roles')
async def get_roles():
    roles = await Roles.find({}, {"_id": 0}).to_list(length=None)
    if roles:
        return {
            "success": True,
            "data": roles
        }
    else:
        return {
            "success": False,
            "message": "No se encontraron roles"
        }
# endpoint para retornar las sucursales
@app.get('/sucursales')
async def get_sucursales():
    sucursales = await Sucursales.find({}, {"_id": 0}).to_list(length=None)
    if sucursales:
        return {
            "success": True,
            "data": sucursales
        }
    else:
        return {
            "success": False,
            "message": "No se encontraron sucursales"
        }
    

# basemodel para carrito
class Producto(BaseModel):
    id_carrito : int
    id_producto : int
    id_sucursal : int



# endpoint para anadir al carrito
@app.post("/addToCart")
async def add_to_cart(producto : Producto):
    # Buscar el carrito del cliente para la sucursal
    carrito = await DetallesCarrito.find_one({
        "id_carrito": producto.id_carrito,
        "id_producto": producto.id_producto,
        "id_sucursal": producto.id_sucursal
    })

    # Si ya existe, no lo agrega de nuevo
    if carrito:
        return {"success": False, "message": "El producto ya está en el carrito para esta sucursal"}

    # Si no existe, lo agrega
    nuevo_detalle = {
        "id_carrito" : producto.id_carrito,
        "id_producto": producto.id_producto,
        "id_sucursal": producto.id_sucursal
    }
    await DetallesCarrito.insert_one(nuevo_detalle)

    return {"success": True, "message": "Producto añadido al carrito"}



# endpoint que retorna los productos de un carrito relacionado con Productos
@app.get("/cart/{id_carrito}")
async def get_cart(id_carrito: int):
    # Buscar los detalles del carrito
    detalles = await DetallesCarrito.find({"id_carrito": id_carrito}).to_list(length=None)

    if not detalles:
        return {"success": False, "message": "No se encontraron productos en el carrito"}

    # Obtener los productos relacionados
    productos = []
    for detalle in detalles:
        producto = await Productos.find_one({"id": detalle["id_producto"]}, {"_id": 0})
        if producto:
            producto["cantidad"] = detalle.get("cantidad", 1)
            productos.append(producto)

    return {"success": True, "data": productos}


# endpoint para eliminar del carrito 
@app.delete("/removeItem/{id}")
async def removeItem(id: int):
    result = await DetallesCarrito.delete_one({"id_producto": id})
    if result.deleted_count == 1:
        return {"success": True, "message": "Producto eliminado del carrito"}
    else:
        raise HTTPException(status_code=404, detail="Producto no encontrado en el carrito")
