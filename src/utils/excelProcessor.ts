import * as XLSX from 'xlsx';
import { generateEAN13 } from './barcodeGenerator';

export interface ProductoExcel {
  nombre: string;
  descripcion?: string;
  marca?: string;
  categoria?: string;
  precio_venta: number;
  precio_costo?: number;
  stock_actual: number;
  stock_minimo?: number;
  codigo_barras?: string;
  sku?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Lee archivo Excel y retorna array de productos
 */
export async function readExcelFile(file: File): Promise<ProductoExcel[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Leer primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convertir a JSON
        const jsonData: unknown[] = XLSX.utils.sheet_to_json(firstSheet);
        
        // Mapear a nuestro formato
        const productos: ProductoExcel[] = jsonData.map((row: unknown) => {
          const r = row as Record<string, unknown>;
          
          return {
            nombre: String(r['Nombre'] || r['nombre'] || ''),
            descripcion: String(r['Descripcion'] || r['descripcion'] || r['Descripción'] || ''),
            marca: String(r['Marca'] || r['marca'] || ''),
            categoria: String(r['Categoria'] || r['categoria'] || r['Categoría'] || ''),
            precio_venta: parseFloat(String(r['Precio Venta'] || r['precio_venta'] || r['Precio'] || 0)),
            precio_costo: parseFloat(String(r['Precio Costo'] || r['precio_costo'] || r['Costo'] || 0)),
            stock_actual: parseInt(String(r['Stock'] || r['stock_actual'] || r['Stock Actual'] || 0)),
            stock_minimo: parseInt(String(r['Stock Minimo'] || r['stock_minimo'] || r['Stock Mínimo'] || 5)),
            codigo_barras: String(r['Codigo Barras'] || r['codigo_barras'] || r['Código de Barras'] || ''),
            sku: String(r['SKU'] || r['sku'] || '')
          };
        });
        
        resolve(productos);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Valida los datos del Excel
 */
export function validateProductos(productos: ProductoExcel[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  productos.forEach((producto, index) => {
    const row = index + 2; // +2 porque row 1 es header y array empieza en 0
    
    // Validar nombre (obligatorio)
    if (!producto.nombre || producto.nombre.trim() === '') {
      errors.push({
        row,
        field: 'nombre',
        message: 'El nombre es obligatorio'
      });
    }
    
    // Validar precio venta (obligatorio y > 0)
    if (!producto.precio_venta || producto.precio_venta <= 0) {
      errors.push({
        row,
        field: 'precio_venta',
        message: 'El precio de venta debe ser mayor a 0'
      });
    }
    
    // Validar stock
    if (producto.stock_actual < 0) {
      errors.push({
        row,
        field: 'stock_actual',
        message: 'El stock no puede ser negativo'
      });
    }
    
    // Validar que precio_costo no sea mayor que precio_venta
    if (producto.precio_costo && producto.precio_costo > producto.precio_venta) {
      errors.push({
        row,
        field: 'precio_costo',
        message: 'El precio de costo no puede ser mayor al precio de venta'
      });
    }
  });
  
  return errors;
}

/**
 * Procesa productos: genera códigos de barras y SKUs faltantes
 */
export function processProductos(productos: ProductoExcel[]): ProductoExcel[] {
  return productos.map((producto) => {
    // Generar código de barras si no tiene
    if (!producto.codigo_barras || producto.codigo_barras.trim() === '') {
      producto.codigo_barras = generateEAN13();
    }
    
    // Generar SKU si no tiene
    if (!producto.sku || producto.sku.trim() === '') {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      producto.sku = `PROD-${timestamp}${random}`;
    }
    
    return producto;
  });
}

/**
 * Genera plantilla Excel para descargar
 */
export function generateExcelTemplate(): void {
  const template = [
    {
      'Nombre': 'Ejemplo Producto 1',
      'Descripcion': 'Descripción del producto',
      'Marca': 'Marca Ejemplo',
      'Categoria': 'Categoría Ejemplo',
      'Precio Venta': 10.50,
      'Precio Costo': 7.00,
      'Stock': 50,
      'Stock Minimo': 10,
      'Codigo Barras': '',
      'SKU': ''
    },
    {
      'Nombre': 'Ejemplo Producto 2',
      'Descripcion': '',
      'Marca': 'Otra Marca',
      'Categoria': 'Bebidas',
      'Precio Venta': 5.00,
      'Precio Costo': 3.50,
      'Stock': 100,
      'Stock Minimo': 20,
      'Codigo Barras': '',
      'SKU': ''
    }
  ];
  
  // Crear libro de Excel
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Descargar
  XLSX.writeFile(workbook, 'plantilla_productos.xlsx');
}