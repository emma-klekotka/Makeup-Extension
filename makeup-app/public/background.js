importScripts('leapingBunnyScraper.js');
importScripts('veganScraper.js');

let currentTabUrl = '';

function updateCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTabUrl = tabs[0]?.url ?? '';
  });
}

chrome.tabs.onActivated.addListener(updateCurrentTab);

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url) {
    updateCurrentTab();
  }
});

// --- Message handlers ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url ?? '' });
    });
    return true;
  }

  if (message.type === 'CHECK_LEAPING_BUNNY') {
    fetchAllBrands()
      .then((brands) => {
        const result = fuzzyMatch(message.companyName, brands);
        sendResponse(result);
      })
      .catch((err) => {
        sendResponse({ found: false, bestMatch: null, score: 0, error: err.message });
      });
    return true;
  }

  if (message.type === 'CHECK_VEGAN') {
    fetchAllVeganBrands()
      .then((brands) => {
        const result = fuzzyMatch(message.companyName, brands);
        sendResponse(result);
      })
      .catch((err) => {
        sendResponse({ found: false, bestMatch: null, score: 0, error: err.message });
      });
    return true;
  }
});
