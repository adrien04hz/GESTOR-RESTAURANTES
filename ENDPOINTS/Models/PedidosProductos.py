from enum import Enum


class Producto:
    def __init__(self, nombre, cantidad, id_producto, precio):
        self.nombre_producto = nombre
        self.cantidad = cantidad
        self.id_producto = id_producto
        self.precio = precio

    def setCantidad(self, cantidad):
        self.cantidad = cantidad


class Carrito:
    def __init__(self, id_carrito, id_cliente, productos):
        self.id_carrito = id_carrito
        self.id_cliente = id_cliente
        self.productos = productos

    def agregarProducto(self, prod):
        self.productos.append(prod)
        return True

    def eliminarProducto(self, prod):
        if prod in self.productos:
            self.productos.remove(prod)
            return True
        return False

    def getProductos(self):
        return self.productos
    



class Pedido:
    class EstadoPedido(Enum):
        REGISTRADO = "Registrado"
        EN_ESPERA = "En espera"
        EN_PREPARACION = "En preparación"
        COMPLETADO = "Completado"
        EN_REPARTO = "En reparto"
        ENTREGADO = "Entregado"


    def __init__(self, id_pedido, productos, monto_total, estado : EstadoPedido):
        self.id_pedido = id_pedido
        self.productos = productos
        self.monto_total = monto_total
        self.estado = estado

    
    def actualizarPedido(self, estado):
        self.estado = estado
        return True

    def mostrarEstadoPedido(self):
        return f"El estado actual del pedido es: {self.estado}"

    def mostrarDetallesPedido(self):
        detalles = []
        for producto in self.productos:
            detalles.append(f"{producto.nombre_producto} x{producto.cantidad} - ${producto.precio}")
        detalles.append(f"Total: ${self.monto_total}")
        return detalles

    def getDireccionPedido(self):
        # Suponiendo que el pedido tiene un atributo direccion
        return getattr(self, 'direccion', "Dirección no especificada")