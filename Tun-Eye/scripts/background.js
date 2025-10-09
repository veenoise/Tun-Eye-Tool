console.log("[TUN-EYE] Background script loaded");
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
            console.error("[TUN-EYE] Error sending message:", chrome.runtime.lastError.message);
            console.log("[TUN-EYE] Content script might not be injected yet. Attempting to inject...");
            
            // Try to inject content script if it's not already there
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['panel/panel.js', 'panel/contentScript.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("[TUN-EYE] Failed to inject content script:", chrome.runtime.lastError.message);
                } else {
                    console.log("[TUN-EYE] Content script injected, retrying message...");
                    // Retry sending message after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, { action: 'showPanel' });
                    }, 500);
                }
            });
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
            console.error("[TUN-EYE] Error sending toggle message:", chrome.runtime.lastError.message);
            console.log("[TUN-EYE] Attempting to inject content script...");
            
            // Inject content script if not already there
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['panel/panel.js', 'panel/contentScript.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("[TUN-EYE] Failed to inject:", chrome.runtime.lastError.message);
                } else {
                    console.log("[TUN-EYE] Injected, showing panel...");
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, { action: 'showPanel' });
                    }, 500);
                }
            });
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