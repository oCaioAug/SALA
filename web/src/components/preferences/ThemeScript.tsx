export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem("theme");
        var theme = stored === "light" || stored === "dark" ? stored : "dark";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
