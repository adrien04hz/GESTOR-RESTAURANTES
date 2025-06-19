from Models.Usuario import Usuario
from pydantic import BaseModel, EmailStr
from typing import List, Optional



class DiasSemana(BaseModel):
    dia : str
    hora_entrada: str
    hora_salida: str

# gestion de horarios request (caso de uso 3)
class HorarioRequest(BaseModel):
    id_gerente: int
    id_empleado: int
    email_empleado: EmailStr
    id_sucursal : int
    horarios : List[DiasSemana]


class HorarioResponse(BaseModel):
    mensaje: str


class Empleado(Usuario):
    def __init__(self, nombre, apellido, id_empleado, id_rol, id_sucursal):
        super().__init__(nombre, apellido)
        self.id_empleado = id_empleado
        self.id_rol = id_rol
        self.id_sucursal = id_sucursal


    # generar empleado 
    @classmethod
    async def generarEmpleado(cls, db_conn, email):
        empleado_data = await db_conn["Empleados"].find_one({"email": email}, {"_id": 0})
        if not empleado_data:
            return None
        return cls(
            nombre=empleado_data["nombre"],
            apellido=empleado_data["apellido"],
            id_empleado=empleado_data["id"],
            id_rol=empleado_data["id_rol"],
            id_sucursal=empleado_data["id_sucursal"]
        )
    

   

    # 6 : enviar correo
    def recibirCorreo(self):
        return True
    
    def getIdEmpleado(self):
        return self.id_empleado
    
    def getRol(self):
        return self.id_rol
    
    def getIdSucursal(self):
        return self.id_sucursal
    

# clase Rol
class Rol:
    def __init__(self, id, descripcion, nombre):
        self.id = id
        self.descripcion = descripcion
        self.nombre = nombre

    def getId(self):
        return self.id
    
    def getDescripcion(self):
        return self.descripcion
    
    def getNombre(self):
        return self.nombre
    

# Clases de los roles
class Cocinero(Rol):
    def __init__(self, id, descripcion, nombre):
        super().__init__(id, descripcion, nombre)

    def recibirOrden(self, orden):
        return f"Orden recibida: {orden}"
    
    def prepararPedido(self, pedido):
        return f"Pedido preparado: {pedido}"
    
    def entregarPedido(self, pedido):
        return f"Pedido entregado: {pedido}"


class Mesero(Rol):
    def __init__(self, id, descripcion, nombre):
        super().__init__(id, descripcion, nombre)

    def ingresarPedido(self, orden):
        return f"Orden tomada: {orden}"
    
    def entregarPedido(self, pedido):
        return f"Pedido servido: {pedido}"
    
    def editarPedido(self, cuenta):
        return f"Editando: {cuenta}"
    

class Repartidor(Rol):
    def __init__(self, id, descripcion, nombre):
        super().__init__(id, descripcion, nombre)

    def entregarPedido(self, pedido):
        return f"Pedido entregado: {pedido}"
    
    def cambiarEstadoPedido(self, estado):
        return f"Pedido: {estado}"
   
    def confirmarEntregaPedido(self, pedido):
        return f"Entrega confirmada: {pedido}"
    

class Gerente:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    
    async def gestionarHorario(self, horario_request: HorarioRequest):
        # 2: validar si tiene horarios asignados
        empleado = await self.db_conn["HorariosEmpleados"].find_one({"id_empleado": horario_request.id_empleado}, {"_id": 0})
        horarios_para_mongo = [h.model_dump() for h in horario_request.horarios]
        # 3 : registrar horarios
        try:        
            if empleado:
                # 3: actualizar horarios
                await self.db_conn["HorariosEmpleados"].update_one(
                {"id_empleado": horario_request.id_empleado}, # Filtro para encontrar el documento
                {"$set": {
                    "id_sucursal": horario_request.id_sucursal,
                    "horarios": horarios_para_mongo
                }},
                upsert=True
                )
            else:
                # insertar nuevo horario
                await self.db_conn["HorariosEmpleados"].insert_one({
                    "id_empleado": horario_request.id_empleado,
                    "id_sucursal": horario_request.id_sucursal,
                    "horarios": horarios_para_mongo 
                })
            return True
        except Exception as e:
            print(f"Error al gestionar horario: {e}")
            return False


    def registrarInventario(self, m):
        # Lógica para registrar inventario
        pass

    def modificarInventario(self, m):
        # Lógica para modificar inventario
        pass

    def eliminarInventario(self):
        # Lógica para eliminar inventario
        pass

    def generarReportePersonal(self):
        # Lógica para generar reporte de personal
        # return ReportePersonal()
        pass

    def generarReporteFinanzas(self):
        # Lógica para generar reporte de finanzas
        # return ReporteIngresos()
        pass

    def altaPersonal(self, empleado):
        # Lógica para dar de alta personal
        # return True o False
        pass


class Cajero(Rol):
    def __init__(self, id, descripcion, nombre):
        super().__init__(id, descripcion, nombre)

    def procesosDePago(self):
        return "Procesando pago..."

    def obtenerCuenta(self):
        # Aquí podrías implementar la lógica para obtener el total de la cuenta
        return 0.0
    

class Cocina:
    def __init__(self, id_cocina, id_sucursal, integrantes):
        self.id_cocina = id_cocina
        self.id_sucursal = id_sucursal
        self.integrantes = integrantes

    def recibirPedido(self, pedido):
        # Lógica para recibir un pedido en la cocina
        print(f"Pedido recibido en cocina: {pedido}")

    def prepararPedido(self):
        # Lógica para preparar el pedido
        print("Preparando pedido en cocina...")

    def entregar(self):
        # Lógica para entregar el pedido preparado
        print("Pedido entregado desde cocina.")