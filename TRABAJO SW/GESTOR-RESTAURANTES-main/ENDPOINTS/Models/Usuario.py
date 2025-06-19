# Clase usuario
class Usuario:
    def __init__(self, nombre, apellido):
        self.nombre = nombre
        self.apellido = apellido

    def getNombreCompleto(self):
        return f"{self.nombre} {self.apellido}"
    
    def getNombre(self):
        return self.nombre
    
    def getApellido(self):
        return self.apellido