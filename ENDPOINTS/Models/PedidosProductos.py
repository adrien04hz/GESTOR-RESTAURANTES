from enum import Enum
from pydantic import BaseModel

class Cart(BaseModel):
    id: int
    id_cliente: int
    id_sucursal: int


# modelo de productos
class Producto(BaseModel):
    id : int
    id_sucursal: int
    nombre: str
    descripcion: str
    precio: str
    image : str


class ProductosCarrito(BaseModel):
    id_carrito: int
    productos: list[Producto]


class Producto:
    def __init__(self, nombre, cantidad, id_producto, precio):
        self.nombre_producto = nombre
        self.cantidad = cantidad
        self.id_producto = id_producto
        self.precio = precio

    def setCantidad(self, cantidad):
        self.cantidad = cantidad


class Carrito:
    def __init__(self, id_carrito : int, id_cliente : int, productos):
        self.id_carrito = id_carrito
        self.id_cliente = id_cliente
        self.productos = productos


    @classmethod
    async def newCarrito(cls, db_conn, id_sucursal, id_cliente):
        carrito = await db_conn["Carrito"].find_one({"id_sucursal": id_sucursal, "id_cliente": id_cliente}, {"_id": 0})
        if not carrito:
            raise ValueError("Carrito no encontrado")

        productos_raw = await db_conn["DetallesCarrito"].find({"id_carrito": carrito["id"]}, {"_id": 0}).to_list(length=None)


        id_productos_en_carrito = [d["id_producto"] for d in productos_raw]

        productos_info_db = await db_conn["Productos"].find(
            {"id": {"$in": id_productos_en_carrito}, "id_sucursal": id_sucursal}, # Opcional: filtrar por id_sucursal aquí
            {"_id": 0}
        ).to_list(length=None)

        return cls(
            id_carrito=carrito["id"],
            id_cliente=carrito["id_cliente"],
            productos= productos_info_db
        )
    
    

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