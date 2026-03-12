document.addEventListener('DOMContentLoaded', function() {
  const openBtn = document.getElementById('open-current');
  const addSiteBtn = document.getElementById('add-site');
  const urlBox = document.getElementById('current-url');
  const tabToggle = document.getElementById('tab-toggle');
  const btnToggle = document.getElementById('btn-toggle');
  const autoToggle = document.getElementById('auto-toggle');
  const siteInput = document.getElementById('site-input');
  const addInputBtn = document.getElementById('add-input');
  const siteList = document.getElementById('site-list');

  const isAndroid = /Android/i.test(navigator.userAgent);
  const SERVICE_URL = 'https://www.removepaywall.com/search?url=';

  let currentTabId = null;
  let currentUrl = '';
  let currentHostname = '';
  let sites = [];

  console.log('[view popup] Loaded, Android:', isAndroid);

  // Get current tab info
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    console.log('[view popup] Got tabs:', tabs);

    if (tabs && tabs[0]) {
      currentTabId = tabs[0].id;
      currentUrl = tabs[0].url;

      try {
        currentHostname = new URL(currentUrl).hostname;
        urlBox.textContent = currentUrl;
        console.log('[view popup] Current URL:', currentUrl);

        // Check for restricted URLs
        if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('file://') || 
            currentUrl.startsWith('about:') || currentUrl.startsWith('moz-extension://')) {
          openBtn.disabled = true;
          openBtn.textContent = 'Cannot read this page';
          addSiteBtn.style.display = 'none';
        }
      } catch (e) {
        console.error('[view popup] URL error:', e);
      }
    }
  });

  // Load settings
  chrome.storage.local.get(['openInNewTab', 'showButton', 'autoDetect', 'buttonSites'], function(result) {
    console.log('[view popup] Storage:', result);

    if (chrome.runtime.lastError) {
      console.error('[view popup] Storage error:', chrome.runtime.lastError);
    }

    tabToggle.checked = result.openInNewTab !== undefined ? result.openInNewTab : !isAndroid;
    btnToggle.checked = result.showButton !== false;
    autoToggle.checked = result.autoDetect !== false;
    sites = result.buttonSites || [];

    renderSites();
  });

  function renderSites() {
    if (sites.length === 0) {
      siteList.innerHTML = '<div class="empty">174 sites pre-loaded</div>';
      return;
    }

    siteList.innerHTML = '';
    sites.slice(0, 15).forEach(site => {
      const isCurrent = site === currentHostname || 
        site.replace(/^www\./, '') === currentHostname.replace(/^www\./, '');

      const item = document.createElement('div');
      item.className = 'site-item';
      item.innerHTML = '<span>' + site + (isCurrent ? ' <b>(current)</b>' : '') + '</span>' +
        '<button class="remove-btn" data-site="' + site + '">Remove</button>';
      siteList.appendChild(item);
    });

    siteList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        removeSite(this.getAttribute('data-site'));
      });
    });
  }

  function addSite(site) {
    let clean = site.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0];

    if (!clean || clean.includes(' ') || !clean.includes('.')) {
      alert('Enter valid domain: nytimes.com');
      return;
    }

    if (sites.includes(clean)) {
      alert('Already in list');
      return;
    }

    sites.push(clean);
    chrome.storage.local.set({ buttonSites: sites }, function() {
      renderSites();
      siteInput.value = '';

      // Reload to show button
      if (currentTabId) chrome.tabs.reload(currentTabId);
    });
  }

  function removeSite(site) {
    sites = sites.filter(s => s !== site);
    chrome.storage.local.set({ buttonSites: sites }, renderSites);
  }

  // THE FIX: Directly open URL instead of messaging background
  openBtn.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('[view popup] Button clicked, URL:', currentUrl);

    if (!currentUrl || currentUrl.startsWith('chrome://') || 
        currentUrl.startsWith('about:') || currentUrl.startsWith('moz-extension://')) {
      console.log('[view popup] Cannot open restricted URL');
      return;
    }

    const serviceUrl = SERVICE_URL + encodeURIComponent(currentUrl);
    console.log('[view popup] Opening service URL:', serviceUrl);

    // Get setting for new tab vs current
    chrome.storage.local.get(['openInNewTab'], function(result) {
      const openNew = result.openInNewTab !== undefined ? result.openInNewTab : !isAndroid;

      console.log('[view popup] Open in new tab:', openNew);

      if (openNew && !isAndroid) {
        // Open in new tab (desktop)
        chrome.tabs.create({ url: serviceUrl }, function(tab) {
          console.log('[view popup] Created new tab:', tab);
        });
      } else {
        // Update current tab (Android default)
        if (currentTabId) {
          chrome.tabs.update(currentTabId, { url: serviceUrl }, function(tab) {
            console.log('[view popup] Updated tab:', tab);
          });
        }
      }

      // Close popup
      window.close();
    });
  });

  addSiteBtn.addEventListener('click', function() {
    if (currentHostname) {
      addSite(currentHostname);
      addSiteBtn.textContent = 'Added';
      setTimeout(() => addSiteBtn.textContent = 'Add this site', 1000);
    }
  });

  addInputBtn.addEventListener('click', function() {
    if (siteInput.value.trim()) addSite(siteInput.value);
  });

  siteInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && siteInput.value.trim()) {
      addSite(siteInput.value);
    }
  });

  // Toggle settings
  tabToggle.addEventListener('change', function() {
    chrome.storage.local.set({ openInNewTab: tabToggle.checked });
  });

  btnToggle.addEventListener('change', function() {
    chrome.storage.local.set({ showButton: btnToggle.checked });
  });

  autoToggle.addEventListener('change', function() {
    chrome.storage.local.set({ autoDetect: autoToggle.checked });
  });
});
