function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
    });
}

chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    console.log('History state updated', details);
    injectContentScript(details.tabId);
    setTimeout(() => {
        chrome.tabs.sendMessage(details.tabId, { type: "locationchange" }, response => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError.message);
            } else {
                console.log('Message sent:', response);
            }
        });
    }, 1000); 
});