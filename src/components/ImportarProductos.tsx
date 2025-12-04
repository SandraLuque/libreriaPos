import { useState } from 'react';
import { 
  readExcelFile, 
  validateProductos, 
  processProductos, 
  generateExcelTemplate,
  type ProductoExcel,
  type ValidationError 
} from '../utils/excelProcessor';

interface Props {
  onImportComplete: () => void;
  onClose: () => void;
}

export default function ImportarProductos({ onImportComplete, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [productos, setProductos] = useState<ProductoExcel[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    
    try {
      // Leer Excel
      const data = await readExcelFile(selectedFile);
      
      // Validar
      const validationErrors = validateProductos(data);
      setErrors(validationErrors);
      
      if (validationErrors.length === 0) {
        // Procesar (generar códigos faltantes)
        const processedData = processProductos(data);
        setProductos(processedData);
        setStep('preview');
      } else {
        alert(`Se encontraron ${validationErrors.length} errores. Revisa la tabla.`);
      }
    } catch (error) {
      console.error('Error al leer archivo:', error);
      alert('Error al leer el archivo Excel. Verifica el formato.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setStep('importing');
    
    try {
      let imported = 0;
      let failed = 0;
      
      for (const producto of productos) {
        try {
          // Buscar o crear categoría
          let categoriaId: number | null = null;
          if (producto.categoria) {
            const categorias = await window.electronAPI.query(
              'SELECT categoria_id FROM categorias WHERE nombre = ?',
              [producto.categoria]
            );
            
            if (categorias.length > 0) {
              categoriaId = categorias[0].categoria_id;
            } else {
              // Crear categoría nueva
              const result = await window.electronAPI.run(
                'INSERT INTO categorias (nombre) VALUES (?)',
                [producto.categoria]
              );
              categoriaId = result.lastInsertRowid;
            }
          }
          
          // Insertar producto
          await window.electronAPI.agregarProducto({
            codigo_barras: producto.codigo_barras || null,
            sku: producto.sku || null,
            nombre: producto.nombre,
            descripcion: producto.descripcion || null,
            marca: producto.marca || null,
            categoria_id: categoriaId,
            precio_venta: producto.precio_venta,
            precio_costo: producto.precio_costo || null,
            stock_actual: producto.stock_actual,
            stock_minimo: producto.stock_minimo || 5
          });
          
          imported++;
        } catch (error) {
          console.error('Error importando producto:', producto.nombre, error);
          failed++;
        }
      }
      
      alert(`✅ Importación completada!\n\n✓ Importados: ${imported}\n✗ Fallidos: ${failed}`);
      onImportComplete();
      onClose();
      
    } catch (error) {
      console.error('Error en importación:', error);
      alert('Error durante la importación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Importar Productos desde Excel</h2>
            <p className="text-blue-100 text-sm mt-1">
              {step === 'upload' && 'Selecciona un archivo Excel'}
              {step === 'preview' && `${productos.length} productos listos para importar`}
              {step === 'importing' && 'Importando productos...'}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Botón descargar plantilla */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
      {/* ... (input y label) ... */}
      <label htmlFor="file-upload" className="cursor-pointer block">
        {/* ... (SVG y texto) ... */}
        {/* Mostrar nombre del archivo si existe */}
        {file && (
          <p className="text-sm font-medium text-blue-600 mt-2">
            Archivo Seleccionado: {file.name}
          </p>
        )}
      </label>
    </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">¿Primera vez importando?</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Descarga la plantilla Excel con el formato correcto
                    </p>
                    <button
                      type="button"
                      onClick={generateExcelTemplate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar Plantilla
                    </button>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Formato del archivo Excel:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span><strong>Nombre</strong> (obligatorio): Nombre del producto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span><strong>Precio Venta</strong> (obligatorio): Precio al público</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 flex-shrink-0">○</span>
                    <span><strong>Descripcion, Marca, Categoria</strong> (opcional)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 flex-shrink-0">○</span>
                    <span><strong>Codigo Barras, SKU</strong> (se generan automáticamente si están vacíos)</span>
                  </li>
                </ul>
              </div>

              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={loading}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {loading ? 'Procesando archivo...' : 'Click para seleccionar archivo Excel'}
                  </p>
                  <p className="text-sm text-gray-500">o arrastra el archivo aquí</p>
                  <p className="text-xs text-gray-400 mt-2">Archivos soportados: .xlsx, .xls</p>
                </label>
              </div>

              {/* Errores de validación */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-3">
                    ⚠️ Se encontraron {errors.length} errores:
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        <strong>Fila {error.row}:</strong> {error.message} ({error.field})
                      </p>
                    ))}
                  </div>
                  <p className="text-sm text-red-600 mt-3">
                    Corrige estos errores en el archivo Excel y vuelve a intentar.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  ✓ {productos.length} productos listos para importar. Revisa la vista previa.
                </p>
              </div>

              {/* Tabla de vista previa */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código Barras</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productos.map((producto, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{producto.nombre}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{producto.marca || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{producto.categoria || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">S/ {producto.precio_venta.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{producto.stock_actual}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{producto.codigo_barras}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{producto.sku}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Importando productos...</p>
              <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          
          {step === 'preview' && (
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar {productos.length} Productos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}