/**
 * Returns appropriate emoji representing the garment based on piece name string keywords.
 * Matches Flutter garment_icon_helper.dart exactly.
 */
export function getGarmentEmoji(pieceName: string): string {
  const name = (pieceName || '').toLowerCase().trim();

  if (name.includes('camisa') && !name.includes('camiseta')) {
    return '👔';
  }
  if (
    name.includes('camiseta') ||
    name.includes('t-shirt') ||
    name.includes('tshirt') ||
    name.includes('blusa') ||
    name.includes('top')
  ) {
    return '👕';
  }
  if (
    name.includes('calça') ||
    name.includes('calca') ||
    name.includes('jeans') ||
    name.includes('pantalon') ||
    name.includes('legging')
  ) {
    return '👖';
  }
  if (
    name.includes('bermuda') ||
    name.includes('short') ||
    name.includes('calção') ||
    name.includes('calcao')
  ) {
    return '🩳';
  }
  if (
    name.includes('cueca') ||
    name.includes('calcinha') ||
    name.includes('lingerie') ||
    name.includes('intima') ||
    name.includes('sutiã') ||
    name.includes('sutia')
  ) {
    return '🩲';
  }
  if (name.includes('vestido')) {
    return '👗';
  }
  if (name.includes('saia')) {
    return '👗';
  }
  if (
    name.includes('jaqueta') ||
    name.includes('casaco') ||
    name.includes('moletom') ||
    name.includes('blazer') ||
    name.includes('aghasalho')
  ) {
    return '🧥';
  }
  if (name.includes('meia')) {
    return '🧦';
  }
  if (name.includes('biquini') || name.includes('maiô') || name.includes('maio')) {
    return '👙';
  }

  // Default fallback
  return '🧵';
}
