from pydantic import BaseModel, EmailStr

class CreditCardRequest(BaseModel):
    id_cliente: int
    titular: str
    numero_tarjeta: str
    fecha_vencimiento: str
    cvv: str
    linea_credito: int
    
class DebitCardRequest(BaseModel):
    id_cliente: int
    titular: str
    numero_tarjeta: str
    fecha_vencimiento: str
    cvv: str
    
class PaypalRequest(BaseModel):
    id_cliente: int
    email: EmailStr
    password: str
    

class MetodoPago:
    def __init__(self, id_metodo, id_cliente, tipo):
        self.id_metodo = id_metodo
        self.id_cliente = id_cliente
        self.tipo = tipo

    def procesarPago(self):
        # Lógica para procesar el pago
        print("Procesando pago...")

    def validarPago(self):
        # Lógica para validar el pago
        return True

    def autorizarPago(self):
        # Lógica para autorizar el pago
        return True

    def actualizarSaldo(self):
        # Lógica para actualizar el saldo después del pago
        print("Saldo actualizado.")



class TarjetaCredito(MetodoPago):
    def __init__(self, id_metodo, id_cliente, tipo, titular, fecha_expiracion, linea_credito, cvv, numero_tarjeta):
        super().__init__(id_metodo, id_cliente, tipo)
        self.titular = titular
        self.fecha_expiracion = fecha_expiracion
        self.linea_credito = linea_credito
        self.cvv = cvv
        self.numero_tarjeta = numero_tarjeta


class TarjetaDebito(MetodoPago):
    def __init__(self, id_metodo, id_cliente, tipo, titular, fecha_expiracion, cvv, numero_tarjeta):
        super().__init__(id_metodo, id_cliente, tipo)
        self.titular = titular
        self.fecha_expiracion = fecha_expiracion
        self.cvv = cvv
        self.numero_tarjeta = numero_tarjeta


class ReferenciaPayPal(MetodoPago):
    def __init__(self, correo, psswd):
        self.correo = correo
        self.psswd = psswd