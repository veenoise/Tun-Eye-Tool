console.log("[TUN-EYE] Background script loaded");

// ------------------------------
// Context Menu Handler
// ------------------------------
chrome.contextMenus.onClicked.addListener(genericOnClick);

function genericOnClick(info, tab) {
    console.log("[TUN-EYE] Context menu clicked:", info.menuItemId);
    
    switch (info.menuItemId) {
        case 'selection':
            chrome.storage.local.set({
                value: info.selectionText,
                type: 'text'
            }, () => {
                console.log("[TUN-EYE] Text saved to storage");
                // Send message to content script to show panel
                sendShowPanelMessage(tab.id);
            });
            break;
            
        case 'image':
            chrome.storage.local.set({
                value: info.srcUrl,
                type: 'image'
            }, () => {
                console.log("[TUN-EYE] Image URL saved to storage");
                // Send message to content script to show panel
                sendShowPanelMessage(tab.id);
            });
            break;
            
        default:
            break;
    }
}

// ------------------------------
// Send message to content script
// ------------------------------
function sendShowPanelMessage(tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'showPanel' }, (response) => {
        if (chrome.runtime.lastError) {
            // This is normal - content script might not be ready yet
            console.log("[TUN-EYE] Content script not responding, will be ready on next interaction");
            // Don't try to inject manually - let manifest.json handle it
            // The panel will appear on next interaction
        } else {
            console.log("[TUN-EYE] Panel show message sent successfully");
        }
    });
}

// ------------------------------
// Browser Action (Toolbar Icon Click)
// ------------------------------
chrome.action.onClicked.addListener((tab) => {
    console.log("[TUN-EYE] Toolbar icon clicked");
    
    // Toggle panel
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, (response) => {
        if (chrome.runtime.lastError) {
            // Content script not ready - this is normal for newly loaded pages
            console.log("[TUN-EYE] Content script not ready yet");
            // Don't inject manually - it will load automatically
            // User can try again in a moment
        } else {
            console.log("[TUN-EYE] Panel toggled successfully");
        }
    });
});

// ------------------------------
// Create Context Menu on Install
// ------------------------------
chrome.runtime.onInstalled.addListener(function () {
    console.log("[TUN-EYE] Extension installed, creating context menus...");
    
    let contexts = ['selection', 'image'];
    
    for (let i = 0; i < contexts.length; i++) {
        let context = contexts[i];
        let title = "ipa-Tun-Eye: " + context + " mode";
        
        chrome.contextMenus.create({
            title: title,
            contexts: [context],
            id: context
        });
    }
    
    console.log("[TUN-EYE] Context menus created");
});