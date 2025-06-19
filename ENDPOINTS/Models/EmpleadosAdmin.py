from Models.Usuario import Usuario
from pydantic import BaseModel, EmailStr
from typing import List, Optional

# alta personal request (caso de uso 2)
class EmpleadoRequest(BaseModel):
    id_rol : int
    id_sucursal: int
    nombre: str
    apellido: str
    email: EmailStr
    contrasena: str

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
    

class EmpleadoDptoRRHH(RolAdmin):
    def __init__(self, id, descripcion, nombre = "Empleado de Recursos Humanos"):
        super().__init__(id, descripcion, nombre)

        def altaPersonal(self, personal):
            # Lógica para dar de alta a un nuevo personal
            # Retorna True si se da de alta correctamente, False en caso contrario
            return True

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