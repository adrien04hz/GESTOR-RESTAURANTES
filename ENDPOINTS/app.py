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
    # ── 1) Verificar y decodificar JWT ─────────────────────────────────
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    email: str | None = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token sin sujeto")

    # ── 2) Buscar el usuario en la BD ──────────────────────────────────
    user = (
        await Clientes.find_one({"email": email})
        or await EmpleadosAdmin.find_one({"email": email})
        or await Empleados.find_one({"email": email})
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # ── 3) Combinar datos firmados con datos de la BD ──────────────────
    #  El rol y sucursal del token tienen prioridad porque vienen firmados.
    current_user = {
        "id":           user["id"],
        "email":        user["email"],
        "nombre":       user["nombre"],
        "apellido":     user["apellido"],
        "id_rol":       payload.get("id_rol",     user.get("id_rol")),
        "rol_nombre":   payload.get("rol_nombre", user.get("rol_nombre")),
        "id_sucursal":  payload.get("id_sucursal", user.get("id_sucursal")),
    }

    return current_user


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
    if user and user.get("password") and verify_password(datos.password, user["password"]):
        id_rol   = 0
        rol_name = "cliente"
    
    else:
        user = await EmpleadosAdmin.find_one({"email": datos.email})
        if user and user.get("password") and verify_password(datos.password, user["password"]):
            id_rol = user['id_rolAdmin']
            rol_doc  = await RolesAdmin.find_one({"id": id_rol}, {"_id": 0, "nombre": 1})
            rol_name = rol_doc["nombre"] if rol_doc else "admin"
            if rol_name in ["Empleado Depto. Recursos Humanos"]:
                id_rol = 3
                rol_name = "Empleado Depto. Recursos Humanos"
                
        else:
            user = await Empleados.find_one({"email": datos.email})
            if user and user.get("password") and verify_password(datos.password, user["password"]):
                id_rol = user["id_rol"]
                rol_doc  = await Roles.find_one({"id": id_rol}, {"_id": 0, "nombre": 1}) # Se usa 'id' para Roles también
                rol_name = rol_doc["nombre"] if rol_doc else "empleado"
                if id_rol == 4:
                    id_rol = 1
                elif id_rol == 5:
                    id_rol = 5
                else:
                    id_rol = 0
            else:
                
                raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if not user:
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


@app.post('/add-credit-card')
async def add_credit_card(card: CreditCardRequest, current_user=Depends(get_current_user)):
    id_cliente = current_user["id"]

    credit_cards = await TarjetasCredito.count_documents({'id_cliente': id_cliente})
    debit_cards = await TarjetasDebito.count_documents({'id_cliente': id_cliente})
    paypals = await PayPalCliente.count_documents({'id_cliente': id_cliente})

    total_payment_methods = credit_cards + debit_cards + paypals

    if total_payment_methods >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Ya tienes el máximo de 3 métodos de pago registrados (crédito, débito o PayPal combinados).'
        )

    datos_tarjeta = card.model_dump()
    if datos_tarjeta["id_cliente"] != id_cliente:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ID de cliente no coincide con el usuario autenticado.")
    
    datos_tarjeta.pop('id', None)
    
    ultimo = await TarjetasCredito.find_one(sort=[("id", -1)]) # Obtener el último ID
    next_id = 1 if not ultimo else ultimo["id"] + 1
    datos_tarjeta["id"] = next_id

    await TarjetasCredito.insert_one(datos_tarjeta)

    return {"success": True, "message": "Tarjeta de crédito agregada correctamente"}
        
        
@app.post('/add-debit-card')
async def add_debit_card(card: DebitCardRequest, current_user=Depends(get_current_user)):
    id_cliente = current_user["id"]

    credit_cards = await TarjetasCredito.count_documents({'id_cliente': id_cliente})
    debit_cards = await TarjetasDebito.count_documents({'id_cliente': id_cliente})
    paypals = await PayPalCliente.count_documents({'id_cliente': id_cliente})

    total_payment_methods = credit_cards + debit_cards + paypals

    if total_payment_methods >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Ya tienes el máximo de 3 métodos de pago registrados (crédito, débito o PayPal combinados).'
        )

    datos_tarjeta = card.model_dump()
    if datos_tarjeta["id_cliente"] != id_cliente:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ID de cliente no coincide con el usuario autenticado.")

    datos_tarjeta.pop('id', None)
    ultimo = await TarjetasDebito.find_one(sort=[("id", -1)])
    next_id = 1 if not ultimo else ultimo["id"] + 1
    datos_tarjeta["id"] = next_id

    await TarjetasDebito.insert_one(datos_tarjeta)

    return {"success": True, "message": "Tarjeta de débito agregada correctamente"}

@app.post('/add-paypal')
async def add_paypal(paypal_data: PaypalRequest, current_user=Depends(get_current_user)):
    id_cliente = current_user['id']
    
    # Inicia la validación del límite total de métodos de pago
    credit_cards = await TarjetasCredito.count_documents({'id_cliente': id_cliente})
    debit_cards = await TarjetasDebito.count_documents({'id_cliente': id_cliente})
    paypals = await PayPalCliente.count_documents({'id_cliente': id_cliente})

    total_payment_methods = credit_cards + debit_cards + paypals

    if total_payment_methods >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Ya tienes el máximo de 3 métodos de pago registrados (crédito, débito o PayPal combinados).'
        )

    datos_paypal = paypal_data.model_dump()
    if datos_paypal["id_cliente"] != id_cliente:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ID de cliente no coincide con el usuario autenticado.")

    datos_paypal.pop('id', None)
    ultimo = await PayPalCliente.find_one(sort=[("id", -1)])
    next_id = 1 if not ultimo else ultimo["id"] + 1
    datos_paypal["id"] = next_id

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
async def get_cart_by_id(id:int): # Renombrado para evitar conflicto
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

# Endpoint para obtener el carrito del usuario autenticado
@app.get('/get-cart-client')
async def get_cart(current_user=Depends(get_current_user)):
    id_client = current_user['id']
    carrito = await Carrito.find_one({'id_cliente':id_client}, {'_id':0})
    if carrito:
        id_sucursal = carrito['id_sucursal']
        cliente_details = await Clientes.find_one({'id':id_client}, {'_id':0, 'password':0})
        sucursal_details = await Sucursales.find_one({'id':id_sucursal}, {'_id':0, 'nombre':1})

        datos = {
            'id_cliente': id_client,
            'carrito': carrito,
            'cliente_details': cliente_details,
            'sucursal_details': sucursal_details
        }
        return {
            'success': True,
            'data': datos
        }
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='El carrito del cliente no existe')

@app.post("/pay-online")
async def pay_online(payment_data: PaymentRequest, current_user=Depends(get_current_user)):
    """
    Endpoint para procesar el pago de un pedido en línea.
    Sigue el diagrama de secuencia "Pagar en linea".
    Los datos del pedido se consultan de la colección PedidosCliente.
    Los datos del método de pago se consultan de las colecciones correspondientes.
    """
    id_cliente_autenticado = current_user["id"]

    # 1. (Implícito) Cliente inicia pagarPedido() al llamar a este endpoint.

    # 2. Sistema: pedido = consultarPedido()
    pedido = await PedidosCliente.find_one({
        "id": payment_data.order_id,
        "id_cliente": id_cliente_autenticado
    })
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado o no pertenece a este usuario.")

    # Se obtieme el ID del estado 'Pagado'
    estado_pagado_doc = await db["estadoPedidoPagado"].find_one({"estado": "Pagado"})
    if not estado_pagado_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Configuración de estado de pago 'Pagado' no encontrada en la base de datos.")
    id_estado_pagado_exitoso = estado_pagado_doc["id"]

    # Verificar que el pedido no esté ya pagado
    if pedido.get("id_estado_pagado") == id_estado_pagado_exitoso:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este pedido ya ha sido pagado.")

    # Se obtiene el ID del estado 'En espera'
    estado_en_espera_doc = await db["EstadosPedido"].find_one({"estado": "En espera"})
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

    # 6. Validar consulta
    print(f"DEBUG: Procesando pago de {pedido.get('monto_total', 0)} con método {payment_data.payment_method_type} ID: {payment_data.payment_method_id}")
    pago_exitoso = True

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
    """
    Endpoint para procesar el pago de un pedido en sucursal por parte de un cajero.
    Sigue el diagrama de secuencia "Pagar en sucursal".
    """
    # 1. Verificar que el usuario autenticado sea un Cajero
    user_rol_name = current_user.get("rol_nombre")
    if user_rol_name not in ["cajero"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo personal autorizado (cajeros, gerentes, admins) puede procesar pagos en sucursal."
        )

    id_cliente_solicitado = payment_data.client_id
    order_id = payment_data.order_id

    # 2. y 3. Sistema: new() y id_cliente = getID() (Implícito en la solicitud)
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
    pago_validado_por_cajero = True # El cajero confirma la recepción del pago.

    if not pago_validado_por_cajero:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El cajero no pudo validar el pago.")

    # 10. BDPedidos: confirmacion = setEstadoPedidoPagado("Pagado")
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

    # 12. Cajero: entregarTicket() (Implícito al devolver la respuesta)
    return {
        "success": True,
        "message": "Pago en sucursal procesado exitosamente.",
        "ticket": ticket_info
    }

@app.get('/get-employees')
async def get_employees(current_user=Depends(get_current_user)):
    """
    Endpoint para obtener la lista de todos los empleados.
    Requiere que el usuario autenticado sea un 'gerente' o 'admin'.
    Excluye información sensible como la contraseña.
    """
    user_rol_name = current_user.get("rol_nombre")

    # Verifica si el usuario actual tiene el rol de 'gerente' o 'admin'
    if user_rol_name not in ["gerente", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo gerentes o administradores pueden ver la lista de empleados."
        )

    # Consulta la colección 'Empleados'
    cursor = Empleados.find({}, {"_id": 0, "password": 0})
    
    # Convierte el cursor de MongoDB a una lista de diccionarios
    employees_list = [doc async for doc in cursor]

    if employees_list:
        return {
            "success": True,
            "data": employees_list
        }
    else:
        # Si no se encuentran empleados, devuelve un error 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='No se encontraron empleados en el sistema.'
        )



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
# alta de persona
@app.post('/altaPersonal', response_model=AltaEmpleadoResponse, status_code=201)
async def altaPersonal(datos: AltaEmpleadoRequest, current_user=Depends(get_current_user)):
    """
    Endpoint para dar de alta a un nuevo empleado.
    Requiere que el usuario autenticado sea un 'Empleado Depto. Recursos Humanos'.
    Registra la acción en el log del sistema para administradores.
    """
    user_rol_name = current_user.get("rol_nombre")
    print(user_rol_name)
    if user_rol_name != "Empleado Depto. Recursos Humanos":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo el personal de RRHH puede dar de alta empleados."
        )
    
    id_admin_rrhh = current_user["id"] # El ID del admin de RRHH que está dando de alta

    # Verificar si el email ya existe en Clientes, EmpleadosAdmin o Empleados
    existing_client = await Clientes.find_one({"email": datos.email})
    existing_admin = await EmpleadosAdmin.find_one({"email": datos.email})
    existing_employee = await Empleados.find_one({"email": datos.email})

    if existing_client or existing_admin or existing_employee:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado por otro usuario.")

    # Obtener el siguiente ID para el nuevo empleado
    ultimo_empleado = await Empleados.find_one(sort=[("id", -1)])
    next_id_empleado = 1 if not ultimo_empleado else ultimo_empleado["id"] + 1

    # Preparar el documento del nuevo empleado
    # id_empleado en el frontend corresponde a `id` en la BD
    new_employee_doc = {
        "id": next_id_empleado,
        "nombre": datos.nombre,
        "apellido": datos.apellido,
        "email": datos.email,
        "password": hash_password(datos.password), # Hashear la contraseña
        "id_rol": datos.id_rol,
        "id_sucursal": datos.id_sucursal
    }

    # Insertar el nuevo empleado en la colección Empleados
    result = await Empleados.insert_one(new_employee_doc)

    if result.inserted_id:
        # **Registrar la acción en el log del sistema para administradores**
        now = datetime.utcnow()
        log_entry_data = {
            "id_admin": id_admin_rrhh,
            "accion": f"Alta de empleado. ID: {next_id_empleado}, Email: {datos.email}",
            "fecha": now.strftime("%Y-%m-%d"), # Formato="%Y-%m-%d"
            "hora": now.strftime("%H:%M:%S")   # Formato="%H:%M:%S"
        }
        
        # Obtener el siguiente ID para la entrada del log
        ultimo_log = await LogSistemaAdmin.find_one(sort=[("id", -1)])
        next_id_log = 1 if not ultimo_log else ultimo_log["id"] + 1
        log_entry_data["id"] = next_id_log

        await LogSistemaAdmin.insert_one(log_entry_data)

        return AltaEmpleadoResponse(mensaje="Personal dado de alta correctamente", id_empleado_creado=next_id_empleado)
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al insertar el empleado en la base de datos.")


@app.get('/sucursales', response_model=SucursalesListResponse)
async def get_sucursales(current_user=Depends(get_current_user)): # Añadido Depends para autenticación
    """
    Endpoint para obtener la lista de todas las sucursales.
    Requiere autenticación.
    """
    user_rol_name = current_user.get("rol_nombre")
    if user_rol_name not in ["admin", "gerente", "Empleado Depto. Recursos Humanos"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Su rol no tiene permisos para ver las sucursales."
        )

    cursor = Sucursales.find({}, {"_id": 0}).sort("id", 1) # Excluye _id
    sucursales_list = [doc async for doc in cursor]

    # Devuelve un éxito con datos vacíos si no hay sucursales, no un 404
    return {
        "success": True,
        "data": sucursales_list
    }

@app.get('/roles', response_model=RolesListResponse)
async def get_roles(current_user=Depends(get_current_user)): # Añadido Depends para autenticación
    """
    Endpoint para obtener la lista de todos los roles (para empleados, no admins).
    Requiere autenticación.
    """
    user_rol_name = current_user.get("rol_nombre")
    if user_rol_name not in ["admin", "gerente", "Empleado Depto. Recursos Humanos"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Su rol no tiene permisos para ver los roles."
        )

    cursor = Roles.find({}, {"_id": 0}).sort("id", 1) # Asumiendo que Roles usa 'id' para ordenar
    roles_list = [doc async for doc in cursor]

    # Devuelve un éxito con datos vacíos si no hay roles, no un 404
    return {
        "success": True,
        "data": roles_list
    }



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