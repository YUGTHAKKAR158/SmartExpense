// ═══════════════════════════════════════════════
// src/utils/formatters.js
// Formatting helpers used across the entire app
// ═══════════════════════════════════════════════

// Format a number as Indian Rupees
// 1234.5 → ₹1,234.50
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format a date string to readable format
// "2024-01-15T00:00:00Z" → "15 Jan 2024"
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format date for input[type="date"] value
// "2024-01-15T00:00:00Z" → "2024-01-15"
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format for date inputs
export const getTodayForInput = () => {
  return new Date().toISOString().split('T')[0];
};

// Truncate long text with ellipsis
// "This is a very long description" → "This is a very..."
export const truncate = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};