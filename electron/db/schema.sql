-- ============================================
-- SCHEMA SQLITE PARA SISTEMA DE TIENDA
-- Compatible con libreriapos
-- ============================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================
-- TABLAS AUXILIARES
-- ============================================

-- Tabla: Categorías
CREATE TABLE IF NOT EXISTS categorias (
    categoria_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo INTEGER DEFAULT 1,
    fecha_creacion TEXT DEFAULT (datetime('now','localtime')),
    CHECK(LENGTH(TRIM(nombre)) > 0)
);

-- Tabla: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_documento TEXT DEFAULT 'DNI' CHECK(tipo_documento IN ('DNI', 'RUC', 'CE', 'PASAPORTE')),
    num_documento TEXT,
    nombre_completo TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    fecha_registro TEXT DEFAULT (datetime('now','localtime')),
    activo INTEGER DEFAULT 1,
    notas TEXT,
    CHECK(LENGTH(TRIM(nombre_completo)) > 0)
);

-- Tabla: Usuarios (Personal de la tienda)
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'VENDEDOR' CHECK(rol IN ('ADMIN', 'VENDEDOR')),
    activo INTEGER DEFAULT 1,
    fecha_creacion TEXT DEFAULT (datetime('now','localtime')),
    ultimo_acceso TEXT,
    CHECK(LENGTH(TRIM(username)) >= 3),
    CHECK(LENGTH(TRIM(nombre_completo)) > 0)
);

-- ============================================
-- TABLA PRINCIPAL: PRODUCTOS
-- ============================================

CREATE TABLE IF NOT EXISTS productos (
    producto_id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras TEXT UNIQUE,
    sku TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    marca TEXT,
    categoria_id INTEGER,
    precio_venta REAL NOT NULL CHECK(precio_venta >= 0),
    precio_costo REAL CHECK(precio_costo >= 0),
    stock_actual INTEGER NOT NULL DEFAULT 0 CHECK(stock_actual >= 0),
    stock_minimo INTEGER DEFAULT 5 CHECK(stock_minimo >= 0),
    activo INTEGER DEFAULT 1,
    imagen_url TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now','localtime')),
    fecha_modificacion TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id) ON DELETE SET NULL,
    CHECK(LENGTH(TRIM(nombre)) > 0)
);

-- ============================================
-- TABLAS: TRANSACCIONES (VENTAS)
-- ============================================

-- Tabla: Ventas
CREATE TABLE IF NOT EXISTS ventas (
    venta_id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    tipo_documento TEXT DEFAULT 'Boleta' CHECK(tipo_documento IN ('Boleta', 'Factura', 'Ticket')),
    num_documento TEXT,
    total REAL NOT NULL CHECK(total >= 0),
    subtotal REAL NOT NULL DEFAULT 0 CHECK(subtotal >= 0),
    igv REAL DEFAULT 0 CHECK(igv >= 0),
    descuento REAL DEFAULT 0 CHECK(descuento >= 0),
    cliente_id INTEGER,
    usuario_id INTEGER NOT NULL,
    metodo_pago TEXT DEFAULT 'Efectivo' CHECK(metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin', 'Mixto')),
    estado TEXT DEFAULT 'Completado' CHECK(estado IN ('Completado', 'Anulado', 'Pendiente')),
    notas TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT
);

-- Tabla: Detalle de Ventas
CREATE TABLE IF NOT EXISTS detalle_venta (
    detalle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK(cantidad > 0),
    precio_unitario REAL NOT NULL CHECK(precio_unitario >= 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    descuento REAL DEFAULT 0 CHECK(descuento >= 0),
    FOREIGN KEY (venta_id) REFERENCES ventas(venta_id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id) ON DELETE RESTRICT
);

-- ============================================
-- TABLA: MOVIMIENTOS DE STOCK
-- ============================================

CREATE TABLE IF NOT EXISTS movimientos_stock (
    movimiento_id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    tipo_movimiento TEXT NOT NULL CHECK(
        tipo_movimiento IN ('VENTA', 'COMPRA', 'AJUSTE_ENTRADA', 
                            'AJUSTE_SALIDA', 'DEVOLUCION', 'INICIAL')
    ),
    cantidad INTEGER NOT NULL CHECK(cantidad != 0),
    stock_anterior INTEGER NOT NULL CHECK(stock_anterior >= 0),
    stock_nuevo INTEGER NOT NULL CHECK(stock_nuevo >= 0),
    referencia_id INTEGER,
    referencia_tipo TEXT CHECK(referencia_tipo IN ('VENTA', 'COMPRA', 'AJUSTE')),
    usuario_id INTEGER,
    notas TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE SET NULL
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Productos
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo) WHERE activo = 1;
CREATE INDEX IF NOT EXISTS idx_productos_bajo_stock ON productos(stock_actual) WHERE stock_actual < 20;

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(tipo_documento, num_documento);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo) WHERE activo = 1;

-- Usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo) WHERE activo = 1;

-- Ventas
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);

-- Detalle Venta
CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_venta(producto_id);

-- Movimientos Stock
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_stock(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_stock(tipo_movimiento);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Actualizar fecha_modificacion en productos
CREATE TRIGGER IF NOT EXISTS trg_productos_update_timestamp
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET fecha_modificacion = datetime('now','localtime')
    WHERE producto_id = NEW.producto_id;
END;

-- Trigger: Registrar movimiento de stock automáticamente
CREATE TRIGGER IF NOT EXISTS trg_productos_movimiento_stock
AFTER UPDATE OF stock_actual ON productos
FOR EACH ROW
WHEN OLD.stock_actual != NEW.stock_actual
BEGIN
    INSERT INTO movimientos_stock (
        producto_id, 
        tipo_movimiento, 
        cantidad,
        stock_anterior, 
        stock_nuevo,
        notas
    ) VALUES (
        NEW.producto_id,
        CASE 
            WHEN NEW.stock_actual > OLD.stock_actual THEN 'AJUSTE_ENTRADA'
            ELSE 'AJUSTE_SALIDA'
        END,
        NEW.stock_actual - OLD.stock_actual,
        OLD.stock_actual,
        NEW.stock_actual,
        'Actualización automática de stock'
    );
END;

-- Trigger: Actualizar stock al registrar venta
CREATE TRIGGER IF NOT EXISTS trg_detalle_venta_actualizar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE producto_id = NEW.producto_id;
    
    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        referencia_id,
        referencia_tipo,
        notas
    )
    SELECT 
        NEW.producto_id,
        'VENTA',
        -NEW.cantidad,
        stock_actual + NEW.cantidad,
        stock_actual,
        NEW.venta_id,
        'VENTA',
        'Venta ID: ' || NEW.venta_id
    FROM productos WHERE producto_id = NEW.producto_id;
END;

-- ============================================
-- VISTAS
-- ============================================

-- Vista: Productos con información completa
CREATE VIEW IF NOT EXISTS v_productos_info AS
SELECT 
    p.producto_id,
    p.codigo_barras,
    p.sku,
    p.nombre,
    p.descripcion,
    p.marca,
    p.categoria_id,
    c.nombre as categoria_nombre,
    p.precio_venta,
    p.precio_costo,
    ROUND(p.precio_venta - IFNULL(p.precio_costo, 0), 2) as margen_ganancia,
    ROUND((p.precio_venta - IFNULL(p.precio_costo, 0)) * 100.0 / NULLIF(p.precio_venta, 0), 2) as porcentaje_margen,
    p.stock_actual,
    p.stock_minimo,
    CASE
        WHEN p.stock_actual = 0 THEN 'SIN STOCK'
        WHEN p.stock_actual < p.stock_minimo THEN 'BAJO STOCK'
        WHEN p.stock_actual < (p.stock_minimo * 2) THEN 'ADVERTENCIA'
        ELSE 'OK'
    END as estado_stock,
    p.activo,
    p.imagen_url,
    p.fecha_creacion,
    p.fecha_modificacion
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
WHERE p.activo = 1;

-- Vista: Resumen de ventas diarias
CREATE VIEW IF NOT EXISTS v_ventas_diarias AS
SELECT 
    DATE(v.fecha_hora) as fecha,
    COUNT(v.venta_id) as total_ventas,
    SUM(v.total) as monto_total,
    SUM(v.descuento) as descuento_total,
    SUM(v.subtotal) as subtotal_total,
    SUM(v.igv) as igv_total,
    COUNT(DISTINCT v.cliente_id) as clientes_unicos,
    ROUND(AVG(v.total), 2) as ticket_promedio,
    SUM(CASE WHEN v.metodo_pago = 'Efectivo' THEN v.total ELSE 0 END) as total_efectivo,
    SUM(CASE WHEN v.metodo_pago = 'Tarjeta' THEN v.total ELSE 0 END) as total_tarjeta,
    SUM(CASE WHEN v.metodo_pago = 'Yape' THEN v.total ELSE 0 END) as total_yape,
    SUM(CASE WHEN v.metodo_pago = 'Plin' THEN v.total ELSE 0 END) as total_plin
FROM ventas v
WHERE v.estado = 'Completado'
GROUP BY DATE(v.fecha_hora)
ORDER BY fecha DESC;

-- Vista: Productos más vendidos
CREATE VIEW IF NOT EXISTS v_productos_mas_vendidos AS
SELECT 
    p.producto_id,
    p.nombre,
    p.marca,
    c.nombre as categoria,
    SUM(dv.cantidad) as total_vendido,
    SUM(dv.subtotal) as ingresos_totales,
    COUNT(DISTINCT dv.venta_id) as num_ventas,
    ROUND(AVG(dv.precio_unitario), 2) as precio_promedio,
    p.stock_actual
FROM detalle_venta dv
JOIN productos p ON dv.producto_id = p.producto_id
LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
JOIN ventas v ON dv.venta_id = v.venta_id
WHERE p.activo = 1 AND v.estado = 'Completado'
GROUP BY p.producto_id, p.nombre, p.marca, c.nombre, p.stock_actual
ORDER BY total_vendido DESC;

-- Vista: Productos con stock bajo
CREATE VIEW IF NOT EXISTS v_productos_bajo_stock AS
SELECT 
    p.producto_id,
    p.sku,
    p.nombre,
    p.marca,
    c.nombre as categoria,
    p.stock_actual,
    p.stock_minimo,
    CASE
        WHEN p.stock_actual = 0 THEN 'CRÍTICO - Sin Stock'
        WHEN p.stock_actual < p.stock_minimo THEN 'URGENTE - Bajo Mínimo'
        WHEN p.stock_actual < (p.stock_minimo * 2) THEN 'ADVERTENCIA - Cerca del Mínimo'
        ELSE 'OK'
    END as nivel_alerta,
    p.precio_venta,
    p.precio_costo
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
WHERE p.activo = 1 
  AND p.stock_actual <= (p.stock_minimo * 2)
ORDER BY 
    CASE 
        WHEN p.stock_actual = 0 THEN 1
        WHEN p.stock_actual < p.stock_minimo THEN 2
        ELSE 3
    END,
    p.stock_actual ASC;

-- Vista: Ventas por usuario
CREATE VIEW IF NOT EXISTS v_ventas_por_usuario AS
SELECT 
    u.usuario_id,
    u.nombre_completo,
    u.username,
    u.rol,
    COUNT(v.venta_id) as total_ventas,
    IFNULL(SUM(v.total), 0) as monto_total_vendido,
    IFNULL(ROUND(AVG(v.total), 2), 0) as ticket_promedio,
    DATE(MAX(v.fecha_hora)) as ultima_venta
FROM usuarios u
LEFT JOIN ventas v ON u.usuario_id = v.usuario_id AND v.estado = 'Completado'
WHERE u.activo = 1
GROUP BY u.usuario_id, u.nombre_completo, u.username, u.rol
ORDER BY monto_total_vendido DESC;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Categorías por defecto
INSERT OR IGNORE INTO categorias (nombre, descripcion) VALUES
('Abarrotes', 'Productos de consumo básico'),
('Bebidas', 'Bebidas frías y calientes'),
('Snacks', 'Golosinas y botanas'),
('Lácteos', 'Productos lácteos refrigerados'),
('Limpieza', 'Artículos de limpieza del hogar'),
('Panadería', 'Pan y productos de panadería'),
('Frutas y Verduras', 'Productos frescos'),
('Embutidos', 'Jamones, salchichas y embutidos'),
('Congelados', 'Productos congelados'),
('Varios', 'Productos sin categoría específica');

-- Cliente general por defecto
INSERT OR IGNORE INTO clientes (nombre_completo, tipo_documento, num_documento) 
VALUES ('Cliente General', 'DNI', '00000000'),
       ('Consumidor Sammy', 'DNI', '99999999');

-- Usuarios por defecto
-- Contraseña para ambos: "admin123" (debes cambiarla en producción)
-- Hash bcrypt de "admin123": $2a$10$rOZJe5XvJKhHqXYvVYvLVOKdHLh.x6y4cYvhqY5XvJKhHqXYvVYvL
INSERT OR IGNORE INTO usuarios (nombre_completo, username, password_hash, rol) VALUES
('Administrador del Sistema', 'admin', '$2b$10$SJrGaARpjXW0CvkVNwtCQOsQsEDxwgf7XfoVGfUqan7xFh5eij5yK', 'ADMIN'),
('Vendedor Principal', 'vendedor', '$2b$10$SJrGaARpjXW0CvkVNwtCQOsQsEDxwgf7XfoVGfUqan7xFh5eij5yK', 'VENDEDOR');

-- Productos de ejemplo (opcional - puedes eliminar estos)
INSERT OR IGNORE INTO productos (sku, codigo_barras, nombre, marca, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo) VALUES
('PROD001', '7501234567890', 'Coca Cola 500ml', 'Coca Cola', 2, 3.50, 2.50, 50, 10),
('PROD002', '7501234567891', 'Galletas Sublime', 'Nestle', 3, 2.00, 1.50, 30, 15),
('PROD003', '7501234567892', 'Arroz Costeño 1kg', 'Costeño', 1, 4.50, 3.80, 100, 20),
('PROD004', '7501234567893', 'Leche Gloria 1L', 'Gloria', 4, 5.50, 4.20, 25, 10),
('PROD005', '7501234567894', 'Detergente Ariel 1kg', 'Ariel', 5, 12.00, 9.50, 15, 5);

-- ============================================
-- INFORMACIÓN DEL SCHEMA
-- ============================================

-- Versión del schema
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    fecha_aplicacion TEXT DEFAULT (datetime('now','localtime')),
    descripcion TEXT
);

INSERT OR REPLACE INTO schema_version (version, descripcion) 
VALUES ('1.0.0', 'Schema inicial - Sistema POS para tienda pequeña');

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver todas las tablas creadas
SELECT 'Tablas creadas:' as info;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Ver todas las vistas creadas
SELECT 'Vistas creadas:' as info;
SELECT name FROM sqlite_master WHERE type='view' ORDER BY name;

-- Ver índices creados
SELECT 'Índices creados:' as info;
SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name;

-- Ver triggers creados
SELECT 'Triggers creados:' as info;
SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name;