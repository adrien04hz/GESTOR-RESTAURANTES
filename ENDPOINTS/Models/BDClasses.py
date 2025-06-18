class BDLogSistema:
    def __init__(self, db_conn):
        self.db_conn = db_conn
    
    def getEmpleadoAccion(self, id_empleado: int):
        pass

    def getAcciones(self):
        pass

    def setAccionEmpleado(self, id_empleado: int, accion):
        pass


class BDEmpleadosAdmins:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getAdministrador(self, id_empleado: int):
        pass

    def getEmpleadosAdmins(self):
        pass

    def getPersonalDepto(self, id_depto: int):
        pass

    def setEmpleadoDepto(self, empleado, id_depto: int):
        pass

    def modificarAdmin(self, id_admin: int):
        pass


class BDClienteMetodosPagos:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getMetodosPagoCliente(self, id_cliente: int):
        pass

    def setMetodoCliente(self, id_cliente: int, metodo):
        pass


class BDHorarios:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getHorarioEmpleado(self, id_empleado: int):
        pass

    def getHorariosPersonalSucursal(self, id_sucursal: int):
        pass

    def setEmpleadoSucursal(self, empleado, id_sucursal: int):
        pass

    def modificarHorarioEmpleado(self, id_empleado: int, horario):
        pass


class BDEmpleados:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getEmpleado(self, id_empleado: int):
        pass

    def getEmpleados(self):
        pass

    def getPersonalSucursal(self, id_sucursal: int):
        pass

    def setEmpleadoSucursal(self, empleado, id_sucursal: int):
        pass

    def modificarRolEmpleado(self, id_empleado: int, rol: str):
        pass



class BDPedidosCliente:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getPedidosCliente(self, id_cliente: int):
        pass

    def getPedidos(self):
        pass

    def setPedidoCliente(self, id_cliente: int, pedido):
        pass



class BDClientes:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getCliente(self, id_cliente: int):
        pass

    def getClientes(self):
        pass

    def setCliente(self, cliente):
        pass


class BDPagosHistorial:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def getPagosCliente(self, id_cliente: int):
        pass

    def getsPagos(self):
        pass

    def setClientePago(self, id_cliente: int, pago):
        pass