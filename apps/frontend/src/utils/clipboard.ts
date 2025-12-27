/**
 * Copy text to clipboard with fallback for older browsers and non-HTTPS contexts
 *
 * This function tries multiple methods in order:
 * 1. navigator.clipboard.writeText() - Modern API (requires HTTPS or localhost)
 * 2. document.execCommand('copy') - Fallback for older browsers and non-HTTPS
 *
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Validate input
  if (!text || typeof text !== 'string') {
    console.warn('copyToClipboard: Invalid text provided');
    return false;
  }

  // Method 1: Try modern Clipboard API (works in HTTPS and localhost)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Clipboard API failed (might be non-HTTPS or permission denied)
      // Fall through to fallback method
      console.debug('Clipboard API failed, trying fallback:', error);
    }
  }

  // Method 2: Fallback to execCommand (works in non-HTTPS contexts)
  try {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Make it invisible but still accessible to screen readers
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('aria-hidden', 'true');
    textarea.setAttribute('readonly', '');
    
    // Append to body
    document.body.appendChild(textarea);
    
    // Select and copy
    // For iOS Safari, we need to set a range
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, 999999);
    } else {
      textarea.select();
      textarea.setSelectionRange(0, 999999); // For mobile devices
    }
    
    // Execute copy command
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
    
    if (successful) {
      return true;
    } else {
      console.warn('copyToClipboard: execCommand returned false');
      return false;
    }
  } catch (error) {
    console.error('copyToClipboard: Fallback method failed:', error);
    return false;
  }
}

