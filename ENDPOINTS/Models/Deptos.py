class Departamento:
    def __init__(self, id_departamento, integrantes):
        self.id_departamento = id_departamento
        self.integrantes = integrantes

    def getIdDepartamento(self):
        return self.id_departamento

    def getIntegrantes(self):
        return self.integrantes
    

class DepartamentoOperaciones(Departamento):
    def altaInventario(self, id, cantidad, tipo):
        # Lógica para dar de alta inventario
        # Retorna True si se da de alta correctamente, False en caso contrario
        return True

    def bajaInventario(self, id):
        # Lógica para dar de baja inventario
        # Retorna True si se da de baja correctamente, False en caso contrario
        return True

    def modificarInventario(self):
        # Lógica para modificar inventario
        pass

    def generarReporte(self):
        # Lógica para generar un reporte de inventario
        # Retorna un objeto ReporteInventario (puedes definir la clase aparte)
        return "Reporte de inventario generado"
    


class DepartamentoFinanzas(Departamento):
    def generarReporteFinanzas(self):
        # Lógica para generar un reporte de finanzas
        # Retorna un objeto ReporteFinanzas (puedes definir la clase aparte)
        return "Reporte de finanzas generado"

    def gestionarPresupuesto(self):
        # Lógica para gestionar el presupuesto del departamento
        return "Presupuesto gestionado"
    

class DepartamentoRRHH(Departamento):
    def generarReporte(self):
        return True