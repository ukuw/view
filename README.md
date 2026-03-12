 Firefox Extension
https://addons.mozilla.org/de/firefox/addon/viewfirefox/

# Paywall Remover v2.0 - Service Mode

A Firefox extension that opens paywalled articles via removepaywall.com service.
This approach does NOT modify websites - it simply opens them through an external service.

## How It Works

Instead of trying to manipulate website code (which causes breakage), this extension:
1. Opens paywalled URLs through `https://www.removepaywall.com/search?url=`
2. The external service fetches the article content and displays it
3. No webpage modification happens on your browser

## Features

### Multiple Ways to Use
1. **Extension Popup** - Click the extension icon, then "Open Without Paywall"
2. **Floating Button** - Appears on pages detected as potentially paywalled
3. **Right-click Link** - Right-click any link → "Open without paywall"
4. **Right-click Page** - Right-click anywhere on page → "Open this page without paywall"

### Options
- **Open in new tab** - Toggle whether links open in new tab or current tab
- **Show floating button** - Toggle the floating button on detected paywall pages

## Installation

1. Download and extract this folder
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle top-right)
4. Click **Load unpacked**
5. Select the `paywall_remover_extension` folder

## Advantages Over DOM Manipulation

✅ **No site breakage** - Doesn't modify any website code  
✅ **Works on all sites** - Not dependent on specific paywall implementations  
✅ **Always up-to-date** - The external service handles paywall bypassing  
✅ **Safe for banking/shopping** - No accidental interference with important sites  
✅ **Simple and reliable** - No complex detection logic needed  

## How removepaywall.com Works

The service uses various techniques to fetch paywalled content:
- Reader mode extraction
- Archive services (archive.today, outline.com)
- Textise dot iitty
- And other legitimate methods

## Privacy Note

When you use this extension, the URL you want to view is sent to removepaywall.com. 
No other data is transmitted. The external service fetches the content and displays it.

## License

MIT - For educational use only.
