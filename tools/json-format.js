const input = document.querySelector("#json-input");
const output = document.querySelector("#json-output");
const status = document.querySelector("#status");
const indent = document.querySelector("#indent");
const inputStats = document.querySelector("#input-stats");
const outputStats = document.querySelector("#output-stats");

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
  inputStats.textContent = `${value.split("\n").length} 行 / ${value.length} 字符`;
}

function updateOutputStats(text) {
  outputStats.textContent = text ? `${text.split("\n").length} 行 / ${text.length} 字符` : "";
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
  output.textContent = text;
  updateOutputStats(text);
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
    await navigator.clipboard.writeText(text);
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

input.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    formatJSON();
  }
});

updateInputStats();
