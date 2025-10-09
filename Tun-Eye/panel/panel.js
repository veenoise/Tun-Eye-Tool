(function() {
  'use strict';

  console.log("[panel.js] Initializing...");

  // Cross-browser compatibility
  const storage = chrome.storage || browser.storage;

  // Utility
  const $ = (sel) => document.querySelector(sel);

  // UI state
  let currentStage = "select";
  let currentContentType = null; // 'text' or 'image'

  // ------------------------------
  // Debug logging
  // ------------------------------
  function log(...args) {
    console.log("[panel.js]", ...args);
  }

  // ------------------------------
  // Panel switching
  // ------------------------------
  function showSection(sectionId) {
    log("showSection ->", sectionId);

    // Hide all sections
    const sections = ['tuneye-main-interface', 'tuneye-settings-panel', 'tuneye-help-panel'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('tuneye-hidden');
    });

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
      target.classList.remove('tuneye-hidden');
    }
  }

  // ------------------------------
  // Stage management
  // ------------------------------
  function updateUIForStage(stage) {
    log("updateUIForStage ->", stage);

    const stageLabel = $('.tuneye-tool-stage');
    const actionBtn = $('#tuneye-submit');
    const tip = $('.tuneye-bottom-tip');

    if (!stageLabel || !actionBtn || !tip) {
      log("⚠ Missing DOM elements. Skipping stage update.");
      return;
    }

    // Remove all stage classes
    actionBtn.classList.remove(
      'tuneye-stage-select',
      'tuneye-stage-preview',
      'tuneye-stage-analyzing',
      'tuneye-stage-result',
      'tuneye-extension-disabled'
    );

    switch (stage) {
      case "select":
        stageLabel.textContent = "Select";
        actionBtn.innerHTML = "<b>Start Detection</b>";
        actionBtn.disabled = true;
        actionBtn.classList.add('tuneye-stage-select');
        tip.textContent = "Tip: Type text or select text/image first.";
        break;

      case "preview":
        stageLabel.textContent = "Preview";
        actionBtn.innerHTML = "<b>Start Detection</b>";
        actionBtn.disabled = false;
        actionBtn.classList.add('tuneye-stage-preview');
        tip.textContent = "Click to check if it is real or fake.";
        break;

      case "analyzing":
        stageLabel.textContent = "Analyzing";
        actionBtn.innerHTML = "<b>Analyzing...</b>";
        actionBtn.disabled = true;
        actionBtn.classList.add('tuneye-stage-analyzing');
        tip.textContent = "Please wait...";
        break;

      case "result":
        stageLabel.textContent = "Result";
        actionBtn.innerHTML = "<b>Return</b>";
        actionBtn.disabled = false;
        actionBtn.classList.add('tuneye-stage-result');
        tip.innerHTML = `Go to <span style="color: var(--tuneye-lightblue); font-weight: bold;">📊 Dashboard</span> for more details.`;
        break;

      default:
        log("Unknown stage:", stage);
    }
  }

  function setStage(stage) {
    log("setStage ->", stage);
    currentStage = stage;
    updateUIForStage(stage);
  }

  // ------------------------------
  // Content display
  // ------------------------------
  function displayContent(type, value) {
    log("displayContent ->", type, value);

    const textInput = $('#tuneye-text-input');
    const imageDisplay = $('#tuneye-image-display');

    if (!textInput || !imageDisplay) return;

    if (type === 'text') {
      textInput.value = value;
      textInput.classList.remove('tuneye-hidden');
      imageDisplay.classList.add('tuneye-hidden');
      currentContentType = 'text';
      setStage('preview');
    } else if (type === 'image') {
      imageDisplay.innerHTML = `<img src="${value}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
      imageDisplay.classList.remove('tuneye-hidden');
      textInput.classList.add('tuneye-hidden');
      currentContentType = 'image';
      setStage('preview');
    }
  }

  function clearContent() {
    const textInput = $('#tuneye-text-input');
    const imageDisplay = $('#tuneye-image-display');

    if (textInput) {
      textInput.value = '';
      textInput.classList.remove('tuneye-hidden');
    }
    if (imageDisplay) {
      imageDisplay.innerHTML = '';
      imageDisplay.classList.add('tuneye-hidden');
    }

    currentContentType = null;
    setStage('select');
  }

  // ------------------------------
  // Initialize panel
  // ------------------------------
  function initPanel() {
    log("Initializing panel...");

    // Load content from storage
    storage.local.get(null, (res) => {
      log("Storage loaded:", res);

      const submitBtn = $('#tuneye-submit');

      // Set default values if not present
      if (!("enableExtension" in res)) {
        storage.local.set({ enableExtension: true });
        res.enableExtension = true;
      }

      // Display content if it exists
      if (res.type && res.value) {
        displayContent(res.type, res.value);
      } else {
        setStage('select');
      }

      // Apply enableExtension state
      if (res.enableExtension === false && submitBtn) {
        log("Extension disabled - disabling submit button");
        submitBtn.disabled = true;
        submitBtn.classList.add('tuneye-extension-disabled');
        submitBtn.innerHTML = "<b>Extension Disabled</b>";
      }

      // Apply settings to checkboxes
      const enableExtensionCheckbox = $('#tuneye-enable-extension');
      const enableRecordCheckbox = $('#tuneye-enable-record');
      const enableInstructionCheckbox = $('#tuneye-enable-instructionOnStartup');

      if (enableExtensionCheckbox) enableExtensionCheckbox.checked = res.enableExtension !== false;
      if (enableRecordCheckbox) enableRecordCheckbox.checked = res.enableRecord === true;
      if (enableInstructionCheckbox) enableInstructionCheckbox.checked = res.enableInstructionOnStartup === true;
    });

    // Monitor text input changes
    const textInput = $('#tuneye-text-input');
    if (textInput) {
      textInput.addEventListener('input', () => {
        const hasText = textInput.value.trim().length > 0;
        if (hasText && currentContentType !== 'image') {
          currentContentType = 'text';
          if (currentStage === 'select') {
            setStage('preview');
          }
        } else if (!hasText && currentContentType === 'text') {
          setStage('select');
        }
      });
    }

    // Storage change listener
    storage.onChanged.addListener((changes, namespace) => {
      log("Storage changed:", changes, namespace);

      if (namespace === 'local') {
        // Handle content changes
        if (changes.type || changes.value) {
          const newType = changes.type?.newValue;
          const newValue = changes.value?.newValue;
          
          if (newType && newValue) {
            displayContent(newType, newValue);
          }
        }

        // Handle enableExtension changes
        if (changes.enableExtension) {
          const submitBtn = $('#tuneye-submit');
          const newValue = changes.enableExtension.newValue;

          if (submitBtn) {
            if (newValue === true) {
              submitBtn.disabled = false;
              submitBtn.classList.remove('tuneye-extension-disabled');
              updateUIForStage(currentStage);
            } else {
              submitBtn.disabled = true;
              submitBtn.classList.add('tuneye-extension-disabled');
              submitBtn.innerHTML = "<b>Extension Disabled</b>";
            }
          }
        }
      }
    });

    setupEventListeners();
  }

  // ------------------------------
  // Event listeners
  // ------------------------------
  function setupEventListeners() {
    log("Setting up event listeners...");

    // Close button
    const closeBtn = $('.tuneye-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        log("Close button clicked");
        const container = document.getElementById('tuneye-panel-container');
        if (container) {
          container.classList.remove('tuneye-visible');
        }
      });
    }

    // Dashboard button
    const dashBtn = $('.tuneye-dashboard');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => {
        log("Dashboard clicked");
        chrome.tabs.create({ url: chrome.runtime.getURL('page/page.html') });
      });
    }

    // Settings button
    const settingsBtn = $('.tuneye-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        log("Settings button clicked");
        const settingsPanel = document.getElementById('tuneye-settings-panel');
        const isHidden = settingsPanel?.classList.contains('tuneye-hidden');
        
        if (isHidden) {
          showSection('tuneye-settings-panel');
        } else {
          showSection('tuneye-main-interface');
        }
      });
    }

    // Help button
    const helpBtn = $('.tuneye-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        log("Help button clicked");
        const helpPanel = document.getElementById('tuneye-help-panel');
        const isHidden = helpPanel?.classList.contains('tuneye-hidden');
        
        if (isHidden) {
          showSection('tuneye-help-panel');
        } else {
          showSection('tuneye-main-interface');
        }
      });
    }

    // Settings checkboxes
    const enableExtensionCheckbox = $('#tuneye-enable-extension');
    const enableRecordCheckbox = $('#tuneye-enable-record');
    const enableInstructionCheckbox = $('#tuneye-enable-instructionOnStartup');

    if (enableExtensionCheckbox) {
      enableExtensionCheckbox.addEventListener('change', (e) => {
        storage.local.set({ enableExtension: e.target.checked });
        log("enableExtension set to:", e.target.checked);
      });
    }

    if (enableRecordCheckbox) {
      enableRecordCheckbox.addEventListener('change', (e) => {
        storage.local.set({ enableRecord: e.target.checked });
        log("enableRecord set to:", e.target.checked);
      });
    }

    if (enableInstructionCheckbox) {
      enableInstructionCheckbox.addEventListener('change', (e) => {
        storage.local.set({ enableInstructionOnStartup: e.target.checked });
        log("enableInstructionOnStartup set to:", e.target.checked);
      });
    }

    // Submit button (Detection flow)
    const submitBtn = $('#tuneye-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        log("Submit clicked. Current stage:", currentStage);

        if (currentStage === 'preview') {
          // Start detection
          setStage('analyzing');

          try {
            // Prepare data for API
            const textInput = $('#tuneye-text-input');
            let dataToSend = {};

            if (currentContentType === 'text' && textInput) {
              dataToSend = {
                type: 'text',
                value: textInput.value.trim()
              };
            } else if (currentContentType === 'image') {
              // Get image data from storage
              const storageData = await new Promise((resolve) => {
                storage.local.get(['type', 'value'], resolve);
              });
              dataToSend = storageData;
            }

            // Get settings
            const settings = await new Promise((resolve) => {
              storage.local.get(['enableRecord'], resolve);
            });

            log("Sending to API:", dataToSend);

            // Call Flask API
            const response = await fetch("http://127.0.0.1:1234/api/process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Log": settings.enableRecord || false,
              },
              body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const output = await response.json();
            log("API response:", output);

            // Transition to result stage
            setStage('result');

            // Display verdict and chart
            displayResults(output);

          } catch (err) {
            log("Error during detection:", err);
            console.error("Error encountered:\n------------------------------\n", err);
            
            // Return to preview stage on error
            setStage('preview');
            
            // Show error to user
            const mainContent = $('.tuneye-popup-main');
            if (mainContent) {
              mainContent.innerHTML = `<p style="color: red; padding: 10px; text-align: center;">Error: Could not connect to detection service. Make sure the backend is running.</p>`;
            }
          }

        } else if (currentStage === 'result') {
          // Return to select stage
          log("Returning to select stage");
          
          // Clear stored content
          storage.local.remove(['type', 'value'], () => {
            log("Cleared content from storage");
          });
          
          clearContent();
        }
      });
    }
  }

  // ------------------------------
  // Display results (Chart)
  // ------------------------------
  function displayResults(output) {
    log("Displaying results:", output);

    const mainContent = $('.tuneye-popup-main');
    if (!mainContent) return;

    const verdict = output.verdict;
    const words = output.words;

    // Determine verdict color
    const verdictColor = verdict === "Fake News" ? "#F7BF2D" : "#035EE6";
    const verdictText = verdict === "Fake News" ? "⚠ Fake News" : "✓ Real News";

    // Clear and rebuild content
    mainContent.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 10px;">
          <h2 style="color: ${verdictColor}; margin: 0; font-size: 28px;">${verdictText}</h2>
        </div>
        <div style="flex: 1; width: 100%; min-height: 0;">
          <canvas id="tuneye-chartBreakdown"></canvas>
        </div>
      </div>
    `;

    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
      log("Loading Chart.js...");
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('popup/chart.js');
      script.onload = () => {
        log("Chart.js loaded");
        renderChart(words, verdict);
      };
      document.head.appendChild(script);
    } else {
      renderChart(words, verdict);
    }
  }

  function renderChart(words, verdict) {
    setTimeout(() => {
      const ctx = document.getElementById('tuneye-chartBreakdown');
      if (!ctx) {
        log("Canvas not found");
        return;
      }

      new Chart(ctx, {
        type: "bar",
        data: {
          labels: words.map(item => item.word),
          datasets: [
            {
              label: "Confidence Score",
              data: words.map(item => item.weight),
              backgroundColor: words.map(item => item.weight < 0 ? "#F7BF2D" : "#035EE6"),
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          indexAxis: "y",
          scales: {
            x: {
              min: -1,
              max: 1,
              grid: {
                color: (context) => (context.tick.value === 0 ? "#2D2D51" : "transparent"),
                lineWidth: (context) => (context.tick.value === 0 ? 2 : 0),
              },
              ticks: {
                callback: function (value) {
                  return (value > 0 ? "+" : "") + value;
                },
                color: "#2D2D51",
                font: {
                  size: 10,
                },
              },
            },
            y: {
              grid: {
                drawBorder: false,
              },
              ticks: {
                color: "#2D2D51",
                font: {
                  size: 10,
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  return `${ctx.dataset.label}: ${ctx.raw}`;
                },
              },
            },
            title: {
              display: true,
              text: "Fake                    Neutral                    Real",
              font: {
                size: 11,
              },
              padding: {
                top: 5,
                bottom: 5,
              },
              color: "#2D2D51",
            },
          },
        },
      });
    }, 100);
  }

  // ------------------------------
  // Expose initialization function
  // ------------------------------
  window.initTunEyePanel = initPanel;

  log("Panel script loaded and ready");

})();