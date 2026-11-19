/* 大小写转换：大小写、句首、标题格式与常见命名风格。 */
(function () {
  const LABELS = {
    camel: "camelCase",
    pascal: "PascalCase",
    snake: "snake_case",
    kebab: "kebab-case",
    constant: "CONSTANT_CASE",
    upper: "全部大写",
    lower: "全部小写",
    sentence: "句首大写",
    title: "每词首字母大写"
  };

  function splitWords(text) {
    const words = text
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .split(/[^A-Za-z0-9\u4e00-\u9fff]+/)
      .filter(Boolean);
    return words.map((word) => word.toLowerCase());
  }

  function capitalize(word) {
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }

  function convertWordStyle(text, mode) {
    const words = splitWords(text);
    if (!words.length) return text;

    switch (mode) {
      case "camel":
        return words[0] + words.slice(1).map(capitalize).join("");
      case "pascal":
        return words.map(capitalize).join("");
      case "snake":
        return words.join("_");
      case "kebab":
        return words.join("-");
      case "constant":
        return words.join("_").toUpperCase();
      default:
        return text;
    }
  }

  function convertLine(line, mode) {
    switch (mode) {
      case "upper":
        return line.toUpperCase();
      case "lower":
        return line.toLowerCase();
      case "sentence":
        return line
          .toLowerCase()
          .replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, prefix, char) => prefix + char.toUpperCase());
      case "title":
        return line.toLowerCase().replace(/\b[a-z]/g, (char) => char.toUpperCase());
      default:
        return convertWordStyle(line, mode);
    }
  }

  function convertCase(text, mode) {
    if (!LABELS[mode]) throw new Error("未知的转换方式");
    return text
      .split("\n")
      .map((line) => (line ? convertLine(line, mode) : line))
      .join("\n");
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { convertCase, convertLine, splitWords, LABELS };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const modeSelect = document.getElementById("mode");
  const SAMPLE = "hello world\nfoo-bar_baz\nuserName";

  const tool = mountTool({
    live: true,
    delay: 120,
    sample: SAMPLE,
    onClear() {
      modeSelect.value = "camel";
    },
    transform(raw) {
      const text = convertCase(raw, modeSelect.value);
      return {
        text,
        status: `已转换为 ${LABELS[modeSelect.value]}，${raw.split("\n").length} 行`
      };
    }
  });

  modeSelect.addEventListener("change", () => tool.run());
})();
