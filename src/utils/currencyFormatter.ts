/**
 * Format currency to Brazilian Real (R$) format.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

/**
 * Format decimal inputs into a masked BRL currency string (e.g. 1500 -> "15,00")
 */
export function parseCurrencyInput(text: string): { rawValue: number; formattedText: string } {
  const cleanDigits = text.replace(/\D/g, '');
  if (!cleanDigits) {
    return { rawValue: 0, formattedText: 'R$ 0,00' };
  }
  const rawValue = parseInt(cleanDigits, 10) / 100;
  const formattedText = formatCurrency(rawValue);
  return { rawValue, formattedText };
}
