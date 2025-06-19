from Models.Usuario import Usuario
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class LoginRequest(BaseModel):
    email: EmailStr
    contrasena: str
    
class LoginResponse(BaseModel):
    nombre: str
    apellido: str

class ClienteCreate(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: EmailStr
    contrasena: str
    metodosPago: Optional[List[str]] = []
    id_carrito: Optional[str] = None

class ClienteResponse(BaseModel):
    id: str
    nombre: str
    apellido: str
    email: EmailStr
    metodosPago: List[str]
    id_carrito: Optional[str] = None

class Cliente(Usuario):
    def __init__(self, nombre, apellido, id_cliente, correo_electronico, contrasena, metodosPago, id_carrito):
        super().__init__(nombre, apellido)
        self.id_cliente = id_cliente
        self.correo_electronico = correo_electronico
        self.contrasena = contrasena
        self.metodosPago = metodosPago  # Lista de hasta 3 objetos MetodoPago
        self.id_carrito = id_carrito

    def getIdCliente(self):
        return self.id_cliente

    def getCorreoElectronico(self):
        return self.correo_electronico

    def getMetodosPago(self):
        return self.metodosPago

    def getIdCarrito(self):
        return self.id_carrito

    def realizarPedidoEnLinea(self, pedido):
        # Lógica para realizar un pedido en línea
        return f"Pedido en línea realizado: {pedido}"

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