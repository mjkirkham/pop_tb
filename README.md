# Pop TB - Trial Balance Populator

Fully populate an Initial or Comparative Trial Balance in Final Accounts Online with random test data.

## Features

- **Posting Types** - Choose credits only, debits only, or both
- **Brought Forward Accounts** - Option to include or exclude BF accounts
- **Value Range** - Set minimum and maximum values for generated amounts
- **Density Control** - Fill all rows or just a percentage
- **Dark Mode** - Automatic system preference detection with manual toggle
- **Preferences** - Settings are saved between sessions

## Development Setup

### Prerequisites

- Node.js and npm installed
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pop_tb
```

2. Install dependencies:
```bash
npm install
```

### Building

The extension uses a unified codebase that builds for both Chrome and Firefox:

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build for both browsers
npm run build:all

# Clean build directory
npm run clean
```

Built extensions will be in:
- `dist/chrome/` - Chrome extension
- `dist/firefox/` - Firefox extension

### Development Workflow

```bash
# Watch mode for Chrome (auto-rebuild on changes)
npm run watch:chrome

# Watch mode for Firefox
npm run watch:firefox

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Installation (For Testing)

After building the extensions:

### Chrome

1. Browse to [chrome://extensions](chrome://extensions/)
2. Enable `Developer mode` in the upper-right corner
3. Click `Load unpacked` and browse to the `dist/chrome` directory
4. The extension icon will appear in your toolbar

### Firefox

1. Browse to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
2. Click `Load Temporary Add-on...`
3. Navigate to the `dist/firefox` directory and select `manifest.json`

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

## Project Structure

```
pop_tb/
├── src/                      # Source code (single codebase)
│   ├── lib/                  # Shared library modules
│   │   ├── browserAPI.js     # Browser API abstraction
│   │   ├── constants.js      # Configuration constants
│   │   ├── storage.js        # Storage management
│   │   ├── theme.js          # Theme management
│   │   ├── validator.js      # Input validation
│   │   ├── utils.js          # Utility functions
│   │   └── contentScriptInjector.js
│   ├── ui/                   # Popup interface
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── content/              # Content scripts
│   │   └── content.js
│   ├── background/           # Background scripts
│   │   └── background.js
│   └── manifests/            # Browser-specific manifests
│       ├── manifest.chrome.json
│       └── manifest.firefox.json
├── dist/                     # Built extensions (generated)
│   ├── chrome/
│   └── firefox/
├── chrome/                   # Legacy Chrome version (deprecated)
├── firefox/                  # Legacy Firefox version (deprecated)
├── webpack.config.js         # Build configuration
├── build.sh                  # Build script
└── package.json              # Dependencies and scripts
```

## Architecture

The extension now uses a **modular architecture** with:

- **Browser API Abstraction** - Single API that works with both Chrome and Firefox
- **Separated Concerns** - Each module has a single responsibility
- **No Code Duplication** - One codebase for both browsers
- **ES6 Modules** - Modern import/export system
- **Webpack Build** - Automated bundling and minification
- **Security Hardened** - XSS-safe DOM manipulation, input validation

## Browser Compatibility

- **Chrome**: Manifest V3, Chrome 88+
- **Firefox**: Manifest V3, Firefox 109+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the `src/` directory
4. Run `npm run lint` and `npm run format`
5. Build and test both browsers: `npm run build:all`
6. Submit a pull request

## Security

- All user inputs are validated
- DOM manipulation is XSS-safe
- Content scripts are dynamically injected (not on all pages)
- CSP headers enforced

## License

See LICENSE file for details.

## Authors

Charlie Billen, Mark Kirkham
