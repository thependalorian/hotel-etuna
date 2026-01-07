/**
 * Formatter Utilities
 * 
 * Location: utils/formatters.ts
 * Purpose: Centralized formatting functions for currency, dates, and other data
 * 
 * Usage: Import and use across the app for consistent formatting
 */

/**
 * Format currency amount
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: 'N$')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'N$', decimals: number = 0): string {
  return `${currency}${amount.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`;
}

/**
 * Format date in "DD MMM YYYY" format (e.g., "01 Oct 2023")
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date and time
 * @param date - Date object to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - Date object to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  return formatDate(date);
}
