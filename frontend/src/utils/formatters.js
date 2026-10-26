/**
 * SpecsUp - Formatting Utilities
 */

export function formatPrice(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function formatDiopter(val) {
  if (val === undefined || val === null) return '0.00 D';
  const num = Number(val);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)} D`;
}

export function formatAxis(val) {
  if (val === undefined || val === null) return '0°';
  return `${val}°`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
