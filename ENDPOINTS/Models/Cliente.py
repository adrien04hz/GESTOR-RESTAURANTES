from Models.Usuario import Usuario
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from Models.Sucursal import Sucursal


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class LoginResponse(BaseModel):
    nombre: str
    apellido: str

class ClienteCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str = Field(min_length=6)
    telefono: str = Field(pattern=r'^\d{10}$')
    direccion: str

    class Config:
        extra = "forbid"

class ClienteResponse(BaseModel):
    id: str
    nombre: str
    apellido: str
    email: EmailStr
    metodosPago: List[str]
    id_carrito: Optional[str] = None


# Realizar pedidos request (caso de uso 1)
# ==========================================================
class PedidoRequest(BaseModel):
    id_cliente : int
    id_sucursal : int

class PedidoResponse(BaseModel):
    mensaje: str
# ===========================================================

# Modelo del cliente
class ClienteModel(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    telefono : str
    direccion: str



class Cliente(Usuario):
    # recibe la conexion a base de datos para obtener los datos del cliente
    def __init__(self, id_cliente, nombre, apellido, email, contrasena, telefono=None, direccion=None):
        super().__init__(nombre, apellido)
        self.id_cliente = id_cliente
        self.email = email
        self.contrasena = contrasena # Recuerda: ¡siempre guarda y maneja contraseñas hasheadas!
        self.telefono = telefono
        self.direccion = direccion


    @classmethod
    async def crear_cliente(cls, db_conn : AsyncIOMotorClient , id_cliente : int):
        cliente_data = await db_conn["Clientes"].find_one({"id": id_cliente})
        if not cliente_data:
            raise ValueError("Cliente no encontrado")
        return cls(
            id_cliente=cliente_data["id"],
            nombre=cliente_data["nombre"],
            apellido=cliente_data["apellido"],
            email=cliente_data["email"],
            contrasena=cliente_data["password"],
            telefono=cliente_data.get("telefono"),
            direccion=cliente_data.get("direccion")
        )

    def getIdCliente(self):
        return self.id_cliente

    def getCorreoElectronico(self):
        return self.correo_electronico

    def getMetodosPago(self):
        return self.metodosPago

    def getIdCarrito(self):
        return self.id_carrito

    # caso de uso 1: realizar pedidos
    async def realizarPedidoEnLinea(self, db_conn: AsyncIOMotorClient, id_sucursal: int):
        
        # 2 : new Sucursal
        sucursal = await Sucursal.generarSucursal(db_conn, id_sucursal)

        if not sucursal:
            raise ValueError("Sucursal no encontrada")
        
        # 3 : productos = getProductos
        productos = await sucursal.getProductos(db_conn, self.id_cliente, id_sucursal)

        # 6 : registrarPedido()
        mensaje = await sucursal.registrarPedido(db_conn, self.id_cliente, productos)

        return mensaje
        
        




    def pagarEnSucursal(self, sucursal, monto):
        # Lógica para pagar en sucursal
        return f"Pago de ${monto} realizado en sucursal {sucursal}"

    def agregarMetodoDePago(self, metodo_pago):
        # Lógica para agregar un método de pago (máximo 3)
        if len(self.metodosPago) < 3:
            self.metodosPago.append(metodo_pago)
            return True
        return False

    def pagarEnLinea(self, monto, metodo_pago):
        # Lógica para pagar en línea usando un método de pago
        if metodo_pago in self.metodosPago:
            return f"Pago en línea de ${monto} realizado con {metodo_pago}"
        return "Método de pago no válido"

    def iniciarSesion(self, correo, contrasena):
        # Lógica para iniciar sesión
        return self.correo_electronico == correo and self.contrasena == contrasena

    def registrarse(self, nombre, apellido, correo, contrasena):
        # Lógica para registrar un nuevo cliente
        self.nombre = nombre
        self.apellido = apellido
        self.correo_electronico = correo
        self.contrasena = contrasena
        return True

    def getId(self):
        return self.id_cliente

    def getPassword(self):
        return self.contrasena

    def getCorreo(self):
        return self.correo_electronico