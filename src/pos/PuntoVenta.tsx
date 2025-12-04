// src/pos/PuntoVenta.tsx

import React, { useState, useMemo, useEffect } from 'react';

import { useAuth } from '../hook/useAuth';

// ----------------------------------------------------------------------
// 1. INTERFACES Y TIPOS
// ----------------------------------------------------------------------

interface Producto {
  producto_id: number;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
  sku: string;
}

interface ItemCarrito {
  producto_id: number;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
  cantidad: number;
  descuento_item: number; // Descuento aplicado solo a este ítem (en S/)
  subtotal_item: number; // subtotal_item = (precio_venta * cantidad) - descuento_item
}

interface Cliente {
  cliente_id: number;
  nombre_completo: string;
  documento_identidad: string | null;
}

interface ResumenVenta {
  subtotal: number; 
  descuento: number;
  igv: number;
  total: number;
  cambio: number;
  subtotalNeto: number;
}

// ----------------------------------------------------------------------
// 2. FUNCIÓN PRINCIPAL DEL COMPONENTE
// ----------------------------------------------------------------------

export default function PuntoVenta() {
  const { user } = useAuth();
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // --- ESTADOS DE VENTA ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta'>('Efectivo'); 
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  
  // --- NUEVO ESTADO DE DESCUENTO GENERAL ---
  const [descuentoGeneral, setDescuentoGeneral] = useState(0); // Descuento global en S/
  // -----------------------------
  
  // Carga inicial de productos y cliente por defecto
  useEffect(() => {
    handleBuscarProductos(''); 
    // Asume que el cliente con ID 1 es el 'Cliente General'
    setClienteSeleccionado({ cliente_id: 1, nombre_completo: 'Público General', documento_identidad: null });
  }, []);

  // ----------------------------------------------------------------------
  // 3. LÓGICA DE BÚSQUEDA
  // ----------------------------------------------------------------------

  const handleBuscarProductos = async (termino: string) => {
    try {
      // Usar la API de Electron para buscar productos
      const results: Producto[] = await window.electronAPI.buscarProductos(termino);
      setProductosDisponibles(results);
    } catch (error) {
      console.error('Error buscando productos:', error);
    }
  };

  const handleBuscarCliente = async (termino: string) => {
    if (termino.length > 2) {
      try {
        const results: Cliente[] = await window.electronAPI.buscarCliente(termino);
        setClientesEncontrados(results);
      } catch (error) {
        console.error('Error buscando clientes:', error);
      }
    } else {
      setClientesEncontrados([]);
    }
  };
  
  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setClientesEncontrados([]); 
  };

  // ----------------------------------------------------------------------
  // 4. LÓGICA DEL CARRITO (Añadido manejo de cantidad y descuento por ítem)
  // ----------------------------------------------------------------------
  
  const recalcularItem = (item: ItemCarrito): ItemCarrito => {
    const totalBruto = item.precio_venta * item.cantidad;
    // Asegurarse de que el descuento no exceda el total bruto
    const descuentoLimitado = Math.min(item.descuento_item, totalBruto);
    return {
        ...item,
        descuento_item: descuentoLimitado,
        subtotal_item: totalBruto - descuentoLimitado,
    };
  };

  const handleAgregarProducto = (producto: Producto) => {
    setCarrito(prevCarrito => {
      const itemExistente = prevCarrito.find(item => item.producto_id === producto.producto_id);

      if (itemExistente) {
        // Aumentar la cantidad si hay stock
        const nuevaCantidad = itemExistente.cantidad + 1;
        if (nuevaCantidad > producto.stock_actual) {
            alert(`Stock insuficiente. Máximo: ${producto.stock_actual}`);
            return prevCarrito;
        }
        
        const nuevoCarrito = prevCarrito.map(item => 
            item.producto_id === producto.producto_id
                ? recalcularItem({ ...item, cantidad: nuevaCantidad })
                : item
        );
        return nuevoCarrito;
      } else {
        // Agregar nuevo ítem
        if (producto.stock_actual === 0) {
             alert('Este producto no tiene stock.');
             return prevCarrito;
        }
        const nuevoItem: ItemCarrito = {
            producto_id: producto.producto_id,
            nombre: producto.nombre,
            precio_venta: producto.precio_venta,
            stock_actual: producto.stock_actual,
            cantidad: 1,
            descuento_item: 0,
            subtotal_item: producto.precio_venta, // (precio * 1) - 0
        };
        return [...prevCarrito, nuevoItem];
      }
    });
  };

  const handleActualizarCantidad = (producto_id: number, nuevaCantidadStr: string) => {
    const nuevaCantidad = parseInt(nuevaCantidadStr);

    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
        // Permitir que el input se vacíe, pero no actualiza el carrito a 0
        return; 
    }
    
    setCarrito(prevCarrito => {
        const item = prevCarrito.find(i => i.producto_id === producto_id);
        if (!item) return prevCarrito;

        // Validar stock
        if (nuevaCantidad > item.stock_actual) {
            alert(`Stock insuficiente. Máximo: ${item.stock_actual}`);
            return prevCarrito; // No actualizar
        }

        const nuevoCarrito = prevCarrito.map(i => 
            i.producto_id === producto_id
                ? recalcularItem({ ...i, cantidad: nuevaCantidad })
                : i
        );
        return nuevoCarrito.filter(i => i.cantidad > 0); // Filtra items con cantidad 0
    });
  };
  
  const handleActualizarDescuentoItem = (producto_id: number, nuevoDescuentoStr: string) => {
    const nuevoDescuento = parseFloat(nuevoDescuentoStr) || 0;
    
    setCarrito(prevCarrito => {
        return prevCarrito.map(i => 
            i.producto_id === producto_id
                ? recalcularItem({ ...i, descuento_item: nuevoDescuento })
                : i
        );
    });
  };

  const handleEliminarItem = (producto_id: number) => {
    setCarrito(prevCarrito => prevCarrito.filter(item => item.producto_id !== producto_id));
  };


  // ----------------------------------------------------------------------
  // 5. CÁLCULOS DE VENTA (useMemo para optimización)
  // ----------------------------------------------------------------------

  const resumenVenta:ResumenVenta = useMemo(() => {
    const subtotalBruto = carrito.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);
    const descuentoItems = carrito.reduce((sum, item) => sum + item.descuento_item, 0);
    
    // Subtotal antes de impuestos y descuento general
    const subtotalAntesImpuestos = subtotalBruto - descuentoItems;
    
    // Aplicar descuento general
    const descuentoTotal = descuentoItems + descuentoGeneral;
    const subtotalNeto = Math.max(0, subtotalAntesImpuestos - descuentoGeneral); // Asegura que no sea negativo
    
    const igvTasa = 0.18; 
    const igv = subtotalNeto * igvTasa;
    const total = subtotalNeto + igv;
    
    // Cálculo de Cambio
    const cambio = (metodoPago === 'Efectivo' && montoRecibido >= total) 
        ? montoRecibido - total 
        : 0;

    return {
      subtotal: parseFloat(subtotalAntesImpuestos.toFixed(2)), // Subtotal antes de desc. general e IGV
      descuento: parseFloat(descuentoTotal.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      cambio: parseFloat(cambio.toFixed(2)),
      subtotalNeto: parseFloat(subtotalNeto.toFixed(2)), // Subtotal que se aplica IGV
    };
  }, [carrito, montoRecibido, metodoPago, descuentoGeneral]); 

  // ----------------------------------------------------------------------
  // 6. REGISTRO DE VENTA
  // ----------------------------------------------------------------------

  const handleRegistrarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    
    if (metodoPago === 'Efectivo' && resumenVenta.cambio < 0) {
        alert('El monto recibido es insuficiente.');
        return;
    }

    // Datos de la Venta (Encabezado)
    const ventaHeader = {
      usuario_id: user?.usuario_id || 0, // Usar el ID del usuario autenticado
      cliente_id: clienteSeleccionado?.cliente_id || 1, 
      total: resumenVenta.total,
      subtotal: resumenVenta.subtotalNeto, // El subtotal que se registra es el que se usa para calcular el total
      igv: resumenVenta.igv,
      descuento: resumenVenta.descuento,
      tipo_documento: 'Boleta', 
      metodo_pago: metodoPago, 
      notas: null,
    };

    // Datos del Detalle (Líneas)
    const ventaDetalles = carrito.map(item => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_venta,
      subtotal: item.subtotal_item, 
      descuento: item.descuento_item,
    }));

    try {
      const result = await window.electronAPI.registrarVenta(ventaHeader, ventaDetalles);
      
      alert(`Venta registrada con éxito. ID: ${result.ventaId}. Cambio: S/ ${resumenVenta.cambio.toFixed(2)}`);
      setCarrito([]); 
      setMontoRecibido(0); 
      setDescuentoGeneral(0);
      setClienteSeleccionado({ cliente_id: 1, nombre_completo: 'Público General', documento_identidad: null }); 

    } catch (error) {
      console.error('Error registrando venta:', error);
      alert('Error al registrar la venta. Verifique stock y datos.');
    }
  };

  // ----------------------------------------------------------------------
  // 7. RENDERIZADO
  // ----------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-60px)] bg-gray-100 p-4">
      {/* Columna Izquierda: Búsqueda y Productos */}
      <div className="w-2/3 pr-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Punto de Venta 🛒</h2>

        {/* Input de Búsqueda de Productos */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar producto (nombre, código, SKU)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            value={terminoBusqueda}
            onChange={(e) => {
              setTerminoBusqueda(e.target.value);
              handleBuscarProductos(e.target.value);
            }}
          />
        </div>
        
        {/* Listado de Productos (Grid) */}
        <div className="flex-grow overflow-y-auto bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Productos ({productosDisponibles.length})</h3>
            <div className="grid grid-cols-5 gap-3">
                {productosDisponibles.map(p => (
                <div 
                    key={p.producto_id} 
                    onClick={() => handleAgregarProducto(p)}
                    className={`bg-white p-3 border rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-shadow duration-150 
                                ${p.stock_actual === 0 ? 'opacity-60 border-red-500' : 'border-green-300'}`}
                >
                    <p className="text-sm font-bold text-gray-800 truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-500">Stock: {p.stock_actual}</p>
                    <p className="text-md font-extrabold text-blue-600">S/ {p.precio_venta.toFixed(2)}</p>
                </div>
                ))}
            </div>
        </div>
      </div>

      {/* Columna Derecha: Carrito y Pago */}
      <div className="w-1/3 flex flex-col bg-white p-4 rounded-lg shadow-2xl">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Detalle de Venta</h2>
        
        {/* GESTIÓN DEL CLIENTE */}
        <ClienteSelector 
            clienteSeleccionado={clienteSeleccionado} 
            clientesEncontrados={clientesEncontrados}
            setClienteSeleccionado={setClienteSeleccionado}
            handleBuscarCliente={handleBuscarCliente}
            handleSeleccionarCliente={handleSeleccionarCliente}
        />
        
        {/* Carrito de Compras */}
        <div className="flex-grow overflow-y-auto space-y-3 mb-4 border-t pt-4">
            {carrito.length === 0 ? (
                <p className="text-gray-500 text-center mt-10">Agrega productos para iniciar la venta.</p>
            ) : (
                carrito.map(item => (
                    <ItemCarritoRow 
                        key={item.producto_id}
                        item={item}
                        handleActualizarCantidad={handleActualizarCantidad}
                        handleActualizarDescuentoItem={handleActualizarDescuentoItem}
                        handleEliminarItem={handleEliminarItem}
                    />
                ))
            )}
        </div>

        {/* Resumen de Pago */}
        <ResumenPago 
            resumenVenta={resumenVenta}
            metodoPago={metodoPago}
            montoRecibido={montoRecibido}
            descuentoGeneral={descuentoGeneral}
            setMetodoPago={setMetodoPago}
            setMontoRecibido={setMontoRecibido}
            setDescuentoGeneral={setDescuentoGeneral}
            handleRegistrarVenta={handleRegistrarVenta}
            userRole={user?.rol || 'VENDEDOR'} // Usar el rol para lógica de permiso
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 8. COMPONENTES AUXILIARES (Para mejor organización)
// ----------------------------------------------------------------------

// ... (Definiciones de ItemCarritoRow, ClienteSelector, ResumenPago y InputGroup)

// Componente para la fila del carrito
interface ItemRowProps {
    item: ItemCarrito;
    handleActualizarCantidad: (id: number, cant: string) => void;
    handleActualizarDescuentoItem: (id: number, desc: string) => void;
    handleEliminarItem: (id: number) => void;
}

const ItemCarritoRow: React.FC<ItemRowProps> = ({ item, handleActualizarCantidad, handleActualizarDescuentoItem, handleEliminarItem }) => {
    return (
        <div className="flex flex-col p-2 border-b bg-gray-50 rounded-md">
            <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-gray-800">{item.nombre}</p>
                    <p className="text-xs text-gray-500">S/ {item.precio_venta.toFixed(2)}</p>
                </div>
                <button 
                    onClick={() => handleEliminarItem(item.producto_id)} 
                    className="text-red-500 hover:text-red-700 p-1 rounded-full ml-2"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 7a1 1 0 011 1v6a1 1 0 11-2 0V8a1 1 0 011-1zm5 0a1 1 0 011 1v6a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
            
            <div className="flex justify-between items-center mt-2 space-x-2">
                <div className="w-1/3">
                    <label className="text-xs text-gray-500 block">Cantidad</label>
                    <input 
                        type="number" 
                        min="1"
                        max={item.stock_actual}
                        value={item.cantidad}
                        onChange={(e) => handleActualizarCantidad(item.producto_id, e.target.value)}
                        className="w-full text-center border rounded-md text-sm py-1"
                    />
                </div>
                <div className="w-1/3">
                    <label className="text-xs text-gray-500 block">Desc. (S/)</label>
                    <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={item.descuento_item.toFixed(2)}
                        onChange={(e) => handleActualizarDescuentoItem(item.producto_id, e.target.value)}
                        className="w-full text-center border rounded-md text-sm py-1 text-red-600"
                    />
                </div>
                <div className="w-1/3 text-right">
                    <p className="font-bold text-lg text-blue-700">S/ {item.subtotal_item.toFixed(2)}</p>
                    {item.descuento_item > 0 && <p className="text-xs text-red-500">Desc: S/ {item.descuento_item.toFixed(2)}</p>}
                </div>
            </div>
        </div>
    );
};

// Componente para la gestión de clientes
interface ClienteSelectorProps {
    clienteSeleccionado: Cliente | null;
    clientesEncontrados: Cliente[];
    setClienteSeleccionado: React.Dispatch<React.SetStateAction<Cliente | null>>;
    handleBuscarCliente: (termino: string) => void;
    handleSeleccionarCliente: (cliente: Cliente) => void;
}

const ClienteSelector: React.FC<ClienteSelectorProps> = ({ 
    clienteSeleccionado, 
    clientesEncontrados,
    setClienteSeleccionado,
    handleBuscarCliente,
    handleSeleccionarCliente
}) => (
    <div className="mb-4 relative">
        <h3 className="text-sm font-semibold mb-1">Cliente Seleccionado:</h3>
        <div className="flex justify-between items-center p-2 bg-blue-50 border border-blue-200 rounded-md">
            <span className="font-medium text-blue-800 truncate">
                {clienteSeleccionado ? clienteSeleccionado.nombre_completo : 'Público General'}
            </span>
            <button 
                onClick={() => setClienteSeleccionado({ cliente_id: 1, nombre_completo: 'Público General', documento_identidad: null })}
                className="text-blue-500 hover:text-blue-700 text-sm"
                title="Restablecer a cliente general"
            >
                (Cambiar)
            </button>
        </div>

        {clienteSeleccionado?.cliente_id === 1 && (
            <input
                type="text"
                placeholder="Buscar cliente (nombre o DNI)"
                className="w-full mt-2 p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => handleBuscarCliente(e.target.value)}
            />
        )}
        
        {clientesEncontrados.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-xl">
                {clientesEncontrados.map(c => (
                    <div 
                        key={c.cliente_id}
                        onClick={() => handleSeleccionarCliente(c)}
                        className="p-2 cursor-pointer hover:bg-gray-100 border-b text-sm"
                    >
                        {c.nombre_completo} ({c.documento_identidad || 'N/A'})
                    </div>
                ))}
            </div>
        )}
    </div>
);

// Componente para el resumen y finalización de pago
interface ResumenProps {
    resumenVenta: ResumenVenta;
    metodoPago: 'Efectivo' | 'Tarjeta';
    montoRecibido: number;
    descuentoGeneral: number;
    setMetodoPago: React.Dispatch<React.SetStateAction<'Efectivo' | 'Tarjeta'>>;
    setMontoRecibido: React.Dispatch<React.SetStateAction<number>>;
    setDescuentoGeneral: React.Dispatch<React.SetStateAction<number>>;
    handleRegistrarVenta: () => Promise<void>;
    userRole: string;
}

const ResumenPago: React.FC<ResumenProps> = ({ 
    resumenVenta, 
    metodoPago, 
    montoRecibido, 
    descuentoGeneral,
    setMetodoPago, 
    setMontoRecibido, 
    setDescuentoGeneral, 
    handleRegistrarVenta,
    userRole
}) => {
    
    const esAdmin = userRole === 'ADMIN';

    return (
        <>
            {/* Detalles Financieros */}
            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                    <span>Subtotal Bruto:</span>
                    <span>S/ {resumenVenta.subtotal.toFixed(2)}</span>
                </div>
                
                {/* Descuento General (Solo Admin puede aplicar) */}
                <div className="flex justify-between items-center text-red-600">
                    <span>Descuento Total:</span>
                    {esAdmin ? (
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={descuentoGeneral}
                            onChange={(e) => setDescuentoGeneral(parseFloat(e.target.value) || 0)}
                            placeholder="Desc. Gral."
                            className="w-24 text-right border rounded-md text-sm py-1"
                        />
                    ) : (
                        <span>S/ {resumenVenta.descuento.toFixed(2)}</span>
                    )}
                </div>

                <div className="flex justify-between text-gray-700">
                    <span>Subtotal Neto:</span>
                    <span>S/ {resumenVenta.subtotalNeto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                    <span>IGV (18%):</span>
                    <span>S/ {resumenVenta.igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-3xl font-extrabold text-blue-700 border-t pt-2">
                    <span>TOTAL:</span>
                    <span>S/ {resumenVenta.total.toFixed(2)}</span>
                </div>
            </div>

            {/* OPCIONES DE PAGO */}
            <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Método de Pago:</h3>
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => { setMetodoPago('Efectivo'); setMontoRecibido(0); }}
                        className={`flex-1 py-2 rounded-lg font-semibold border-2 transition ${metodoPago === 'Efectivo' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                        Efectivo
                    </button>
                    <button
                        onClick={() => { setMetodoPago('Tarjeta'); setMontoRecibido(resumenVenta.total); }}
                        className={`flex-1 py-2 rounded-lg font-semibold border-2 transition ${metodoPago === 'Tarjeta' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                        Tarjeta
                    </button>
                </div>

                {/* Monto Recibido y Cambio */}
                {metodoPago === 'Efectivo' && (
                    <div className="space-y-2">
                        <InputGroup label="Monto Recibido" name="monto_recibido" value={montoRecibido} 
                            onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)} 
                            type="number" step="0.01" required={true}
                        />
                        
                        <div className={`flex justify-between text-xl font-bold border-t pt-2 ${resumenVenta.cambio < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            <span>CAMBIO:</span>
                            <span>S/ {resumenVenta.cambio.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Botón Finalizar Venta */}
                <button 
                    onClick={handleRegistrarVenta}
                    disabled={resumenVenta.total === 0 || (metodoPago === 'Efectivo' && resumenVenta.cambio < 0)}
                    className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                    FINALIZAR VENTA (S/ {resumenVenta.total.toFixed(2)})
                </button>
            </div>
        </>
    );
};


// Componente para agrupar Label e Input
interface InputGroupProps {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type: string;
    required: boolean;
    step?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, name, value, onChange, type, required, step }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            step={step}
            value={value}
            onChange={onChange}
            required={required}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);