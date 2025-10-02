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
function renderChart(labels, values) {
  log("renderChart ->", { labels, values });

  const ctx = document.getElementById("barChart");
  if (!ctx) {
    log("❌ No canvas found for chart.");
    return;
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Confidence Score",
          data: values,
          backgroundColor: values.map((v) => (v < 0 ? "#F7BF2D" : "#035EE6")),
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { display: false },
      },
    },
  });
}

// ------------------------------
// Event Listeners
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const mainInterface = document.getElementById("main-interface");
  log("DOMContentLoaded fired.");

  log("Elements:", {
    toolStage: $(".tool-stage"),
    main: $(".popup-main"),
    submit: $("#submit"),
    tip: $(".bottom-tip"),
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
            mainInterface.classList.remove("hidden"); 
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
  const helpPanel = document.getElementById("help-panel");
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
            mainInterface.classList.remove("hidden"); 
          } 
        }
        else {
          log("Closing help panel");
          helpPanel.classList.add("hidden");
          mainInterface.classList.remove("hidden"); 
        }
    });
  }

  // Done button
  const doneBtn = $(".done");
  if (doneBtn) {
    doneBtn.addEventListener("click", () => {
      log("Done clicked");
      showPanel("main-interface");
    });
  }

  // Detection button
  const submitBtn = $("#submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      log("Submit clicked. Current stage:", currentStage);

      if (currentStage === "preview") {
        setStage("analyzing");

        setTimeout(() => {
          setStage("result");
          renderChart(["Word1", "Word2", "Word3"], [10, 20, -15]);
        }, 2000);
      } else if (currentStage === "result") {
        setStage("select");
      }
    });
  }

  // Initial stage
  setStage("select");
});


