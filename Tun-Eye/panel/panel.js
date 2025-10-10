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

    const actionBtn = $('#tuneye-submit');

    if (!actionBtn) {
      log("⚠ Missing DOM elements. Skipping stage update.");
      return;
    }

    // Remove all stage classes
    actionBtn.classList.remove(
      'tuneye-stage-select',
      'tuneye-stage-preview',
      'tuneye-stage-analyzing',
      'tuneye-stage-result',
    );

    switch (stage) {
      case "select":
        actionBtn.innerHTML = "<b>Enter an Input</b>";
        actionBtn.disabled = true;
        actionBtn.classList.add('tuneye-stage-select');
        break;

      case "preview":
        actionBtn.innerHTML = "<b>Start Detection</b>";
        actionBtn.disabled = false;
        actionBtn.classList.add('tuneye-stage-preview');
        break;

      case "analyzing":
        actionBtn.innerHTML = "<b>Analyzing...</b>";
        actionBtn.disabled = true;
        actionBtn.classList.add('tuneye-stage-analyzing');
        break;

      case "result":
        actionBtn.innerHTML = "<b>Return</b>";
        actionBtn.disabled = false;
        actionBtn.classList.add('tuneye-stage-result');
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
    log("clearContent called");
    const mainContent = $('.tuneye-popup-main');
    const textInput = $('#tuneye-text-input');
    const imageDisplay = $('#tuneye-image-display');

if (!textInput || !imageDisplay) {
  log("Rebuilding main content structure...");
  if (mainContent) {
    mainContent.innerHTML = `
        <textarea 
            id="tuneye-text-input" 
            class="tuneye-text-input" 
            placeholder="Your selected text will appear here.


1. Highlight text or hover your mouse over an image, then right-click to open your browser menu.

2. Select 'ipa-Tun-eye'.

3. Click 'Start Detection' to start the analysis.

4. View the results to see credibility insights."
        ></textarea>
      <div id="tuneye-image-display" class="tuneye-image-display tuneye-hidden"></div>
    `;
        
        const newTextInput = $('#tuneye-text-input');
        if (newTextInput) {
          newTextInput.addEventListener('input', () => {
            const hasText = newTextInput.value.trim().length > 0;
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
      }
    } else {
      // Elements exist, just clear them
      if (textInput) {
        textInput.value = '';
        textInput.classList.remove('tuneye-hidden');
      }
      if (imageDisplay) {
        imageDisplay.innerHTML = '';
        imageDisplay.classList.add('tuneye-hidden');
      }
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

      // Display content if it exists
      if (res.type && res.value) {
        displayContent(res.type, res.value);
      } else {
        setStage('select');
      }

      // Apply settings to checkboxes
      const enableTestModeCheckbox = $('#tuneye-enable-testmode');
      const enableRecordCheckbox = $('#tuneye-enable-record');
      const enableInstructionCheckbox = $('#tuneye-enable-instructionOnStartup');

      if (enableTestModeCheckbox) enableTestModeCheckbox.checked = res.enableTestMode === true;
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

    // Settings button
    const settingsBtn = $('.tuneye-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        log("Settings button clicked");
        const settingsPanel = document.getElementById('tuneye-settings-panel');
        const isHidden = settingsPanel?.classList.contains('tuneye-hidden');
        
        if (isHidden) {
          showSection('tuneye-settings-panel');
          setActiveHeader('settings');
        } else {
          showSection('tuneye-main-interface');
          setActiveHeader(null);
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
          setActiveHeader('help');
        } else {
          showSection('tuneye-main-interface');
          setActiveHeader(null);
        }
      });
    }

    // Helper: highlight the active icon
    function setActiveHeader(buttonName) {
    const settingsBtn = $('.tuneye-settings');
    const helpBtn = $('.tuneye-help');

    [settingsBtn, helpBtn].forEach(btn => {
        if (btn) btn.style.backgroundColor = 'transparent';
    });

    if (buttonName === 'settings' && settingsBtn) {
        settingsBtn.style.backgroundColor = 'var(--tuneye-purple)';
    } else if (buttonName === 'help' && helpBtn) {
        helpBtn.style.backgroundColor = 'var(--tuneye-purple)';
    }
    }


    // Settings checkboxes
    const enableTestModeCheckbox = $('#tuneye-enable-testmode');
    const enableRecordCheckbox = $('#tuneye-enable-record');
    const enableInstructionCheckbox = $('#tuneye-enable-instructionOnStartup');

    if (enableTestModeCheckbox) {
      enableTestModeCheckbox.addEventListener('change', (e) => {
        storage.local.set({ enableTestMode: e.target.checked });
        log("enableTestMode set to:", e.target.checked);
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
            // Get settings
            const settings = await new Promise((resolve) => {
              storage.local.get(['enableRecord', 'enableTestMode'], resolve);
            });

            // Check if test mode is enabled
            if (settings.enableTestMode === true) {
              log("🧪 TEST MODE: Using fake data");
              
              // Simulate API delay
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Generate random fake/real verdict
              const isFake = Math.random() > 0.5;
              const mockOutput = {
                verdict: isFake ? "Fake News" : "Real News",
                words: [
                  { word: "hoax", weight: -0.8 },
                  { word: "misleading", weight: -0.4 },
                  { word: "truth", weight: 0.7 },
                  { word: "verified", weight: 0.9 },
                  { word: "confirmed", weight: 0.85 }
                ]
              };

              log("🧪 Mock API response:", mockOutput);

              // Transition to result stage
              setStage('result');

              // Display verdict and chart
              displayResults(mockOutput);
              // Add chart zoom controls after chart is rendered
              setTimeout(() => addChartControls(), 500);

              return; // Exit early, don't call real API
            }

            // REAL API CALL (if test mode disabled)
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
            // Add chart zoom controls after chart is rendered
            setTimeout(() => addChartControls(), 500);

          } catch (err) {
            log("Error during detection:", err);
            console.error("Error encountered:\n------------------------------\n", err);
            
            // Return to preview stage on error
            setStage('preview');
            
            // Show error to user
            const mainContent = $('.tuneye-popup-main');
            if (mainContent) {
              mainContent.innerHTML = `<p style="color: red; padding: 10px; text-align: center; font-family: 'JetBrains Mono', monospace;">⚠️ Error: Could not connect to detection service.<br><br>Make sure the backend is running, or enable <strong>Test Mode</strong> in Settings to try without backend.</p>`;
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
    // script.src = chrome.runtime.getURL('chart.js');
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.min.js";
      script.onload = () => {
        log("Chart.js loaded");
        renderChart(words, verdict);
      };
      script.onerror = () => {
      log("X Failed to load Chart.js!");
      };
      document.head.appendChild(script);
    } 
    else {
      log("✓ Chart.js already loaded");
      renderChart(words, verdict);
    }
  }

  function renderChart(words, verdict) {
    log("renderChart called with:", words)
    setTimeout(() => {
      const ctx = document.getElementById('tuneye-chartBreakdown');
      if (!ctx) {
        log("Canvas not found");
        return;
      }

    log("✓ Canvas found, checking Chart.js...");
      
    if (typeof Chart === 'undefined') {
        log("X Chart.js still not loaded!");
        return;
    }

    log("✓ Chart.js loaded, creating chart...");

      try {
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
                  drawBorder: false,
                //   display: false,
                },
                ticks: {
                    display: false,
                //   callback: function (value) {
                //     return (value > 0 ? "+" : "") + value;
                //   },
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
                    size: 13,
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
                text: "          Fake            Neutral            Real",
                font: {
                  family: `monospace`,
                  size: 15,
                  weight: `bold`
                },
                padding: {
                  top: 5,
                  bottom: 5,
                  left: 100,
                },
                color: "#2D2D51",
                align: `center`
              },
            },
          },
        });
        
        log("✅ Chart created successfully!");
      } catch (err) {
        log("❌ Error creating chart:", err);
      }
    }, 200); // Increased timeout to 200ms for safety
  }

  // ------------------------------
  // Expose initialization function
  // ------------------------------
  window.initTunEyePanel = initPanel;

  log("Panel script loaded and ready");

})();