const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getInstance } = require('./db/database.cjs');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../public/kiara.svg')
  });

 // Determinar si estamos en desarrollo
  const isDev = !app.isPackaged;

  // En desarrollo: cargar desde Vite
  if (isDev) {
    mainWindow.loadURL('http://localhost:6969/login');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción: cargar desde archivos build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicializar app
app.whenReady().then(() => {
  // Inicializar base de datos
  try {
    db = getInstance();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error fatal al inicializar BD:', error);
    app.quit();
    return;
  }

  // Crear ventana principal
  createWindow();

  // Configurar IPC handlers para comunicación con React
  setupIpcHandlers();

  // macOS: Recrear ventana cuando se activa la app
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar app cuando todas las ventanas se cierran
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close();
      console.log('🔒 Base de datos cerrada');
    }
    app.quit();
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

// ============================================
// IPC HANDLERS - Comunicación con React
// ============================================

function setupIpcHandlers() {
  // ========== AUTENTICACIÓN ==========
  ipcMain.handle('db:authenticate', async (event, username) => {
    try {
      return db.authenticateUser(username);
    } catch (error) {
      console.error('Error en authenticate:', error);
      throw error;
    }
  });

  // ========== PRODUCTOS ==========
  ipcMain.handle('db:getProductos', async () => {
    try {
      return db.getProductosActivos();
    } catch (error) {
      console.error('Error en getProductos:', error);
      throw error;
    }
  });

  ipcMain.handle('db:buscarProductos', async (event, termino) => {
    try {
      return db.buscarProductos(termino);
    } catch (error) {
      console.error('Error en buscarProductos:', error);
      throw error;
    }
  });

  ipcMain.handle('db:agregarProducto', async (event, producto) => {
    try {
      return db.agregarProducto(producto);
    } catch (error) {
      console.error('Error en agregarProducto:', error);
      throw error;
    }
  });

  ipcMain.handle('db:actualizarProducto', async (event, id, producto) => {
    try {
      return db.actualizarProducto(id, producto);
    } catch (error) {
      console.error('Error en actualizarProducto:', error);
      throw error;
    }
  });

  ipcMain.handle('db:eliminarProducto', async (event, id) => {
    try {
      return db.eliminarProducto(id);
    } catch (error) {
      console.error('Error en eliminarProducto:', error);
      throw error;
    }
  });

  // ========== VENTAS ==========
  ipcMain.handle('db:registrarVenta', async (event, venta, detalles) => {
    try {
      return db.registrarVenta(venta, detalles);
    } catch (error) {
      console.error('Error en registrarVenta:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getVentasHoy', async () => {
    try {
      return db.getVentasHoy();
    } catch (error) {
      console.error('Error en getVentasHoy:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getVenta', async (event, ventaId) => {
    try {
      return db.get('SELECT * FROM ventas WHERE venta_id = ?', [ventaId]);
    } catch (error) {
      console.error('Error en getVenta:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getDetalleVenta', async (event, ventaId) => {
    try {
      return db.query(
        `SELECT dv.*, p.nombre as producto_nombre 
         FROM detalle_venta dv
         JOIN productos p ON dv.producto_id = p.producto_id
         WHERE dv.venta_id = ?`,
        [ventaId]
      );
    } catch (error) {
      console.error('Error en getDetalleVenta:', error);
      throw error;
    }
  });

  // ========== REPORTES ==========
  ipcMain.handle('db:getEstadisticas', async () => {
    try {
      return db.getEstadisticas();
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getProductosBajoStock', async () => {
    try {
      return db.getProductosBajoStock();
    } catch (error) {
      console.error('Error en getProductosBajoStock:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getProductosMasVendidos', async (event, limite = 10) => {
    try {
      return db.getProductosMasVendidos(limite);
    } catch (error) {
      console.error('Error en getProductosMasVendidos:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getResumenVentasDiarias', async (event, dias = 30) => {
    try {
      return db.query(
        `SELECT * FROM v_ventas_diarias 
         WHERE fecha >= DATE('now', '-${dias} days')
         ORDER BY fecha DESC`
      );
    } catch (error) {
      console.error('Error en getResumenVentasDiarias:', error);
      throw error;
    }
  });

  // ========== CATEGORÍAS ==========
  ipcMain.handle('db:getCategorias', async () => {
    try {
      return db.getCategorias();
    } catch (error) {
      console.error('Error en getCategorias:', error);
      throw error;
    }
  });

  ipcMain.handle('db:agregarCategoria', async (event, nombre, descripcion) => {
    try {
      return db.run(
        'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion || null]
      );
    } catch (error) {
      console.error('Error en agregarCategoria:', error);
      throw error;
    }
  });

  // ========== CLIENTES ==========
  ipcMain.handle('db:getClientes', async () => {
    try {
      return db.getClientes();
    } catch (error) {
      console.error('Error en getClientes:', error);
      throw error;
    }
  });

  ipcMain.handle('db:buscarCliente', async (event, termino) => {
    try {
      return db.buscarCliente(termino);
    } catch (error) {
      console.error('Error en buscarCliente:', error);
      throw error;
    }
  });

  ipcMain.handle('db:agregarCliente', async (event, cliente) => {
    try {
      return db.run(
        `INSERT INTO clientes (
          tipo_documento, num_documento, nombre_completo, 
          email, telefono, direccion, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cliente.tipo_documento || 'DNI',
          cliente.documento_identidad || null,
          cliente.nombre_completo,
          cliente.email || null,
          cliente.telefono || null,
          cliente.direccion || null,
          cliente.notas || null
        ]
      );
    } catch (error) {
      console.error('Error en agregarCliente:', error);
      throw error;
    }
  });
  
  ipcMain.handle('db:actualizarCliente', async (event, id, cliente) => {
    try {
      return db.actualizarCliente(id, cliente);
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      throw error;
    }
  });

  ipcMain.handle('db:eliminarCliente', async (event, id) => {
    try {
      return db.eliminarCliente(id);
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      throw error;
    }
  });

  // ========== USUARIOS ==========
  ipcMain.handle('db:getUsuarios', async () => {
    try {
      return db.query(
        'SELECT usuario_id, nombre_completo, username, rol, activo FROM usuarios ORDER BY nombre_completo'
      );
    } catch (error) {
      console.error('Error en getUsuarios:', error);
      throw error;
    }
  });

  // ========== MOVIMIENTOS DE STOCK ==========
  ipcMain.handle('db:getMovimientosStock', async (event, productoId = null, limite = 100) => {
    try {
      return db.getMovimientosStock(productoId, limite);
    } catch (error) {
      console.error('Error en getMovimientosStock:', error);
      throw error;
    }
  });

  // ========== BACKUP ==========
  ipcMain.handle('db:createBackup', async () => {
    try {
      return db.createBackup();
    } catch (error) {
      console.error('Error en createBackup:', error);
      return { success: false, error: error.message };
    }
  });

  // ========== CONSULTAS GENERALES ==========
  ipcMain.handle('db:query', async (event, sql, params = []) => {
    try {
      return db.query(sql, params);
    } catch (error) {
      console.error('Error en query:', error);
      throw error;
    }
  });

  ipcMain.handle('db:get', async (event, sql, params = []) => {
    try {
      return db.get(sql, params);
    } catch (error) {
      console.error('Error en get:', error);
      throw error;
    }
  });

  ipcMain.handle('db:run', async (event, sql, params = []) => {
    try {
      return db.run(sql, params);
    } catch (error) {
      console.error('Error en run:', error);
      throw error;
    }
  });

  console.log('✅ IPC Handlers configurados');
}