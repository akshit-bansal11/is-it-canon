(() => {
  const root = document.documentElement;
  try {
    const stored = localStorage.getItem("isitcanon/theme/v1");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme =
      stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
  } catch {
    root.dataset.theme = "dark";
  }
})();
