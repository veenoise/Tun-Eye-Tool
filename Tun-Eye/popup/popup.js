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

  document.querySelectorAll("section").forEach((s) => {
    s.classList.add("hidden");
  });

  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove("hidden");
  } else {
    log("Panel not found:", panelId);
  }
}

// ------------------------------
// Stage Handling
// ------------------------------
function updateUIForStage(stage) {
  log("updateUIForStage ->", stage);

  const stageLabel = $(".tool-stage");
  const mainPanel = $(".popup-main");
  const actionBtn = $("#submit");
  const tip = $(".bottom-tip");

  log("DOM check:", {
    stageLabel,
    mainPanel,
    actionBtn,
    tip,
  });

  if (!stageLabel || !mainPanel || !actionBtn || !tip) {
    log("❌ Missing DOM elements. Skipping stage update.");
    return;
  }

  switch (stage) {
    case "select":
      stageLabel.textContent = "Select";
      mainPanel.innerHTML = `<p><i>Your selected content will appear here.<br><br>
        Right click on highlighted text or hovered image to load it here.</i></p>`;
      actionBtn.textContent = "Start Detection";
      actionBtn.disabled = true;
      actionBtn.classList.add("disabled");
      tip.textContent = "Tip: Select text or image first.";
      break;

    case "preview":
      stageLabel.textContent = "Preview";
      actionBtn.textContent = "Start Detection";
      actionBtn.disabled = false;
      actionBtn.classList.remove("disabled");
      tip.textContent = "Click to check if it is real or fake.";
      break;

    case "analyzing":
      stageLabel.textContent = "Analyzing";
      mainPanel.innerHTML = `
        <p style="color: lightblue;"><i>Scanning Text...</i></p>
        <p style="color: lightblue;"><i>Scanning Captions...</i></p>
        <p style="color: lightblue;"><i>Verifying Information...</i></p>
      `;
      actionBtn.textContent = "Analyzing";
      actionBtn.disabled = true;
      actionBtn.classList.add("disabled");
      tip.textContent = "Please wait.";
      break;

    case "result":
      stageLabel.textContent = "Result";
      mainPanel.innerHTML = `<canvas id="barChart"></canvas>`;
      actionBtn.textContent = "Return";
      actionBtn.disabled = false;
      actionBtn.classList.remove("disabled");
      tip.innerHTML = `Go to <span class="dash-icon">📊</span> Dashboard for more details.`;
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
// Chart Rendering
// ------------------------------
function callChartJs(words, values, verdict) {
  log("Rendering chart with:", { words, values, verdict });

  const mainContent = $(".popup-main");
  if (!mainContent) return;

  // Determine verdict color
  const verdictColor = verdict === "Fake News" ? "#F7BF2D" : "#035EE6";
  const verdictText = verdict === "Fake News" ? "⚠ Fake News" : "✓ Real News";

  // Clear and rebuild content
  mainContent.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 0;">
        <h2 style="color: ${verdictColor}; margin: 0; font-size: 32px;">${verdictText}</h2>
      </div>
      <div style="flex: 1; width: 100%; min-height: 0;">
        <canvas id="chartBreakdown"></canvas>
      </div>
    </div>
  `;

  // Wait for DOM update, then render chart
  setTimeout(() => {
    const ctx = document.getElementById("chartBreakdown");
    if (!ctx) {
      log("Canvas not found");
      return;
    }

    new Chart(ctx, {
      type: "bar",
      data: {
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
      submitBtn.classList.add("submit-disabled", "disabled");
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
          submitBtn.classList.remove("submit-disabled", "disabled");
          log("Submit button enabled");
        } else {
          submitBtn.disabled = true;
          submitBtn.classList.add("submit-disabled", "disabled");
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
      const isHidden = settingsPanel.classList.contains("hidden");

      if (isHidden) {
        log("Opening settings panel");
        settingsPanel.classList.remove("hidden");
        mainInterface.classList.add("hidden");

        if (helpPanel && !helpPanel.classList.contains("hidden")) {
          log("Hiding help panel");
          helpPanel.classList.add("hidden");
        }
      } 
      else {
        log("Closing settings panel");
        settingsPanel.classList.add("hidden");
        mainInterface.classList.remove("hidden");
      }
    });
  }

  // Help button
  const helpBtn = $(".icon-btn.help");
  if (helpBtn && helpPanel && mainInterface) {
    helpBtn.addEventListener("click", () => {
      const isHidden = helpPanel.classList.contains("hidden");

      if (isHidden) {
        log("Opening help panel");
        helpPanel.classList.remove("hidden");
        mainInterface.classList.add("hidden");

        if (settingsPanel && !settingsPanel.classList.contains("hidden")) {
          log("Hiding settings panel");
          settingsPanel.classList.add("hidden");
        }
      } 
      else {
        log("Closing help panel");
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

