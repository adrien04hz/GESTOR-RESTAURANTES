class Sucursal:
    def __init__(self, id_sucursal, nombre, personal):
        self.id_sucursal = id_sucursal
        self.nombre = nombre
        self.personal = personal
    
    def procesoPagos(self):
        # Lógica para procesar pagos en la sucursal
        return "Pagos procesados en la sucursal."

    def getPersonal(self):
        return self.personal

    def getNombre(self):
        return self.nombre

    def getId(self):
        return self.id_sucursal