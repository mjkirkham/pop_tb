# Pop TB - Trial Balance Populator

Fully populate an Initial or Comparative Trial Balance in Final Accounts Online with random test data.

## Features

- **Posting Types** - Choose credits only, debits only, or both
- **Brought Forward Accounts** - Option to include or exclude BF accounts
- **Value Range** - Set minimum and maximum values for generated amounts
- **Density Control** - Fill all rows or just a percentage
- **Dark Mode** - Automatic system preference detection with manual toggle
- **Preferences** - Settings are saved between sessions

## Installation

Clone the repository or download and extract the zip.

### Chrome

1. Browse to [chrome://extensions](chrome://extensions/)
2. Enable `Developer mode` in the upper-right corner
3. Click `Load unpacked` and browse to the `chrome` directory
4. The extension icon will appear in your toolbar

### Firefox

1. Browse to [about:debugging](about:debugging)
2. Click `This Firefox` in the left sidebar
3. Click `Load Temporary Add-on...`
4. Navigate to the `firefox` directory and select `manifest.json`

> **Note:** Temporary add-ons are removed when Firefox is closed. For permanent installation, the extension needs to be signed by Mozilla or installed in Firefox Developer Edition / Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.

## Usage

1. Navigate to an Initial or Comparative Trial Balance page in Final Accounts Online
2. Click the Pop TB icon in your browser toolbar
3. Configure your settings:
   - Select posting type (credits, debits, or both)
   - Toggle brought forward accounts
   - Set value range
   - Adjust density percentage
4. Click **Populate Trial Balance** to fill the form
5. Use **Clear Trial Balance** to reset all values

## Compatibility

- **Chrome**: Manifest V3
- **Firefox**: Manifest V3 (requires Firefox 109+)
