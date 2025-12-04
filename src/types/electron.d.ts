export interface ElectronAPI {
  // Autenticación
  authenticate: (username: string) => Promise<any>;

  // Productos
  getProductos: () => Promise<any[]>;
  buscarProductos: (termino: string) => Promise<any[]>;
  agregarProducto: (producto: any) => Promise<any>;
  actualizarProducto: (id: number, producto: any) => Promise<any>;
  eliminarProducto: (id: number) => Promise<any>;

  // Ventas
  registrarVenta: (venta: any, detalles: any[]) => Promise<any>;
  getVentasHoy: () => Promise<any[]>;
  getVenta: (ventaId: number) => Promise<any>;
  getDetalleVenta: (ventaId: number) => Promise<any[]>;

  // Reportes
  getEstadisticas: () => Promise<any>;
  getProductosBajoStock: () => Promise<any[]>;
  getProductosMasVendidos: (limite?: number) => Promise<any[]>;
  getResumenVentasDiarias: (dias?: number) => Promise<any[]>;

  // Categorías y Clientes
  getCategorias: () => Promise<any[]>;
  agregarCategoria: (nombre: string, descripcion?: string) => Promise<any>;
  getClientes: () => Promise<any[]>;
  buscarCliente: (termino: string) => Promise<any[]>;
  agregarCliente: (cliente: any) => Promise<any>;
  actualizarCliente: (id: number, cliente: any) => Promise<any>;
  eliminarCliente: (id: number) => Promise<any>;

  // Usuarios
  getUsuarios: () => Promise<any[]>;

  // Movimientos
  getMovimientosStock: (productoId?: number, limite?: number) => Promise<any[]>;

  // Backup
  createBackup: () => Promise<any>;

  // Consultas generales
  query: (sql: string, params?: any[]) => Promise<any[]>;
  get: (sql: string, params?: any[]) => Promise<any>;
  run: (sql: string, params?: any[]) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};