const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Autenticación
  authenticate: (username) => ipcRenderer.invoke('db:authenticate', username),

  // Productos
  getProductos: () => ipcRenderer.invoke('db:getProductos'),
  buscarProductos: (termino) => ipcRenderer.invoke('db:buscarProductos', termino),
  agregarProducto: (producto) => ipcRenderer.invoke('db:agregarProducto', producto),
  actualizarProducto: (id, producto) => ipcRenderer.invoke('db:actualizarProducto', id, producto),
  eliminarProducto: (id) => ipcRenderer.invoke('db:eliminarProducto', id),

  // Ventas
  registrarVenta: (venta, detalles) => ipcRenderer.invoke('db:registrarVenta', venta, detalles),
  getVentasHoy: () => ipcRenderer.invoke('db:getVentasHoy'),
  getVenta: (ventaId) => ipcRenderer.invoke('db:getVenta', ventaId),
  getDetalleVenta: (ventaId) => ipcRenderer.invoke('db:getDetalleVenta', ventaId),

  // Reportes
  getEstadisticas: () => ipcRenderer.invoke('db:getEstadisticas'),
  getProductosBajoStock: () => ipcRenderer.invoke('db:getProductosBajoStock'),
  getProductosMasVendidos: (limite) => ipcRenderer.invoke('db:getProductosMasVendidos', limite),
  getResumenVentasDiarias: (dias) => ipcRenderer.invoke('db:getResumenVentasDiarias', dias),

  // Categorías y Clientes
  getCategorias: () => ipcRenderer.invoke('db:getCategorias'),
  agregarCategoria: (nombre, descripcion) => ipcRenderer.invoke('db:agregarCategoria', nombre, descripcion),
  getClientes: () => ipcRenderer.invoke('db:getClientes'),
  buscarCliente: (termino) => ipcRenderer.invoke('db:buscarCliente', termino),
  agregarCliente: (cliente) => ipcRenderer.invoke('db:agregarCliente', cliente),
  actualizarCliente: (id, cliente) => ipcRenderer.invoke('db:actualizarCliente', id, cliente),
  eliminarCliente: (id) => ipcRenderer.invoke('db:eliminarCliente', id),

  // Usuarios
  getUsuarios: () => ipcRenderer.invoke('db:getUsuarios'),

  // Movimientos
  getMovimientosStock: (productoId, limite) => ipcRenderer.invoke('db:getMovimientosStock', productoId, limite),

  // Backup
  createBackup: () => ipcRenderer.invoke('db:createBackup'),

  // Consultas generales
  query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
  run: (sql, params) => ipcRenderer.invoke('db:run', sql, params)
});