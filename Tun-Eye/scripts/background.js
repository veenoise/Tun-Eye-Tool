// A generic onclick callback function.
chrome.contextMenus.onClicked.addListener(genericOnClick);

// A generic onclick callback function.
function genericOnClick(info) {
    switch (info.menuItemId) {
        case 'selection':
            chrome.storage.local.set({
                value: info.selectionText,
                type: 'text'
            })
            console.log("this is a selection")
            break;
        case 'image':
            console.log("this an image")
            chrome.storage.local.set({
                value: info.srcUrl,
                type: 'image'
            })
            break
        default:
            break;
    }

    chrome.windows.getAll().then(res => {
        const screenWidth = res.at(-1).width;
        const popupHeight = 640;
        const popupWidth = 620;
        console.log(screenWidth)
        chrome.windows.create({
            url: chrome.runtime.getURL('../popup/popup.html'),
            type: 'popup',
            height: popupHeight,
            width: popupWidth,
            left: Math.floor(screenWidth - popupWidth)
        })
    })
}

chrome.runtime.onInstalled.addListener(function () {
    // Create one test item for each context type.
    let contexts = [
        'selection',
        'image'
    ];
    for (let i = 0; i < contexts.length; i++) {
        let context = contexts[i];
        let title = "ipa-Tun-Eye: " + context + " mode";
        chrome.contextMenus.create({
            title: title,
            contexts: [context],
            id: context
        });
    }
});