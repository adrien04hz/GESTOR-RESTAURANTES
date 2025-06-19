from Models.Usuario import Usuario
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from Models.Empleados import Empleado
from pymongo import DESCENDING
from datetime import datetime

# alta personal request (caso de uso 2)
class AltaEmpleadoRequest(BaseModel):
    id_rol : int
    id_sucursal: int
    nombre: str
    apellido: str
    email: EmailStr
    contrasena: str
    id_admin : int


class AltaEmpleadoResponse(BaseModel):
    mensaje: str


class EmpleadoAdmin(Usuario):
    def __init__(self, nombre, apellido, id_empleado, rol, id_depto):
        super().__init__(nombre, apellido)
        self.id_empleado = id_empleado
        self.rol = rol
        self.id_depto = id_depto

    def getIdEmpleado(self):
        return self.id_empleado

    def getRol(self):
        return self.rol

    def getIdDepto(self):
        return self.id_depto
    

class RolAdmin:
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
    

class EmpleadoDptoOps(RolAdmin):
    def __init__(self, id, descripcion, nombre = "Empleado de Operaciones"):
        super().__init__(id, descripcion, nombre)

    def gestionarOperaciones(self):
        return "Gestionando operaciones del departamento."
    

class EmpleadoDptoFinanzas(RolAdmin):
    def __init__(self, id, descripcion, nombre = "Empleado de Finanzas"):
        super().__init__(id, descripcion, nombre)

    def gestionarFinanzas(self):
        return "Gestionando finanzas del departamento."
    

class EmpleadoDptoRRHH(Usuario, RolAdmin):
    def __init__(self, id, descripcion, nombre, name, apellido):
        Usuario.__init__(self, name, apellido)
        RolAdmin.__init__(self, id, descripcion, nombre)


    # instanciar empleado de RRHH
    @classmethod
    async def generarEmpleadoRRHH(cls, db_conn, id_empleado):
        datos_empleado = await db_conn["EmpleadosAdmin"].find_one({"id" : id_empleado}, {"_id": 0})

        if not datos_empleado:
            return None

        return cls(
            id = datos_empleado["id"],
            descripcion = "Departamento de Recursos Humanos",
            nombre = "Departamento de Recursos Humanos",
            name = datos_empleado["nombre"],
            apellido = datos_empleado["apellido"]
        )
    
    # funcion para dar de alta personal
    # recibe los datos del personal a dar de alta
    async def altaPersonal(self, db_conn, datos_personal):

        # 2 : validar datos del personal
        if datos_personal.email == "" or datos_personal.contrasena == "":
            return False, "Email y contraseña son obligatorios"
        
        # 3 : registrar empleado en la base de datos
        confirmacion = await self.registrarEmpleado(db_conn,datos_personal)
        if not confirmacion:
            raise ValueError("Empleado no registrado correctamente")


        # 5 : crear empleado
        registrado = await Empleado.generarEmpleado(db_conn,datos_personal.email)

        if not registrado:
            raise ValueError("Empleado no generado correctamente")

        # 6 : enviar correo de confirmación
        confirma = registrado.recibirCorreo()
        if not confirma:
            raise ValueError("No se pudo enviar el correo de confirmación")
        
        # 8 : registrar en el log
        last_log = await db_conn["LogSistemaAdmin"].find_one({}, {"_id": 0}, sort=[("id", DESCENDING)])

        last_id = last_log["id"] if last_log else 0

        nuevo_id = last_id + 1
        log_entry = {
            "id": nuevo_id,
            "id_admin": self.id,
            "accion": f"Alta de personal Empleado {registrado.getNombre()}",
            "fecha": datetime.now().isoformat().split("T")[0]  # Formato YYYY-MM-DD
        }

        await db_conn["LogSistemaAdmin"].insert_one(log_entry)

        return True
    

    # registrar empleado
    async def registrarEmpleado(self, db_conn, datos_personal):
        # Obtener el último id de la colección Empleados


        last_employee = await db_conn["Empleados"].find_one({}, {"_id": 0}, sort=[("id", DESCENDING)])

        last_id = last_employee["id"] if last_employee else 0

        nuevo_id = last_id + 1

        try:
            # Verificar si el email ya está registrado
            existing_employee = await db_conn["Empleados"].find_one({"email": datos_personal.email}, {"_id": 0})
            if existing_employee:
                return False, "El email ya está registrado"
            emp = {
                "id": nuevo_id,
                "id_rol": datos_personal.id_rol,
                "id_sucursal": datos_personal.id_sucursal,
                "nombre": datos_personal.nombre,
                "apellido": datos_personal.apellido,
                "email": datos_personal.email,
                "password": datos_personal.contrasena
            }

            await db_conn["Empleados"].insert_one(emp)
            return True
        except Exception as e:
            return False

    def bajaPersonal(self, empleado):
        # Lógica para dar de baja a un empleado
        # Retorna True si se da de baja correctamente, False en caso contrario
        return True

    def modificarPersonal(self, personal):
        # Lógica para modificar los datos de un personal
        # Retorna True si se modifica correctamente, False en caso contrario
        return True

    def generarReporte(self):
        # Lógica para generar un reporte de personal
        # Retorna un objeto ReportePersonal (puedes definir la clase aparte)
        return "Reporte de personal generado"

    def modificarHorarios(self, id_empleado, horario):
        # Lógica para modificar el horario de un empleado
        # Retorna True si se modifica correctamente, False en caso contrario
        return True
        

class DirectorGeneral(RolAdmin):
    def __init__(self, id, descripcion, nombre="Director General"):
        super().__init__(id, descripcion, nombre)

    def altasucursal(self):
        # Lógica para dar de alta una nueva sucursal
        pass

    def enviarConfirmacion(self):
        # Lógica para enviar confirmación
        pass

    def getID(self):
        return self.id

    def generarReporteSucursal(self):
        # Lógica para generar un reporte de sucursal
        # return ReporteSucursal()
        pass

    def eliminarSucursal(self, s):
        # Lógica para eliminar una sucursal
        pass