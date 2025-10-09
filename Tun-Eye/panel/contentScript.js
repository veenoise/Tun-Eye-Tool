console.log("[TUN-EYE] Content script loaded");

let panelInjected = false;
let panelVisible = false;

// ------------------------------
// Inject panel HTML & CSS
// ------------------------------
function injectPanel() {
  if (panelInjected) {
    console.log("[TUN-EYE] Panel already injected");
    return;
  }

  console.log("[TUN-EYE] Injecting panel...");

  // Create panel container
  const panelContainer = document.createElement('div');
  panelContainer.id = 'tuneye-panel-container';
  panelContainer.className = 'tuneye-panel-container';
  
  // Panel structure (adapted from popup.html)
  panelContainer.innerHTML = `
    <div class="tuneye-popup-container">
      <div class="tuneye-popup-header">
        <div class="tuneye-brand-group">
          <img src="${chrome.runtime.getURL('images/logo.png')}" alt="logo" class="tuneye-brand-logo">
          <div class="tuneye-branding">
            <h1 class="tuneye-brand-name"><b>TUN-EYE</b></h1>
          </div>
        </div>
        <div class="tuneye-header-icons">
          <button class="tuneye-icon-btn tuneye-dashboard" aria-label="Dashboard" title="Dashboard">
            <img src="${chrome.runtime.getURL('images/dashb.png')}" alt="Dashboard" />
          </button>
          <button class="tuneye-icon-btn tuneye-settings" aria-label="Settings" title="Settings">
            <img src="${chrome.runtime.getURL('images/settings.png')}" alt="Settings" />
          </button>
          <button class="tuneye-icon-btn tuneye-help" aria-label="Help" title="Help">
            <img src="${chrome.runtime.getURL('images/help.png')}" alt="Help" />
          </button>
          <button class="tuneye-icon-btn tuneye-close" aria-label="Close" title="Close Panel">×</button>
        </div>
      </div>

      <section id="tuneye-main-interface" class="">

        <div class="tuneye-popup-main">
          <textarea 
            id="tuneye-text-input" 
            class="tuneye-text-input" 
            placeholder="Your selected text will appear here.&#10;&#10;You can also type or paste text directly, or right-click highlighted text to load it here."
          ></textarea>
          <div id="tuneye-image-display" class="tuneye-image-display tuneye-hidden"></div>
        </div>

        <div class="tuneye-footer">
          <button class="tuneye-btn tuneye-start" id="tuneye-submit">
            <b>Start Detection</b>
          </button>
          <p class="tuneye-bottom-tip">Tip: Type text or select text/image first.</p>
        </div>
      </section>

      <!-- Settings Panel -->
      <section id="tuneye-settings-panel" class="tuneye-settings-panel tuneye-hidden">
        <h2 class="tuneye-settings-title">⚙ Settings</h2>
        <div class="tuneye-setting-item">
          <label for="tuneye-enable-extension">Enable Extension</label>
          <label class="tuneye-switch">
            <input type="checkbox" id="tuneye-enable-extension">
            <span class="tuneye-slider"></span>
          </label>
        </div>
        <div class="tuneye-setting-item">
          <label for="tuneye-enable-record">Record User scans for improvements</label>
          <label class="tuneye-switch">
            <input type="checkbox" id="tuneye-enable-record">
            <span class="tuneye-slider"></span>
          </label>
        </div>
        <div class="tuneye-setting-item">
          <label for="tuneye-enable-instructionOnStartup">Show instructions at startup</label>
          <label class="tuneye-switch">
            <input type="checkbox" id="tuneye-enable-instructionOnStartup">
            <span class="tuneye-slider"></span>
          </label>
        </div>
      </section>

      <!-- Help Panel -->
      <section id="tuneye-help-panel" class="tuneye-help-panel tuneye-hidden">
        <h2 class="tuneye-help-title">? Instructions</h2>
        <div class="tuneye-usage-list">
          <ol class="tuneye-tool-help">
            <li>Highlight text or hover over your mouse over an image.</li>
            <li>Right-click to open your browser's context menu.</li>
            <li>Select "ipa-TUN-EYE" from the context menu.</li>
            <li>In the panel, check the preview to make sure the right text or image is selected.</li>
            <li>Click 'Start Detection' and wait for the analysis to finish.</li>
            <li>View the detection results.</li>
          </ol>
          <br>
          <ol class="tuneye-button-help">
            <li>Click the <a>help (?) icon</a> to hide or view these instructions again.</li>
            <li>Click the <a>settings (⚙) icon</a> to adjust your preferences.</li>
            <li>Click the <a>dashboard (≡) icon</a> to view the full-page interface</li>
          </ol>
          <p>Tip: Pin the Tun-Eye extension in your toolbar</p>
        </div>
      </section>
    </div>
  `;

  // Inject CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('panel/panel.css');
  document.head.appendChild(link);

  // Inject Google font
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap';
  document.head.appendChild(fontLink);

  // Append panel to body
  document.body.appendChild(panelContainer);

  panelInjected = true;
  console.log("[TUN-EYE] Panel injected successfully");

  // Initialize panel logic after DOM is ready
  setTimeout(() => {
    if (window.initTunEyePanel) {
      window.initTunEyePanel();
    }
  }, 100);
}

// ------------------------------
// show/hide panel
// ------------------------------
function showPanel() {
  if (!panelInjected) {
    injectPanel();
  }
  
  const container = document.getElementById('tuneye-panel-container');
  if (container) {
    container.classList.add('tuneye-visible');
    panelVisible = true;
    console.log("[TUN-EYE] Panel shown");
  }
}

function hidePanel() {
  const container = document.getElementById('tuneye-panel-container');
  if (container) {
    container.classList.remove('tuneye-visible');
    panelVisible = false;
    console.log("[TUN-EYE] Panel hidden");
  }
}

function togglePanel() {
  if (panelVisible) {
    hidePanel();
  } else {
    showPanel();
  }
}

// ------------------------------
// Message listener (from background.js)
// ------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[TUN-EYE] Message received:", message);

  switch (message.action) {
    case 'togglePanel':
      togglePanel();
      sendResponse({ success: true });
      break;
    case 'showPanel':
      showPanel();
      sendResponse({ success: true });
      break;
    case 'hidePanel':
      hidePanel();
      sendResponse({ success: true });
      break;
    default:
      console.log("[TUN-EYE] Unknown action:", message.action);
  }

  return true; // Keep message channel open for async response
});

// ------------------------------
// Initialize on load
// ------------------------------
console.log("[TUN-EYE] Content script ready, waiting for commands...");