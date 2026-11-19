const input = document.querySelector("#json-input");
const output = document.querySelector("#json-output");
const status = document.querySelector("#status");
const indent = document.querySelector("#indent");
const inputStats = document.querySelector("#input-stats");
const outputStats = document.querySelector("#output-stats");

const { copyText, describeText, onModEnter } = window.ToolKit;

const SAMPLE = {
  name: "galen-coder",
  site: "https://galen-coder.github.io",
  tools: ["json", "base64", "yaml"],
  active: true,
};

function setStatus(message, tone = "ok") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function indentSize() {
  return indent.value === "tab" ? "\t" : Number(indent.value);
}

function updateInputStats() {
  const value = input.value;
  if (!value) {
    inputStats.textContent = "0 字符";
    return;
  }
  inputStats.textContent = describeText(value);
}

function updateOutputStats(text) {
  outputStats.textContent = describeText(text);
}

function describeError(raw, error) {
  const message = error instanceof Error ? error.message : String(error);
  const columnMatch = /line (\d+) column (\d+)/i.exec(message);
  if (columnMatch) {
    return `解析失败：第 ${columnMatch[1]} 行，第 ${columnMatch[2]} 列`;
  }
  const positionMatch = /position (\d+)/i.exec(message);
  if (positionMatch) {
    const index = Math.min(Number(positionMatch[1]), raw.length);
    const before = raw.slice(0, index);
    const line = before.split("\n").length;
    const column = index - before.lastIndexOf("\n");
    return `解析失败：第 ${line} 行，第 ${column} 列`;
  }
  return `解析失败：${message}`;
}

function parseInput() {
  const raw = input.value;
  if (!raw.trim()) {
    throw new Error("请先输入 JSON 内容");
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(describeError(raw, error));
  }
}

function writeOutput(text) {
  output.innerHTML = text ? highlightJSON(text) : "";
  updateOutputStats(text);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightPlain(segment) {
  return escapeHtml(segment).replace(/([{}[\],:])/g, '<span class="tok-punct">$1</span>');
}

function highlightJSON(text) {
  const pattern = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    html += highlightPlain(text.slice(lastIndex, match.index));

    if (match[1] !== undefined) {
      const isKey = match[2] !== undefined;
      html += `<span class="${isKey ? "tok-key" : "tok-string"}">${escapeHtml(match[1])}</span>`;
      if (isKey) {
        html += highlightPlain(match[2]);
      }
    } else if (match[3] !== undefined) {
      html += `<span class="tok-literal">${match[3]}</span>`;
    } else {
      html += `<span class="tok-number">${match[4]}</span>`;
    }

    lastIndex = pattern.lastIndex;
  }

  html += highlightPlain(text.slice(lastIndex));
  return html;
}

function formatJSON() {
  try {
    const data = parseInput();
    writeOutput(JSON.stringify(data, null, indentSize()));
    setStatus("格式化完成");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function minifyJSON() {
  try {
    const data = parseInput();
    const text = JSON.stringify(data);
    writeOutput(text);
    setStatus(`压缩完成，${input.value.length} → ${text.length} 字符`);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function copyOutput() {
  const text = output.textContent;
  if (!text) {
    setStatus("没有可复制的内容", "error");
    return;
  }
  try {
    await copyText(text);
    setStatus("已复制到剪贴板");
  } catch (error) {
    setStatus("复制失败，请手动选择内容复制", "error");
  }
}

document.querySelector("#format").addEventListener("click", formatJSON);
document.querySelector("#minify").addEventListener("click", minifyJSON);
document.querySelector("#copy").addEventListener("click", copyOutput);

document.querySelector("#sample").addEventListener("click", () => {
  input.value = JSON.stringify(SAMPLE);
  updateInputStats();
  formatJSON();
});

document.querySelector("#clear").addEventListener("click", () => {
  input.value = "";
  writeOutput("");
  updateInputStats();
  setStatus("已清空", "muted");
  input.focus();
});

input.addEventListener("input", updateInputStats);

onModEnter(input, formatJSON);

updateInputStats();
