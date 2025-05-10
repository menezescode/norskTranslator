// options.js
document.addEventListener('DOMContentLoaded', function() {
  const DEFAULT_TRIGGER_KEY = 'middle-click';
  const DEFAULT_CLOSE_KEY = 'middle-click';
  
  const triggerKeyDisplay = document.getElementById('trigger-key-display');
  const closeKeyDisplay = document.getElementById('close-key-display');
  const modifyTriggerBtn = document.getElementById('modify-trigger-key');
  const modifyCloseBtn = document.getElementById('modify-close-key');
  const resetTriggerBtn = document.getElementById('reset-trigger-key');
  const resetCloseBtn = document.getElementById('reset-close-key');
  const saveBtn = document.getElementById('save');
  const statusEl = document.getElementById('status');
  
  let isListeningForTrigger = false;
  let isListeningForClose = false;
  let currentTriggerKey = DEFAULT_TRIGGER_KEY;
  let currentCloseKey = DEFAULT_CLOSE_KEY;

  // Load saved settings
  chrome.storage.sync.get(['googleApiKey', 'triggerKey', 'closeKey'], function(result) {
    if (result.googleApiKey) {
      document.getElementById('api-key').value = result.googleApiKey;
    }
    
    if (result.triggerKey) {
      currentTriggerKey = result.triggerKey;
      triggerKeyDisplay.textContent = formatKeyDisplay(result.triggerKey);
    }
    
    if (result.closeKey) {
      currentCloseKey = result.closeKey;
      closeKeyDisplay.textContent = formatKeyDisplay(result.closeKey);
    }
  });

  // Format key or combination for display
  function formatKeyDisplay(keyCombo) {
    if (keyCombo === 'middle-click') return 'middle-click';
    
    const parts = keyCombo.split('+');
    return parts.map(part => {
      // Capitalize first letter of each part
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' + ');
  }

  // Show status message
  function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = `status ${isError ? 'error' : 'success'}`;
    statusEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(function() {
      statusEl.style.display = 'none';
    }, 3000);
  }

  // Capture key input handler
  function captureKeyInput(event) {
    event.preventDefault();
    event.stopPropagation();
    
    let keyCombo = '';
    
    // Handle mouse clicks
    if (event.type === 'mousedown') {
      switch (event.button) {
        case 0:
          keyCombo = 'left-click';
          break;
        case 1:
          keyCombo = 'middle-click';
          break;
        case 2:
          keyCombo = 'right-click';
          break;
        default:
          return; // Ignore other mouse buttons
      }
    } 
    // Handle keyboard events
    else if (event.type === 'keydown') {
      // Ignore standalone modifier keys
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        return;
      }
      
      const modifiers = [];
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('alt');
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('meta');
      
      let keyName = event.key;
      
      // Special handling for some keys
      if (keyName === ' ') keyName = 'Space';
      if (keyName === 'Escape') {
        showStatus('Escape key is reserved as a global close key and cannot be assigned', true);
        return;
      }
      
      keyCombo = [...modifiers, keyName.toLowerCase()].join('+');
    }
    
    if (!keyCombo) return;
    
    // Update the appropriate display and variable
    if (isListeningForTrigger) {
      currentTriggerKey = keyCombo;
      triggerKeyDisplay.textContent = formatKeyDisplay(keyCombo);
      isListeningForTrigger = false;
      triggerKeyDisplay.classList.remove('listening');
    } else if (isListeningForClose) {
      currentCloseKey = keyCombo;
      closeKeyDisplay.textContent = formatKeyDisplay(keyCombo);
      isListeningForClose = false;
      closeKeyDisplay.classList.remove('listening');
    }
    
    // Stop listening
    document.removeEventListener('keydown', captureKeyInput);
    document.removeEventListener('mousedown', captureKeyInput);
  }

  // Start listening for trigger key changes
  modifyTriggerBtn.addEventListener('click', function() {
    if (isListeningForClose) {
      isListeningForClose = false;
      closeKeyDisplay.classList.remove('listening');
    }
    
    isListeningForTrigger = !isListeningForTrigger;
    
    if (isListeningForTrigger) {
      triggerKeyDisplay.classList.add('listening');
      triggerKeyDisplay.textContent = 'Press any key or click...';
      document.addEventListener('keydown', captureKeyInput);
      document.addEventListener('mousedown', captureKeyInput);
      showStatus('Listening for key input... Press any key or mouse button');
    } else {
      triggerKeyDisplay.classList.remove('listening');
      document.removeEventListener('keydown', captureKeyInput);
      document.removeEventListener('mousedown', captureKeyInput);
    }
  });

  // Start listening for close key changes
  modifyCloseBtn.addEventListener('click', function() {
    if (isListeningForTrigger) {
      isListeningForTrigger = false;
      triggerKeyDisplay.classList.remove('listening');
    }
    
    isListeningForClose = !isListeningForClose;
    
    if (isListeningForClose) {
      closeKeyDisplay.classList.add('listening');
      closeKeyDisplay.textContent = 'Press any key or click...';
      document.addEventListener('keydown', captureKeyInput);
      document.addEventListener('mousedown', captureKeyInput);
      showStatus('Listening for key input... Press any key or mouse button');
    } else {
      closeKeyDisplay.classList.remove('listening');
      document.removeEventListener('keydown', captureKeyInput);
      document.removeEventListener('mousedown', captureKeyInput);
    }
  });

  // Reset trigger key to default
  resetTriggerBtn.addEventListener('click', function() {
    currentTriggerKey = DEFAULT_TRIGGER_KEY;
    triggerKeyDisplay.textContent = formatKeyDisplay(DEFAULT_TRIGGER_KEY);
    
    // Stop listening if active
    if (isListeningForTrigger) {
      isListeningForTrigger = false;
      triggerKeyDisplay.classList.remove('listening');
      document.removeEventListener('keydown', captureKeyInput);
      document.removeEventListener('mousedown', captureKeyInput);
    }
  });

  // Reset close key to default
  resetCloseBtn.addEventListener('click', function() {
    currentCloseKey = DEFAULT_CLOSE_KEY;
    closeKeyDisplay.textContent = formatKeyDisplay(DEFAULT_CLOSE_KEY);
    
    // Stop listening if active
    if (isListeningForClose) {
      isListeningForClose = false;
      closeKeyDisplay.classList.remove('listening');
      document.removeEventListener('keydown', captureKeyInput);
      document.removeEventListener('mousedown', captureKeyInput);
    }
  });

  // Save all settings
  saveBtn.addEventListener('click', function() {
    const apiKey = document.getElementById('api-key').value.trim();
    
    // Save to storage
    chrome.storage.sync.set({
      googleApiKey: apiKey,
      triggerKey: currentTriggerKey,
      closeKey: currentCloseKey
    }, function() {
      // Show success message
      showStatus('Settings saved!');
    });
  });
});