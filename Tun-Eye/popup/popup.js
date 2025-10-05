// ------------------------------
// Cross-browser compatibility
// ------------------------------
const storage = chrome.storage || browser.storage;

// ------------------------------
// Utility
// ------------------------------
const $ = (sel) => document.querySelector(sel);

// ------------------------------
// Debug Logging Helper
// ------------------------------
function log(...args) {
  console.log("[popup.js]", ...args);
}

// ------------------------------
// UI State
// ------------------------------
let currentStage = "select";

// ------------------------------
// Panel Switching
// ------------------------------
function showPanel(panelId) {
  log("showPanel ->", panelId);

    // Submit data on click
    submitBtn.addEventListener('click', async (e) => {
        const scanStep = document.querySelector('.default');
        const answerBtn = document.querySelector('.answer');
        const circleSym = document.querySelector('.symbol');

  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove("hidden");
  } else {
    log("Panel not found:", panelId);
  }
}

        const res = await chrome.storage.local.get(null);
        
        // Call flask API
        fetch("http://127.0.0.1:1234/api/process", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Log": res.enableRecord
            },
            body: JSON.stringify(res)
        })
            .then(res => {
                return res.json();
            })
            .then(output => {
                console.log(output);

                scanStep.classList.add("hidden");
                answerBtn.classList.remove('hidden');
                answerBtn.childNodes[1].childNodes[2].textContent = output['verdict'];

                // Change symbol color
                if (output['verdict'] === "Fake News") {
                    circleSym.style.backgroundColor = "#F7BF2D";
                } else if (output['verdict'] === "Real News") {
                    circleSym.style.backgroundColor = "#035EE6";
                }

                // Populate the result to chart js
                console.log(output.words.map(item => item.word))
                console.log(output.words.map(item => item.weight))
                callChartJs(output.words.map(item => item.word), output.words.map(item => item.weight));

                // When user clicks how, it shows the breakdown interface
                document.querySelector('.breakdown').addEventListener('click', () => {
                    mainInterface.classList.add('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.remove('hidden');
                })

                // When user clicks go back, it returns to the main interface
                document.querySelector('#goBack').addEventListener('click', () => {
                    mainInterface.classList.remove('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.add('hidden');
                })
            })
            .catch(err => {
                console.error(`Error encountered:\n------------------------------\n${err}`)
            })
    })
})


// Settings interface
const enableExtension = document.querySelector('#enable-extension');
const enableRecord = document.querySelector('#enable-record');
const doneBtn = document.querySelector('.done');
document.querySelectorAll('.settings').forEach(settings => {
    settings.addEventListener('click', () => {
        body.style.backgroundColor = "#2D2D51";
        mainInterface.classList.add('hidden');
        breakdownInterface.classList.add('hidden');
        settingsInterface.classList.remove('hidden');

        // Apply previous user settings
        chrome.storage.local.get(null)
            .then(res => {
                enableExtension.checked = !!res.enableExtension;
                enableRecord.checked = !!res.enableRecord;

                // Return to main interface from settings
                doneBtn.addEventListener('click', () => {
                    chrome.storage.local.set({
                        ...res,
                        "enableExtension": enableExtension.checked,
                        "enableRecord": enableRecord.checked
                    })

                    mainInterface.classList.remove('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.add('hidden');

                    body.style.backgroundColor = "#039BE6";
                })
            })
    })
})


function callChartJs(words, values) {
    // chart
    const ctx = document.getElementById('chartBreakdown').getContext('2d');

    const data = {
        labels: words,
        datasets: [
          {
            label: "Confidence Score",
            data: values,
            backgroundColor: values.map((val) => (val < 0 ? "#F7BF2D" : "#035EE6")),
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
                size: 11,
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
                size: 11,
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
            text: "Fake                           Neutral                           Real",
            font: {
              size: 12,
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

// TEMPORARY TEST - Call testChart() in console to test
function testChart() {
  const mockOutput = {
    verdict: "Fake News",
    words: [
      { word: "hoax", weight: -0.8 },
      { word: "fake", weight: -0.6 },
      { word: "truth", weight: 0.7 },
      { word: "verified", weight: 0.9 },
    ],
  };
  
  setStage("result");
  callChartJs(
    mockOutput.words.map((item) => item.word),
    mockOutput.words.map((item) => item.weight),
    mockOutput.verdict
  );
}

// ------------------------------
// Event Listeners
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  log("DOMContentLoaded fired.");

  // Load Content from Storage
    storage.local.get(null, (res) => {
      log("Storage loaded:", res);

      const mainContent = $(".popup-main");
      const submitBtn = $("#submit");

      // Set default values if not present
      if (!("enableExtension" in res)) {
        storage.local.set({ enableExtension: true });
        res.enableExtension = true;
      }

      if (!("enableRecord" in res)) {
        storage.local.set({ enableRecord: false });
        res.enableRecord = false;
      }

    // Display content if it exists
    if (res.type && res.value) {
      switch (res.type) {
        case "text":
          mainContent.innerHTML = `<p style="color: #2D2D51; padding: 10px;">${res.value}</p>`;
          setStage("preview");
          break;
        case "image":
          mainContent.innerHTML = `<img src="${res.value}" style="object-fit:contain; width:100%; height:100%; display:block;" />`;
          setStage("preview");
          break;
        default:
          log("Unknown content type:", res.type);
          setStage("select");
          break;
      }
    } else {
      log("No content in storage");
      setStage("select");
    }

    // Apply enableExtension state to button
    if (res.enableExtension === false && submitBtn) {
      log("Extension disabled - disabling submit button");
      submitBtn.disabled = true;
      submitBtn.classList.remove("stage-select", "stage-preview", "stage-analyzing", "stage-result");
      submitBtn.classList.add("extension-disabled");
      submitBtn.textContent = "Extension Disabled";
    }

  });

  //Storage change listener
  storage.onChanged.addListener((changes, namespace) => {
    log("Storage changed:", changes, namespace);

    if (namespace === "local" && changes.enableExtension) {
      const submitBtn = $("#submit");
      const newValue = changes.enableExtension.newValue;

      log("enableExtension changed to:", newValue);

      if (submitBtn) {
        if (newValue === true) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("extension-disabled");
          log("Submit button enabled");
          // Restore proper stage styling
          updateUIForStage(currentStage);
        } else {
          submitBtn.disabled = true;
          submitBtn.classList.remove("stage-select", "stage-preview", "stage-analyzing", "stage-result");
          submitBtn.classList.add("extension-disabled");
          submitBtn.textContent = "Extension Disabled";
          log("Submit button disabled");
        }
      }
    }
  });

  // Dashboard button
  const dashBtn = $(".dashboard");
  if (dashBtn) {
    dashBtn.addEventListener("click", () => {
      log("Dashboard clicked");
      chrome.tabs.create({ url: chrome.runtime.getURL("page/page.html") });
    });
  }

  // Settings button
  const settingsBtn = $(".icon-btn.settings");
  const settingsPanel = document.getElementById("settings-panel");
  const mainInterface = document.getElementById("main-interface");
  const helpPanel = document.getElementById("help-panel");

  if (settingsBtn && settingsPanel && mainInterface) {
    settingsBtn.addEventListener("click", () => {
      const isSettingsHidden = settingsPanel.classList.contains("hidden");

      if (isSettingsHidden) {
        log("Opening settings panel");
        // Hide all other panels
        mainInterface.classList.add("hidden");
        helpPanel.classList.add("hidden");
        // Show settings
        settingsPanel.classList.remove("hidden");
      } else {
        log("Closing settings panel");
        // Close settings, show main
        settingsPanel.classList.add("hidden");
        mainInterface.classList.remove("hidden");
      }
    });
  }

  // Help button
  const helpBtn = $(".icon-btn.help");
  if (helpBtn && helpPanel && mainInterface) {
    helpBtn.addEventListener("click", () => {
      const isHelpHidden = helpPanel.classList.contains("hidden");

      if (isHelpHidden) {
        log("Opening help panel");
        // Hide all other panels
        mainInterface.classList.add("hidden");
        settingsPanel.classList.add("hidden");
        // Show help
        helpPanel.classList.remove("hidden");
      } else {
        log("Closing help panel");
        // Close help, show main
        helpPanel.classList.add("hidden");
        mainInterface.classList.remove("hidden");
      }
    });
  }


  // Detection button
  const submitBtn = $("#submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      log("Submit clicked. Current stage:", currentStage);

      if (currentStage === "preview") {
        // Start detection
        setStage("analyzing");

        try {
          // Get all storage data for API call
          const storageData = await new Promise((resolve) => {
            storage.local.get(null, resolve);
          });

          log("Sending to API:", storageData);

          // Call Flask API
          const response = await fetch("http://127.0.0.1:1234/api/process", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Log": storageData.enableRecord || false,
            },
            body: JSON.stringify(storageData),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const output = await response.json();
          log("API response:", output);

          // Transition to result stage
          setStage("result");

          // Display verdict and chart
          callChartJs(
            output.words.map((item) => item.word),
            output.words.map((item) => item.weight),
            output.verdict
          );

        } catch (err) {
          log("Error during detection:", err);
          console.error("Error encountered:\n------------------------------\n", err);
          
          // Return to preview stage on error
          setStage("preview");
          
          // Show error to user
          const mainContent = $(".popup-main");
          if (mainContent) {
            mainContent.innerHTML = `<p style="color: red; padding: 10px;">Error: Could not connect to detection service. Make sure the backend is running.</p>`;
          }
        }

      } else if (currentStage === "result") {
        // Return to select stage
        log("Returning to select stage");
        
        // Clear stored content
        storage.local.remove(["type", "value"], () => {
          log("Cleared content from storage");
        });
        
        // Reset to select stage
        setStage("select");
        
        // Clear the content display
        const mainContent = $(".popup-main");
        if (mainContent) {
          mainContent.innerHTML = `<p><i>Your selected content will appear here.<br><br>Right click on highlighted text or hovered image to load it here.</i></p>`;
        }
      }
    });
  }

});

