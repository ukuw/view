(function() {
  const SERVICE_URL = 'https://www.removepaywall.com/search?url=';

  // Debug logging
  const DEBUG = false;
  const log = (...args) => DEBUG && console.log('[view]', ...args);

  log('Content script loaded on:', window.location.hostname);

  // Detect Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  log('Is Android:', isAndroid);

  // Block specific element on removepaywall.com
  if (window.location.hostname.includes('removepaywall.com')) {
    const blockElement = () => {
      try {
        const body = document.body;
        if (body) {
          const insElements = body.getElementsByTagName('ins');
          if (insElements.length >= 2) {
            const target = insElements[1];
            if (target) {
              target.style.display = 'none';
              target.remove();
              log('Blocked ins[2] element');
            }
          }
        }
      } catch (e) {}
    };

    blockElement();
    setTimeout(blockElement, 500);
    setTimeout(blockElement, 1500);
  }

  // Check if current site is in the list
  const currentHost = window.location.hostname.toLowerCase();
  log('Current host:', currentHost);

  // Preloaded list for fallback (in case storage fails)
  const PRELOADED_SITES = [
    "nytimes.com", "washingtonpost.com", "wsj.com", "bloomberg.com", "ft.com",
    "economist.com", "newyorker.com", "theatlantic.com", "wired.com",
    "zeit.de", "spiegel.de", "faz.net", "welt.de", "sueddeutsche.de",
    "medium.com", "forbes.com", "businessinsider.com",
    "theguardian.com", "telegraph.co.uk", "lemonde.fr", "lefigaro.fr"
  ];

  const isPreloadedSite = () => {
    return PRELOADED_SITES.some(site => {
      const cleanSite = site.toLowerCase().replace(/^www\./, '');
      const cleanHost = currentHost.replace(/^www\./, '');
      return cleanHost === cleanSite || cleanHost.endsWith('.' + cleanSite);
    });
  };

  const hasPaywall = () => {
    if (!document.body) return false;
    const text = document.body.innerText?.toLowerCase() || '';
    const keywords = ['paywall', 'subscription', 'subscribe', 'premium', 'unlock', 
                      'premium article', 'members only', 'continue reading'];
    return keywords.some(w => text.includes(w));
  };

  const inList = (list) => {
    if (!Array.isArray(list)) return false;
    return list.some(s => {
      const clean = s.toLowerCase().replace(/^www\./, '');
      const h = currentHost.replace(/^www\./, '');
      return h === clean || h.endsWith('.' + clean);
    });
  };

  // Create button with proper styling for mobile
  const createButton = () => {
    if (document.getElementById('view-btn')) {
      log('Button already exists');
      return;
    }

    log('Creating button...');

    const btn = document.createElement('button');
    btn.id = 'view-btn';
    btn.textContent = 'Read';

    // Android-optimized styling
    if (isAndroid) {
      btn.style.cssText = `
        position: fixed !important;
        top: 100px !important;
        right: 10px !important;
        z-index: 2147483647 !important;
        padding: 12px 18px !important;
        background: #000 !important;
        color: #fff !important;
        border: none !important;
        border-radius: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        min-width: 70px !important;
        text-align: center !important;
        -webkit-tap-highlight-color: transparent !important;
        user-select: none !important;
      `;
    } else {
      btn.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483647 !important;
        padding: 12px 20px !important;
        background: #000 !important;
        color: #fff !important;
        border: none !important;
        border-radius: 6px !important;
        font-family: sans-serif !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      `;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = SERVICE_URL + encodeURIComponent(window.location.href);
      log('Opening:', url);
      if (isAndroid) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    });

    // Ensure body exists
    if (document.body) {
      document.body.appendChild(btn);
      log('Button added to page');
    } else {
      log('Body not ready, waiting...');
      // Retry when body is ready
      const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
          document.body.appendChild(btn);
          log('Button added after wait');
          obs.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  };

  // Main check function - tries storage first, falls back to preloaded list
  const checkAndShowButton = () => {
    log('Checking to show button...');

    // Don't show on removepaywall.com
    if (currentHost.includes('removepaywall.com')) {
      log('On removepaywall.com, skipping');
      return;
    }

    // Try to use extension storage
    try {
      const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

      storage.local.get(['showButton', 'buttonSites', 'autoDetect'], (r) => {
        log('Storage result:', r);

        if (r.showButton === false) {
          log('Button disabled in settings');
          return;
        }

        const userSites = r.buttonSites || [];
        const autoDetect = r.autoDetect !== false;

        log('User sites count:', userSites.length);
        log('Auto detect:', autoDetect);
        log('Has paywall:', hasPaywall());
        log('In preloaded:', isPreloadedSite());

        // Check if should show button
        let shouldShow = false;

        if (inList(userSites)) {
          log('Site in user list');
          shouldShow = true;
        } else if (isPreloadedSite()) {
          log('Site in preloaded list');
          shouldShow = true;
        } else if (autoDetect && hasPaywall()) {
          log('Paywall detected');
          shouldShow = true;
        }

        if (shouldShow) {
          log('Showing button');
          createButton();
        } else {
          log('Not showing button');
        }
      });
    } catch (e) {
      log('Storage error, using fallback:', e);
      // Fallback: check preloaded list only
      if (isPreloadedSite() || hasPaywall()) {
        createButton();
      }
    }
  };

  // Run check when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowButton);
  } else {
    checkAndShowButton();
  }

  // Also check after a delay (for SPAs)
  setTimeout(checkAndShowButton, 2000);

  // Listen for messages from popup
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
      log('Received message:', request);
      if (request.action === 'openCurrentWithoutPaywall') {
        const url = SERVICE_URL + encodeURIComponent(window.location.href);
        if (isAndroid) {
          window.location.href = url;
        } else {
          window.open(url, '_blank');
        }
        sendResponse({ success: true });
      }
      return true;
    });
  }

  log('Init complete');
})();
