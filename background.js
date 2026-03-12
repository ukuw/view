const SERVICE_URL = 'https://www.removepaywall.com/search?url=';

const DEFAULT_SITES = [
  "nytimes.com", "washingtonpost.com", "wsj.com", "bloomberg.com", "ft.com",
  "economist.com", "newyorker.com", "theatlantic.com", "technologyreview.com",
  "wired.com", "vanityfair.com", "vogue.com", "gq.com", "bonappetit.com",
  "architecturaldigest.com", "condenast.com", "forbes.com", "fortune.com",
  "fastcompany.com", "inc.com", "businessinsider.com",
  "zeit.de", "spiegel.de", "faz.net", "welt.de", "sueddeutsche.de",
  "handelsblatt.com", "manager-magazin.de", "wiwo.de", "tagesspiegel.de",
  "fr.de", "rp-online.de", "nw.de", "abendblatt.de", "mopo.de",
  "berliner-zeitung.de", "taz.de", "jungle.world", "cicero.de",
  "focus.de", "stern.de", "bild.de", "n-tv.de", "rtl.de",
  "kicker.de", "transfermarkt.de",
  "thetimes.co.uk", "theguardian.com", "telegraph.co.uk", "independent.co.uk",
  "thesun.co.uk", "dailymail.co.uk", "express.co.uk",
  "lemonde.fr", "lefigaro.fr", "liberation.fr", "latribune.fr",
  "les-echos.fr", "mediapart.fr",
  "elpais.com", "elmundo.es", "lavanguardia.com", "corriere.it",
  "repubblica.it", "lastampa.it", "nrc.nl", "volkskrant.nl",
  "telegraaf.nl", "dn.se", "svd.se", "politiken.dk", "berlingske.dk",
  "medium.com", "substack.com", "techcrunch.com", "theverge.com",
  "engadget.com", "arstechnica.com", "zdnet.com", "cnet.com",
  "pcmag.com", "tomshardware.com", "anandtech.com", "macrumors.com",
  "9to5mac.com", "9to5google.com", "androidcentral.com", "imore.com",
  "windowscentral.com", "xda-developers.com", "androidpolice.com",
  "neowin.net", "slashdot.org", "axios.com", "politico.com",
  "marketwatch.com", "barrons.com", "seekingalpha.com", "thestreet.com",
  "investopedia.com", "morningstar.com", "theinformation.com",
  "nature.com", "science.org", "cell.com", "thelancet.com", "nejm.org",
  "sciencemag.org", "scientificamerican.com", "nationalgeographic.com",
  "discovermagazine.com", "newscientist.com",
  "apartmenttherapy.com", "thekitchn.com", "food52.com", "seriouseats.com",
  "eater.com", "thrillist.com", "eonline.com", "tmz.com", "people.com",
  "usmagazine.com", "entertainmentweekly.com", "variety.com",
  "hollywoodreporter.com", "deadline.com", "indiewire.com",
  "rottentomatoes.com", "metacritic.com", "letterboxd.com", "goodreads.com",
  "espn.com", "espn.co.uk", "cbssports.com", "foxsports.com",
  "nbcsports.com", "skysports.com", "espncricinfo.com", "autoweek.com",
  "motorsport.com", "autosport.com", "cyclingnews.com", "velonews.com",
  "latimes.com", "chicagotribune.com", "bostonglobe.com", "sfgate.com",
  "seattletimes.com", "denverpost.com", "startribune.com", "detroitnews.com",
  "nydailynews.com", "nypost.com", "philly.com", "dallasnews.com",
  "statesman.com", "austinchronicle.com", "miaminewtimes.com",
  "quora.com", "scribd.com", "slideshare.net", "researchgate.net",
  "academia.edu", "jstor.org", "springer.com", "wiley.com",
  "sciencedirect.com", "ieee.org", "acm.org", "cambridge.org"
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'viewLink',
    title: 'Open without paywall',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>']
  });

  chrome.contextMenus.create({
    id: 'viewPage',
    title: 'Open this page without paywall',
    contexts: ['page'],
    documentUrlPatterns: ['<all_urls>']
  });

  chrome.storage.local.set({
    openInNewTab: true,
    showButton: true,
    autoDetect: true,
    buttonSites: DEFAULT_SITES
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let targetUrl = '';
  if (info.menuItemId === 'viewLink' && info.linkUrl) targetUrl = info.linkUrl;
  else if (info.menuItemId === 'viewPage') targetUrl = info.pageUrl;

  if (targetUrl) openViaService(targetUrl, tab.id);
});

function openViaService(url, currentTabId) {
  const serviceUrl = SERVICE_URL + encodeURIComponent(url);

  // Detect if tab is on Android (simpler approach: check if it's Firefox Android user)
  chrome.tabs.get(currentTabId, (tab) => {
    const isAndroid = tab && /Android/i.test(tab.url || '');

    chrome.storage.local.get(['openInNewTab'], (result) => {
      // On Android, default to same tab unless user explicitly set new tab
      const shouldOpenNew = result.openInNewTab !== undefined ? result.openInNewTab : !isAndroid;

      if (shouldOpenNew) {
        chrome.tabs.create({ url: serviceUrl });
      } else {
        chrome.tabs.update(currentTabId, { url: serviceUrl });
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openWithoutPaywall') {
    // Get sender tab ID if available
    const tabId = sender.tab ? sender.tab.id : null;
    openViaService(request.url, tabId);
    sendResponse({ success: true });
  }
  return true;
});
