/**
 * Genera código de barras EAN-13
 * Formato: 3 dígitos país + 4 dígitos empresa + 5 dígitos producto + 1 dígito verificador
 */
export function generateEAN13(): string {
  // Prefijo de país (ejemplo: 750 para Perú, 779 para Argentina, etc.)
  const countryCode = '750';
  
  // Código de empresa (4 dígitos aleatorios)
  const companyCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Código de producto (5 dígitos aleatorios)
  const productCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  // Combinar sin el dígito verificador
  const baseCode = countryCode + companyCode + productCode;
  
  // Calcular dígito verificador
  const checkDigit = calculateEAN13CheckDigit(baseCode);
  
  return baseCode + checkDigit;
}

/**
 * Calcula el dígito verificador de EAN-13
 */
function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    // Multiplicar por 1 o 3 alternativamente
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  // El dígito verificador es el número que sumado al resultado da múltiplo de 10
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit.toString();
}

/**
 * Valida un código EAN-13
 */
export function validateEAN13(code: string): boolean {
  if (code.length !== 13) return false;
  
  const baseCode = code.substring(0, 12);
  const checkDigit = code[12];
  
  return calculateEAN13CheckDigit(baseCode) === checkDigit;
}

/**
 * Genera código de barras simple (solo números)
 */
export function generateSimpleBarcode(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}