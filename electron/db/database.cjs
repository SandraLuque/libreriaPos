/**
 * Database Manager para libreriapos
 * SQLite con better-sqlite3
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.initialize();
  }

  initialize() {
    try {
      // Ruta de la base de datos en userData
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'tienda.db');
      
      console.log('📁 Database path:', this.dbPath);

      // Crear directorio si no existe
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Conectar a SQLite
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null
      });

      // Optimizaciones
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');

      // Verificar si necesita ejecutar schema
      const tableCount = this.db.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      ).get();

      if (tableCount.count === 0) {
        console.log('🔧 Ejecutando schema inicial...');
        this.runSchema();
      } else {
        console.log('✅ Base de datos cargada');
      }

      this.checkIntegrity();
    } catch (error) {
      console.error('❌ Error inicializando BD:', error);
      throw error;
    }
  }

  runSchema() {
    try {
      // Buscar schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error('schema.sql no encontrado en electron/db/');
      }

      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      
      console.log('✅ Schema ejecutado correctamente');
    } catch (error) {
      console.error('❌ Error ejecutando schema:', error);
      throw error;
    }
  }

  checkIntegrity() {
    const result = this.db.pragma('integrity_check');
    if (result[0].integrity_check === 'ok') {
      console.log('✅ Integridad verificada');
      return true;
    }
    return false;
  }

  // Métodos base
  query(sql, params = []) {
    return this.db.prepare(sql).all(params);
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(params);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(params);
  }

  transaction(callback) {
    const transaction = this.db.transaction(callback);
    return transaction();
  }

  // ========================================
  // MÉTODOS DE NEGOCIO
  // ========================================

  // Autenticación
  authenticateUser(username) {
    return this.get(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username]
    );
  }

  // Productos
  getProductosActivos() {
    return this.query('SELECT * FROM v_productos_info ORDER BY nombre');
  }

  buscarProductos(termino) {
    const search = `%${termino}%`;
    return this.query(
      `SELECT * FROM v_productos_info 
       WHERE (nombre LIKE ? OR codigo_barras LIKE ? OR sku LIKE ?)
       LIMIT 50`,
      [search, search, search]
    );
  }

  agregarProducto(producto) {
    return this.run(
      `INSERT INTO productos (
        codigo_barras, sku, nombre, descripcion, marca, categoria_id,
        precio_venta, precio_costo, stock_actual, stock_minimo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        producto.codigo_barras || null,
        producto.sku || null,
        producto.nombre,
        producto.descripcion || null,
        producto.marca || null,
        producto.categoria_id || null,
        producto.precio_venta,
        producto.precio_costo || null,
        producto.stock_actual || 0,
        producto.stock_minimo || 5
      ]
    );
  }

  actualizarProducto(id, producto) {
    return this.run(
      `UPDATE productos SET
        codigo_barras = ?, sku = ?, nombre = ?, descripcion = ?,
        marca = ?, categoria_id = ?, precio_venta = ?, precio_costo = ?,
        stock_actual = ?, stock_minimo = ?
      WHERE producto_id = ?`,
      [
        producto.codigo_barras || null,
        producto.sku || null,
        producto.nombre,
        producto.descripcion || null,
        producto.marca || null,
        producto.categoria_id || null,
        producto.precio_venta,
        producto.precio_costo || null,
        producto.stock_actual,
        producto.stock_minimo || 5,
        id
      ]
    );
  }

  eliminarProducto(id) {
    return this.run('UPDATE productos SET activo = 0 WHERE producto_id = ?', [id]);
  }

  // Ventas con transacción
  registrarVenta(venta, detalles) {
    return this.transaction(() => {
      const ventaResult = this.run(
        `INSERT INTO ventas (
          usuario_id, cliente_id, total, subtotal, igv, descuento,
          tipo_documento, metodo_pago, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          venta.usuario_id,
          venta.cliente_id || 1,
          venta.total,
          venta.subtotal,
          venta.igv || 0,
          venta.descuento || 0,
          venta.tipo_documento || 'Boleta',
          venta.metodo_pago || 'Efectivo',
          venta.notas || null
        ]
      );

      const ventaId = ventaResult.lastInsertRowid;

      for (const detalle of detalles) {
        this.run(
          `INSERT INTO detalle_venta (
            venta_id, producto_id, cantidad, precio_unitario, subtotal
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            ventaId,
            detalle.producto_id,
            detalle.cantidad,
            detalle.precio_unitario,
            detalle.subtotal
          ]
        );
      }

      return { ventaId, success: true };
    });
  }

  getVentasHoy() {
    return this.query(
      `SELECT * FROM ventas 
       WHERE DATE(fecha_hora) = DATE('now','localtime')
       AND estado = 'Completado'
       ORDER BY fecha_hora DESC`
    );
  }

  // Reportes
  getProductosBajoStock() {
    return this.query('SELECT * FROM v_productos_bajo_stock');
  }

  getProductosMasVendidos(limite = 10) {
    return this.query('SELECT * FROM v_productos_mas_vendidos LIMIT ?', [limite]);
  }

  getEstadisticas() {
    return {
      totalProductos: this.get('SELECT COUNT(*) as count FROM productos WHERE activo = 1')?.count || 0,
      totalVentasHoy: this.get("SELECT COUNT(*) as count FROM ventas WHERE DATE(fecha_hora) = DATE('now','localtime')")?.count || 0,
      totalIngresosHoy: this.get("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE DATE(fecha_hora) = DATE('now','localtime')")?.total || 0,
      productosStockBajo: this.get('SELECT COUNT(*) as count FROM productos WHERE stock_actual < stock_minimo')?.count || 0
    };
  }

  // Categorías
  getCategorias() {
    return this.query('SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre');
  }

  // Clientes
  getClientes() {
    return this.query('SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre_completo');
  }

  buscarCliente(termino) {
    const search = `%${termino}%`;
    return this.query(
      `SELECT * FROM clientes 
       WHERE (nombre_completo LIKE ? OR num_documento LIKE ?)
       AND activo = 1 LIMIT 20`,
      [search, search]
    );
  }

  agregarCliente(cliente) {
    return this.run(
        `INSERT INTO clientes (
            tipo_documento, num_documento, nombre_completo, 
            email, telefono, direccion
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
            cliente.tipo_documento || 'DNI',
            cliente.documento_identidad || null, // Usar documento_identidad en lugar de num_documento
            cliente.nombre_completo,
            cliente.email || null,
            cliente.telefono || null,
            cliente.direccion || null
        ]
    );
}

actualizarCliente(id, cliente) {
    return this.run(
        `UPDATE clientes SET 
            nombre_completo = ?, 
            num_documento = ?,                   
            tipo_documento = ?,
            email = ?, 
            telefono = ?, 
            direccion = ?
        WHERE cliente_id = ?`,
        [
            cliente.nombre_completo, 
            cliente.documento_identidad || null, // Se mantiene 'documento_identidad' en JS para consistencia del frontend
            cliente.tipo_documento || 'DNI',
            cliente.email || null, 
            cliente.telefono || null, 
            cliente.direccion || null, 
            id
        ]
    );
}

eliminarCliente(id) {
    // Eliminación lógica: Actualiza el estado a inactivo
    return this.run('UPDATE clientes SET activo = 0 WHERE cliente_id = ?', [id]);
}
  // Backup
  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(app.getPath('userData'), 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);
      this.db.backup(backupPath);
      
      console.log('✅ Backup creado:', backupPath);
      this.cleanOldBackups(backupDir);
      
      return { success: true, path: backupPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  cleanOldBackups(backupDir, keep = 30) {
    try {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > keep) {
        files.slice(keep).forEach(f => fs.unlinkSync(f.path));
      }
    } catch (error) {
      console.error('Error limpiando backups:', error);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('🔒 BD cerrada');
    }
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new DatabaseManager();
    }
    return instance;
  }
};