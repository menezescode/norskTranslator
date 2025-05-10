# Norwegian to English Quick Translate

A Chrome extension that lets you instantly translate selected Norwegian text to English by middle-clicking (or using a custom key/mouse shortcut) on any webpage.

---

## Features

- **Instant Translation:** Select Norwegian text and trigger translation with a single click or key.
- **Customizable Shortcuts:** Choose your own key or mouse button to trigger translation and close the popup.
- **Popup Translation:** See the translation in a floating popup right on the page.
- **Google Translate Support:** Use your own Google Cloud Translation API key for official translations, or use the free API fallback.
- **No Context Menu Needed:** Works directly on any webpage without extra steps.

---

## Installation

1. **Download or Clone the Repository**

   Download this repository as a ZIP and extract it, or clone it using:
   ```sh
   git clone https://github.com/menezescode/norskTranslator.git
   ```

2. **Open Chrome Extensions Page**

   - Go to `chrome://extensions/` in your Chrome browser.
   - Enable **Developer mode** (toggle in the top right).

3. **Load the Extension**

   - Click **"Load unpacked"**.
   - Select the `main` folder inside the project directory.

---

## Usage

1. **Select Text**

   - Highlight any Norwegian text on a webpage.

2. **Trigger Translation**

   - By default, **middle-click** (mouse wheel button) on the selected text.
   - Or, use your custom shortcut if you have set one (see below).

3. **View Translation**

   - A popup will appear near your cursor with the English translation.
   - To close the popup, middle-click again or use your configured close key. Pressing `Escape` will always close the popup.

---

## Options & Customization

1. **Open Extension Options**

   - Right-click the extension icon and choose **"Options"**.
   - Or, go to `chrome://extensions/`, find "Norwegian to English Quick Translate", and click **"Details" > "Extension options"**.

2. **Set Google API Key (Optional)**

   - For more reliable and official translations, enter your [Google Cloud Translation API key](https://cloud.google.com/translate/docs/setup).
   - If left blank, the extension will use the free Google Translate API (may be less reliable).

3. **Change Trigger/Close Keys**

   - Click **"Change"** next to "Translation Trigger Key" or "Close Popup Key".
   - Press any key or mouse button to set your preferred shortcut.
   - Click **"Reset to Default"** to revert to the default (middle-click).

4. **Save Settings**

   - Click **"Save Settings"** to apply your changes.

---

## Supported Browsers

- **Google Chrome** (recommended)
- Chromium-based browsers (e.g., Edge, Brave) may also work.

---

## Troubleshooting

- **Nothing happens on middle-click:** Make sure you have selected some text and that the extension is enabled.
- **Translation fails:** If you see an error, try setting a Google API key in the options.
- **Shortcuts not working:** Check your shortcut settings in the options page.

---

## Development

- All source code is in the [`main`](main/) folder.
- Main files:
  - [`contentScript.js`](main/contentScript.js): Handles translation and popup logic.
  - [`options.html`](main/options.html) & [`options.js`](main/options.js): Options page UI and logic.
  - [`manifest.json`](main/manifest.json): Extension manifest.

---

## License

MIT License

---

## Author

[github.com/menezescode](https://github.com/menezescode)

