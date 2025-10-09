(function() {
  'use strict';

  // Prevent multiple injections on same page
  if (window.TUNEYE_INJECTED) {
    console.log("[TUN-EYE] Content script already running, skipping injection");
    return;
  }
  window.TUNEYE_INJECTED = true;

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

    // Check if container already exists (edge case)
    if (document.getElementById('tuneye-panel-container')) {
      console.log("[TUN-EYE] Panel container already exists in DOM");
      panelInjected = true;
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
                <h1 class="tuneye-brand-subtitle">Fake News Detector</h1>
            </div>
        </div>
        
        <div class="tuneye-header-icons">
            <button class="tuneye-icon-btn tuneye-settings" aria-label="Settings" title="Settings">
                <img src="${chrome.runtime.getURL('images/settings.png')}" alt="Settings" />
            </button>
            <button class="tuneye-icon-btn tuneye-help" aria-label="Help" title="Help">
                <img src="${chrome.runtime.getURL('images/help.png')}" alt="Help" />
            </button>
        </div>

        <button class="tuneye-icon-btn tuneye-close" aria-label="Close" title="Close Panel">x</button>
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
        </div>
    </section>

    <!-- Settings Panel -->
    <section id="tuneye-settings-panel" class="tuneye-settings-panel tuneye-hidden">
    <br><br>    
    <h2 class="tuneye-settings-title">Settings</h2>

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

        <br><br>
        <h2 class="tuneye-settings-title">About</h2>
        <ol class="tuneye-settings-links">
            <li><a href="https://github.com/veenoise/Tun-Eye-Tool" target="_blank" rel="noopener">Source Code</a></li>
            <li><a href="https://github.com/veenoise/Tun-Eye-Tool/releases/new" target="_blank" rel="noopener">Report an Issue</a></li>
        </ol><br>

        <h2 class="tuneye-settings-title">Contributors</h2>
        <ol class="tuneye-settings-links">
            <li><a href="https://github.com/veenoise/" target="_blank" rel="noopener">veenoise</a></li>
            <li><a href="https://github.com/KnightVicente" target="_blank" rel="noopener">knightvicente</a></li>
            <li><a href="https://github.com/Gelly-Tr33s" target="_blank" rel="noopener">Gelly-Tr33s</a></li>
            <li><a href="https://github.com/Shifard" target="_blank" rel="noopener">Shifard</a></li>
            
            <li><a href="about:blank" target="_blank" rel="noopener">Study</a></li>
        </ol><br>

      </section>

    <!-- Help Panel -->
    <section id="tuneye-help-panel" class="tuneye-help-panel tuneye-hidden">
        <img src="${chrome.runtime.getURL('images/help-img.png')}" alt="Help" class="tuneye-help-img">
        <div class="tuneye-help-sub-box">
            <h2 class="tuneye-help-title">Know the Truth behind Every News</h2>
            <p class="tuneye-help-subtitle">Tun-Eye helps you check if a Facebook post about politics is real or fake news. It analyzes both text and images, whether they’re in Filipino, English, or Taglish. </p>
            <p class="tuneye-help-subtitle">Just input the post, and Tun-Eye will do the rest, giving you a quick and simple way to stay informed and know what’s real or fake in political news online. </p>
            <div class="tuneye-usage-list">
            <h2 class="tuneye-help-title">How it works</h2>
                <ol class="tuneye-tool-help">
                    <li>Highlight text or hover your mouse over an image, then right-click to open your browser menu</li>
                    <li>Select "ipa-Tun-eye".</li>
                    <li>Click “Start Detect” to start the analysis.</li>
                    <li>View the results to see credibility insights.</li>
                </ol>      
            </div>

            <h2 class="tuneye-help-title">Remember</h2>
            <p class="tuneye-help-subtitle">Tun-Eye helps you think critically, but always verify with trusted sources.</p>
        </div>
    </section>
    </div>
  `;

    // Inject CSS (check if not already injected)
    if (!document.querySelector('link[href*="panel.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('panel/panel.css');
      document.head.appendChild(link);
    }

    // Inject Google Font
    if (!document.querySelector('link[href*="JetBrains+Mono"]')) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap';
      document.head.appendChild(fontLink);
    }

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
  console.log("[TUN-EYE] Content script ready, waiting for commands");

})();