/* Unicode 转义：中文与 \uXXXX 互转，支持 emoji 代理对与十六进制大小写。 */
(function () {
  const ESCAPE_PATTERN = /\\u\{[0-9a-fA-F]{1,6}\}|\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}/;

  function formatUnit(code, upper) {
    const hex = code.toString(16).padStart(4, "0");
    return `\\u${upper ? hex.toUpperCase() : hex.toLowerCase()}`;
  }

  function escapeUnicode(text, upper, nonAsciiOnly) {
    let output = "";
    for (const char of text) {
      const code = char.codePointAt(0);
      if (nonAsciiOnly && code < 0x80) {
        output += char;
        continue;
      }

      if (code <= 0xffff) {
        output += formatUnit(code, upper);
      } else {
        const offset = code - 0x10000;
        output += formatUnit(0xd800 + (offset >> 10), upper);
        output += formatUnit(0xdc00 + (offset & 0x3ff), upper);
      }
    }
    return output;
  }

  function countEscapes(text) {
    return text.match(new RegExp(ESCAPE_PATTERN.source, "g")) || [];
  }

  function unescapeUnicode(text) {
    return text.replace(
      /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g,
      (match, codePoint, unit, byte) => {
        if (codePoint) return String.fromCodePoint(parseInt(codePoint, 16));
        if (unit) return String.fromCharCode(parseInt(unit, 16));
        return String.fromCharCode(parseInt(byte, 16));
      }
    );
  }

  function resolveMode(raw, selected) {
    if (selected === "escape" || selected === "unescape") return selected;
    return countEscapes(raw).length > 0 ? "unescape" : "escape";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { escapeUnicode, unescapeUnicode, countEscapes, resolveMode };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const modeSelect = document.getElementById("mode");
  const upper = document.getElementById("upper");
  const nonAsciiOnly = document.getElementById("non-ascii-only");
  const SAMPLE = "你好，世界 🌍 hello";

  const tool = mountTool({
    live: true,
    delay: 120,
    sample: SAMPLE,
    onClear() {
      modeSelect.value = "auto";
      upper.checked = false;
      nonAsciiOnly.checked = true;
    },
    transform(raw) {
      const mode = resolveMode(raw, modeSelect.value);

      if (mode === "unescape") {
        const count = countEscapes(raw).length;
        if (!count) {
          return {
            text: raw,
            status: "未找到 \\uXXXX 或 \\xXX 转义序列",
            tone: "muted"
          };
        }
        const text = unescapeUnicode(raw);
        return { text, status: `还原完成，处理 ${count} 处转义，${raw.length} → ${text.length} 字符` };
      }

      const text = escapeUnicode(raw, upper.checked, nonAsciiOnly.checked);
      return {
        text,
        status: `转义完成，${raw.length} → ${text.length} 字符${nonAsciiOnly.checked ? "（ASCII 保持不变）" : ""}`
      };
    }
  });

  [modeSelect, upper, nonAsciiOnly].forEach((element) => {
    element.addEventListener("change", () => tool.run());
  });
})();
