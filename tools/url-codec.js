/* URL 编解码：支持 encodeURIComponent、encodeURI 与解码，按行批量处理。 */
(function () {
  const OPERATIONS = {
    component: encodeURIComponent,
    uri: encodeURI,
    decode: decodeURIComponent
  };

  function convertUrl(text, mode, perLine) {
    const operation = OPERATIONS[mode];
    if (!operation) throw new Error("未知的转换方式");

    if (!perLine) {
      try {
        return { text: operation(text), failed: 0 };
      } catch (error) {
        return { text, failed: 1 };
      }
    }

    let failed = 0;
    const output = text.split("\n").map((line) => {
      if (!line) return line;
      try {
        return operation(line);
      } catch (error) {
        failed += 1;
        return line;
      }
    });

    return { text: output.join("\n"), failed };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { convertUrl };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const modeSelect = document.getElementById("mode");
  const perLine = document.getElementById("per-line");
  const SAMPLE = "https://example.com/搜索?q=hello world&lang=中文";

  const tool = mountTool({
    live: true,
    delay: 120,
    sample: SAMPLE,
    onClear() {
      modeSelect.value = "component";
      perLine.checked = true;
    },
    transform(raw) {
      const { text, failed } = convertUrl(raw, modeSelect.value, perLine.checked);
      const label = { component: "组件编码", uri: "整段编码", decode: "解码" }[modeSelect.value];

      if (failed) {
        const message =
          failed === raw.split("\n").filter(Boolean).length
            ? `${label}失败，请检查百分号或转义是否完整`
            : `${label}完成，${failed} 行无法处理，已保留原内容`;
        return { text, status: message, tone: failed === raw.split("\n").filter(Boolean).length ? "error" : "muted" };
      }

      return { text, status: `${label}完成，${raw.length} → ${text.length} 字符` };
    }
  });

  modeSelect.addEventListener("change", () => tool.run());
  perLine.addEventListener("change", () => tool.run());
})();
