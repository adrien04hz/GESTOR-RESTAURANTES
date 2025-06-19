from motor.motor_asyncio import AsyncIOMotorClient
from Models.PedidosProductos import *
from datetime import datetime
from pydantic import BaseModel, EmailStr


# modelo de sucursal
class SucursalModel(BaseModel):
    id: int
    nombre: str


class Sucursal:
    def __init__(self, id_sucursal, nombre):
        self.id_sucursal = id_sucursal
        self.nombre = nombre

    # generar sucursal
    @classmethod
    async def generarSucursal(cls, db_conn : AsyncIOMotorClient, id_sucursal: int):
        sucursal_data = await db_conn["Sucursales"].find_one({"id": id_sucursal}, {"_id": 0})
        if not sucursal_data:
            return None
        return cls(
            id_sucursal=sucursal_data["id"],
            nombre=sucursal_data["nombre"]
        )
    
    # 3 : getProductos
    async def getProductos(self, db_conn: AsyncIOMotorClient, id_cliente: int, id_sucursal: int):

        # 4 : new Carrito
        carrito = await Carrito.newCarrito(db_conn, id_sucursal, id_cliente)
        if not carrito:
            raise ValueError("Carrito no encontrado")
        
        # 5 : obtener productos del carrito
        return carrito.getProductos()
    

    async def registrarPedido(self, db_conn: AsyncIOMotorClient, id_cliente: int, productos, estado = 2, estadoPagado = 2) -> bool:

        # Obtener el último id de 'PedidosClientes'
        ultimo_pedido = await db_conn["PedidosClientes"].find_one({},{"_id" : 0},
            sort=[("id", -1)]
        )
        nuevo_id = 1 if not ultimo_pedido else ultimo_pedido["id"] + 1

        monto = sum(float(producto["precio"].split("$")[1]) for producto in productos)

        # Crear el documento del pedido
        pedido_doc = {
            "id": nuevo_id,
            "id_cliente": id_cliente,
            "id_estado" : estado,
            "id_estado_pagado": estadoPagado,
            "id_sucursal": self.id_sucursal,
            "monto_total": monto,
            "fecha" : datetime.now().isoformat().split("T")[0],  # Formato YYYY-MM-DD
        }

        try:

            # Insertar el pedido en la colección
            result = await db_conn["PedidosClientes"].insert_one(pedido_doc)

            # insertar en productos_pedidos
            for producto in productos:
                producto_doc = {
                    "id_pedido": nuevo_id,
                    "id_producto": producto["id"],
                }
                await db_conn["ProductosPedidos"].insert_one(producto_doc)

                if not result.acknowledged:
                    print(f"Advertencia: Inserción de producto {producto['id']} para pedido {nuevo_id} no reconocida.")
            
            return True
        except Exception as e:
            print(f"Error al registrar el pedido: {e}")
            return False

    def procesoPagos(self):
        # Lógica para procesar pagos en la sucursal
        return "Pagos procesados en la sucursal."

    def getPersonal(self):
        return self.personal

    def getNombre(self):
        return self.nombre

    def getId(self):
        return self.id_sucursal