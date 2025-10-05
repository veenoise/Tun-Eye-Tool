document.addEventListener("DOMContentLoaded", () => {
  console.log("settings.js loaded");

  // Get checkbox elements (exist in both popup and full page settings)
  const enableExtension = document.getElementById("enable-extension");
  const enableRecord = document.getElementById("enable-record");

  // Load saved settings from chrome.storage.local (changed from .sync)
  storage.local.get(["enableExtension", "enableRecord"], (data) => {
    console.log("Loaded settings:", data);

    if (enableExtension) {
      enableExtension.checked = data.enableExtension ?? true; // default ON
    }
    if (enableRecord) {
      enableRecord.checked = data.enableRecord ?? false; // default OFF
    }
  });

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
});