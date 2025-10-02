document.addEventListener("DOMContentLoaded", () => {
  const dashBtn = document.getElementById("go-dashboard");
  if (dashBtn) {
    dashBtn.addEventListener("click", () => {
      window.location.href = chrome.runtime.getURL("page/page.html");
    });
  }
});
