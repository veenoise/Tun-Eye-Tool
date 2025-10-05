document.addEventListener("DOMContentLoaded", () => {
  console.log("settings.js loaded");

  // Get checkbox elements (exist in both popup and full page settings)
  const enableExtension = document.getElementById("enable-extension");
  const enableRecord = document.getElementById("enable-record");
  const enableInstructionsOnStartup = document.getElementById("enable-instructionOnStartup");

  // Panels popup.html
  const helpPanel = document.getElementById("help-panel");
  const mainInterface = document.getElementById("main-interface");
  const settingsPanel = document.getElementById("settings-panel");

  // Load saved settings from chrome.storage.local (changed from .sync)
  storage.local.get(["enableExtension", "enableRecord", "enableInstructionsOnStartup"], (data) => {
    console.log("Loaded settings:", data);

    if (enableExtension) {
      enableExtension.checked = data.enableExtension ?? true; // default ON
    }
    if (enableRecord) {
      enableRecord.checked = data.enableRecord ?? false; // default OFF
    }
    if (enableInstructionsOnStartup) {
      enableInstructionsOnStartup.checked = data.enableInstructionsOnStartup ?? true; // default ON
    }

    if (helpPanel && mainInterface && settingsPanel) {
      if (data.enableInstructionsOnStartup) {
        // Show help panel on startup
        helpPanel.classList.remove("hidden");
        mainInterface.classList.add("hidden");
        settingsPanel.classList.add("hidden");
      } else {
        // Show main interface on startup (default)
        helpPanel?.classList.add("hidden");
        settingsPanel?.classList.add("hidden");
        mainInterface?.classList.remove("hidden");
      }
    };

  // Save "Enable Extension"
  if (enableExtension) {
    enableExtension.addEventListener("change", (e) => {
      const checked = e.target.checked;
      storage.local.set({ enableExtension: checked }, () => {
        console.log("Enable Extension saved:", checked);
      });
    });
  }

  // Save "Record User scans"
  if (enableRecord) {
    enableRecord.addEventListener("change", (e) => {
      const checked = e.target.checked;
      storage.local.set({ enableRecord: checked }, () => {
        console.log("Record User scans saved:", checked);
      });
    });
  }

  // Save "Show instructions on startup"
  if (enableInstructionsOnStartup) {
    enableInstructionsOnStartup.addEventListener("change", (e) => {
      const checked = e.target.checked;
      storage.local.set({ enableInstructionsOnStartup: checked }, () => {
        console.log("Instructions on Startup:", checked);
      });
    });
  }
})
});

