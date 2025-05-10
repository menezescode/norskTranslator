// contentScript.js
console.log('[Quick-Translate] 📄 contentScript injected');

(function () {
  // Create floating popup
  const popup = document.createElement('div');
  Object.assign(popup.style, {
    position: 'fixed',
    zIndex: 2147483647,
    maxWidth: '320px',
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    padding: '8px',
    fontSize: '14px',
    lineHeight: '1.4',
    display: 'none'
  });
  document.body.appendChild(popup);

  // Default keys
  const DEFAULT_TRIGGER_KEY = 'middle-click';
  const DEFAULT_CLOSE_KEY = 'middle-click';
  
  // Custom key settings
  let triggerKey = DEFAULT_TRIGGER_KEY;
  let closeKey = DEFAULT_CLOSE_KEY;

  // Load custom key settings
  chrome.storage.sync.get(['triggerKey', 'closeKey'], function(result) {
    if (result.triggerKey) triggerKey = result.triggerKey;
    if (result.closeKey) closeKey = result.closeKey;
    console.log('[Quick-Translate] ⌨️ Loaded custom keys:', { triggerKey, closeKey });
  });

  let active = false;
  let lastSel = '';

  function showAt(x, y) {
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    popup.style.display = 'block';
    active = true;
  }

  function hide() {
    popup.style.display = 'none';
    active = false;
    lastSel = '';
  }

  /**
   * Check if the event matches a key combination
   * @param {MouseEvent|KeyboardEvent} event - The event to check
   * @param {string} keyCombo - The key combination to match against
   * @returns {boolean} - Whether the event matches the key combination
   */
  function matchesKeyCombo(event, keyCombo) {
    // Handle mouse buttons
    if (keyCombo === 'middle-click' && event.type === 'mousedown' && event.button === 1) {
      return true;
    }
    if (keyCombo === 'left-click' && event.type === 'mousedown' && event.button === 0) {
      return true;
    }
    if (keyCombo === 'right-click' && event.type === 'mousedown' && event.button === 2) {
      return true;
    }
    
    // Handle keyboard combinations
    if (event.type === 'keydown') {
      const parts = keyCombo.split('+');
      const keyPart = parts.filter(p => !['ctrl', 'alt', 'shift', 'meta'].includes(p));
      const modifiers = parts.filter(p => ['ctrl', 'alt', 'shift', 'meta'].includes(p));
      
      // Check if the key matches
      if (keyPart.length === 1) {
        const key = keyPart[0].toLowerCase();
        const eventKey = event.key.toLowerCase();
        
        if (key === 'space' && eventKey === ' ') {
          // Special handling for space
        } else if (key !== eventKey) {
          return false;
        }
      }
      
      // Check if all required modifiers are pressed
      if (modifiers.includes('ctrl') && !event.ctrlKey) return false;
      if (modifiers.includes('alt') && !event.altKey) return false;
      if (modifiers.includes('shift') && !event.shiftKey) return false;
      if (modifiers.includes('meta') && !event.metaKey) return false;
      
      // Check that no extra modifiers are pressed
      if (!modifiers.includes('ctrl') && event.ctrlKey) return false;
      if (!modifiers.includes('alt') && event.altKey) return false;
      if (!modifiers.includes('shift') && event.shiftKey) return false;
      if (!modifiers.includes('meta') && event.metaKey) return false;
      
      return true;
    }
    
    return false;
  }

  /**
   * Translate text using Google's official Cloud Translation API
   * @param {string} text - Text to translate
   * @param {string} apiKey - Google Cloud API key
   * @returns {Promise<string>} - Translated text
   */
  async function translateWithGoogleApi(text, apiKey) {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: 'no',
          target: 'en',
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Quick-Translate] ✅ Used official Google Translate API');
      
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        return data.data.translations[0].translatedText;
      } else {
        throw new Error('No translation returned from Google API');
      }
    } catch (error) {
      console.error('[Quick-Translate] 🚨 Google API error:', error);
      throw error;
    }
  }

  /**
   * Translate text using free Google Translate API
   * @param {string} text - Text to translate
   * @returns {Promise<string>} - Translated text
   */
  async function translateWithFreeApi(text) {
    try {
      // Use the more comprehensive free API endpoint
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=no&tl=en&dt=t&dt=bd&dt=rm&dj=1&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Free API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Quick-Translate] ℹ️ Using free Google Translate API (fallback)');
      
      // Process the response based on its structure
      if (data.sentences && data.sentences.length > 0) {
        return data.sentences.map(s => s.trans).join(' ');
      } else {
        throw new Error('Unexpected free API response format');
      }
    } catch (error) {
      console.error('[Quick-Translate] 🚨 Free API error:', error);
      throw error;
    }
  }

  // Process selected text and show translation
  async function processSelection(x, y) {
    const sel = window.getSelection().toString().trim();
    if (!sel) return;

    // Avoid flicker on same selection
    if (sel === lastSel && active) return;
    lastSel = sel;

    showAt(x, y);
    popup.textContent = 'Translating…';

    try {
      // Get the API key from storage
      chrome.storage.sync.get(['googleApiKey'], async function(result) {
        try {
          let translatedText;
          
          // Use the official Google API if an API key is provided
          if (result.googleApiKey) {
            try {
              translatedText = await translateWithGoogleApi(sel, result.googleApiKey);
            } catch (googleApiError) {
              console.warn('[Quick-Translate] ⚠️ Google API failed, falling back to free API');
              translatedText = await translateWithFreeApi(sel);
            }
          } else {
            console.log('[Quick-Translate] ℹ️ No API key found, using free API');
            translatedText = await translateWithFreeApi(sel);
          }
          
          popup.textContent = translatedText || 'No translation available';
        } catch (error) {
          console.error('[Quick-Translate] 💥 Translation error:', error);
          popup.textContent = 'Error translating. Try again or check options.';
        }
      });
    } catch (err) {
      console.error('[Quick-Translate] 🚨 Unexpected error:', err);
      popup.textContent = 'Error translating';
    }
  }

  // Handle mouse events for triggers and close actions
  document.addEventListener('mousedown', (e) => {
    // Check if this is a trigger action
    if (!active && matchesKeyCombo(e, triggerKey)) {
      e.preventDefault(); // Prevent default behavior (e.g., auto-scroll for middle-click)
      e.stopPropagation();
      processSelection(e.clientX + 10, e.clientY + 10);
      return;
    }
    
    // Check if this is a close action
    if (active && matchesKeyCombo(e, closeKey)) {
      e.preventDefault();
      e.stopPropagation();
      hide();
      return;
    }
  }, true);

  // Handle keyboard events for triggers and close actions
  document.addEventListener('keydown', (e) => {
    // Always close on Escape key
    if (active && e.key === 'Escape') {
      hide();
      e.preventDefault();
      return;
    }
    
    // Check if this is a trigger action via keyboard
    if (!active && matchesKeyCombo(e, triggerKey)) {
      const sel = window.getSelection();
      if (sel.toString().trim()) {
        e.preventDefault();
        
        // Get the position of the selection
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        processSelection(rect.right, rect.bottom);
      }
      return;
    }
    
    // Check if this is a close action via keyboard
    if (active && matchesKeyCombo(e, closeKey)) {
      e.preventDefault();
      hide();
      return;
    }
  }, true);

  // Handle context menu for right-click triggers
  document.addEventListener('contextmenu', (e) => {
    // If right-click is the trigger, prevent context menu
    if (triggerKey === 'right-click') {
      const sel = window.getSelection().toString().trim();
      if (sel) {
        e.preventDefault();
      }
    }
  }, true);

  // Listen for changes to the key settings
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.triggerKey) {
      triggerKey = changes.triggerKey.newValue;
      console.log('[Quick-Translate] ⌨️ Trigger key updated:', triggerKey);
    }
    if (changes.closeKey) {
      closeKey = changes.closeKey.newValue;
      console.log('[Quick-Translate] ⌨️ Close key updated:', closeKey);
    }
  });
})();