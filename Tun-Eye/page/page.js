// ------------------------------
// Cross-browser compatibility
// ------------------------------
const storage = chrome.storage || browser.storage;

// ------------------------------
// Utility
// ------------------------------
const $ = (sel) => document.querySelector(sel);

function log(...args) {
  console.log("[page.js]", ...args);
}

// ------------------------------
// DOM Elements
// ------------------------------
let textInput;
let uploadArea;
let uploadText;
let startBtn;
let resultContent;
let currentContentType = null;
let currentContentValue = null;

// ------------------------------
// Initialize
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  log("Dashboard loaded");

  // Get elements
  textInput = $(".text-input");
  uploadArea = $(".upload-area");
  uploadText = $(".upload-text");
  startBtn = $(".start-detection");
  resultContent = $(".result-content");

  // Initially disable button
  updateButtonState();

  // Text input handler
  if (textInput) {
    textInput.addEventListener("input", (e) => {
      const text = e.target.value.trim();
      if (text.length > 0) {
        currentContentType = "text";
        currentContentValue = text;
        log("Text content set:", text.substring(0, 50) + "...");
      } else {
        currentContentType = null;
        currentContentValue = null;
      }
      updateButtonState();
    });
  }

  // Image upload handler
  if (uploadArea) {
    uploadArea.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            currentContentType = "image";
            currentContentValue = event.target.result;
            
            // Update upload area to show preview
            uploadArea.innerHTML = `
              <img src="${currentContentValue}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            `;
            
            // Clear text input
            if (textInput) textInput.value = "";
            
            log("Image uploaded");
            updateButtonState();
          };
          reader.readAsDataURL(file);
        }
      });

      input.click();
    });
  }

  // Detection button handler
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      if (!currentContentType || !currentContentValue) {
        log("No content to detect");
        return;
      }

      log("Starting detection...");
      
      // Disable button and show loading
      startBtn.disabled = true;
      startBtn.textContent = "Analyzing...";
      startBtn.style.backgroundColor = "var(--purple)";
      startBtn.style.color = "var(--lightblue)";

      try {
        // Get settings from storage
        const storageData = await new Promise((resolve) => {
          storage.local.get(["enableExtension", "enableRecord"], resolve);
        });

        // Prepare API payload
        const payload = {
          type: currentContentType,
          value: currentContentValue,
          enableExtension: storageData.enableExtension ?? true,
          enableRecord: storageData.enableRecord ?? false,
        };

        log("Sending to API:", { type: payload.type, enableRecord: payload.enableRecord });

        // Call API
        const response = await fetch("http://127.0.0.1:1234/api/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Log": payload.enableRecord,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const output = await response.json();
        log("API response:", output);

        // Display results
        displayResults(output.verdict, output.words);

      } catch (err) {
        log("Error during detection:", err);
        console.error(err);

        // Show error in results
        if (resultContent) {
          resultContent.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #F7BF2D;">
              <p><b>Error:</b> Could not connect to detection service.</p>
              <p style="font-size: 14px;">Make sure the backend is running on http://127.0.0.1:1234</p>
            </div>
          `;
        }
      } finally {
        // Re-enable button
        startBtn.disabled = false;
        startBtn.innerHTML = "<b>Start Detection</b>";
        startBtn.style.backgroundColor = "var(--lightblue)";
        startBtn.style.color = "var(--white)";
      }
    });
  }
});

// ------------------------------
// Update Button State
// ------------------------------
function updateButtonState() {
  if (!startBtn) return;

  if (currentContentType && currentContentValue) {
    startBtn.disabled = false;
    startBtn.style.backgroundColor = "var(--lightblue)";
    startBtn.style.color = "var(--white)";
    startBtn.style.cursor = "pointer";
  } else {
    startBtn.disabled = true;
    startBtn.style.backgroundColor = "var(--purple)";
    startBtn.style.color = "var(--gray)";
    startBtn.style.cursor = "not-allowed";
  }
}

// ------------------------------
// Display Results
// ------------------------------
function displayResults(verdict, words) {
  if (!resultContent) return;

  const verdictColor = verdict === "Fake News" ? "#F7BF2D" : "#035EE6";
  const verdictText = verdict === "Fake News" ? "⚠ Fake News" : "✓ Real News";

  resultContent.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 15px; box-sizing: border-box;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 15px; flex-shrink: 0;">
        <h2 style="color: ${verdictColor}; margin: 0; font-size: 32px;">${verdictText}</h2>
      </div>
      <div style="flex: 1; width: 100%; min-height: 0; position: relative;">
        <canvas id="dashboardChart"></canvas>
      </div>
    </div>
  `;

  // Render chart
  setTimeout(() => {
    renderChart(words);
  }, 100);
}

// ------------------------------
// Render Chart
// ------------------------------
function renderChart(words) {
  const ctx = document.getElementById("dashboardChart");
  if (!ctx) {
    log("Canvas not found");
    return;
  }

  const labels = words.map((item) => item.word);
  const values = words.map((item) => item.weight);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
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
              size: 12,
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
              size: 12,
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
          text: "Fake                  Neutral                  Real",
          font: {
            size: 16,
          },
          padding: {
            top: 10,
            bottom: 20,
          },
          color: "#2D2D51",
        },
      },
    },
  });
}

// Test function for dashboard detection
function testDashboardDetection() {
  const mockText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.";
  
  const mockOutput = {
    verdict: "Fake News",
    words: [
      { word: "conspiracy", weight: -0.85 },
      { word: "hoax", weight: -0.72 },
      { word: "fake", weight: -0.68 },
      { word: "unverified", weight: -0.45 },
      { word: "claim", weight: -0.32 },
      { word: "source", weight: 0.15 },
      { word: "evidence", weight: 0.42 },
      { word: "verified", weight: 0.68 },
      { word: "factual", weight: 0.75 },
      { word: "authentic", weight: 0.88 }
    ]
  };
  
  // Fill textarea
  const textInput = document.querySelector(".text-input");
  if (textInput) {
    textInput.value = mockText;
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Trigger detection with mock data
  setTimeout(() => {
    displayResults(mockOutput.verdict, mockOutput.words);
  }, 500);
  
  console.log("Test executed - mock results should appear in Result panel");
}

// Run test
testDashboardDetection();