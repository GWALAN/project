import React, { useEffect } from 'react';

export function DismissSupabasePopup() {
  useEffect(() => {
    // Function to find and click the dismiss button
    const dismissPopup = () => {
      // Find all buttons
      const buttons = document.querySelectorAll('button');
      
      // Loop through buttons to find the one with "Discard" text
      for (const button of buttons) {
        if (button.textContent?.includes('Discard')) {
          button.click();
          break;
        }
      }
    };

    // Try to dismiss immediately and then every second for 5 seconds
    dismissPopup();
    const interval = setInterval(dismissPopup, 1000);
    
    // Clean up after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}