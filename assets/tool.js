/* 工具页共享函数。以全局对象挂载，保证 file:// 直接打开也可用。 */
(function () {
  function describeText(text) {
    return text ? `${text.split("\n").length} 行 / ${text.length} 字符` : "";
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-1000px";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) {
      throw new Error("复制失败");
    }
  }

  function onModEnter(element, handler) {
    element.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handler(event);
      }
    });
  }

  /**
   * 绑定标准工具页：输入框、输出区、按钮与状态条。
   * options.transform(rawText) 返回字符串或 { text, status, tone }，可返回 Promise。
   * options.live 为 true 时输入会自动执行（带防抖）。
   */
  function mountTool(options) {
    options = options || {};
    const input = document.getElementById(options.inputId || "tool-input");
    const output = document.getElementById(options.outputId || "tool-output");
    const statusEl = document.getElementById("status");
    const inputStatsEl = document.getElementById("input-stats");
    const outputStatsEl = document.getElementById("output-stats");
    const runButton = document.getElementById("run");
    const sampleButton = document.getElementById("sample");
    const clearButton = document.getElementById("clear");
    const copyButton = document.getElementById("copy");
    const idleHint = options.idleHint || "等待输入。按 Cmd/Ctrl + Enter 执行。";

    let timer = 0;
    let version = 0;

    function setStatus(message, tone) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || "ok";
    }

    function refreshInputStats() {
      if (inputStatsEl) {
        inputStatsEl.textContent = describeText(input.value) || "0 字符";
      }
    }

    function writeOutput(text) {
      output.textContent = text || "";
      if (outputStatsEl) {
        outputStatsEl.textContent = describeText(text);
      }
    }

    async function run() {
      const current = ++version;
      const raw = input ? input.value : "";

      if (!raw) {
        writeOutput("");
        setStatus(options.emptyHint || idleHint, "muted");
        return;
      }

      try {
        const result = await options.transform(raw);
        if (current !== version) return;
        writeOutput(typeof result === "string" ? result : result.text);
        if (typeof result === "string") {
          setStatus(options.doneHint || "完成");
        } else {
          setStatus(result.status || options.doneHint || "完成", result.tone);
        }
      } catch (error) {
        if (current !== version) return;
        writeOutput("");
        setStatus(error instanceof Error ? error.message : String(error), "error");
      }
    }

    function scheduleRun() {
      clearTimeout(timer);
      timer = setTimeout(run, options.delay || 180);
    }

    if (input) {
      input.addEventListener("input", () => {
        refreshInputStats();
        if (options.live) scheduleRun();
      });
      onModEnter(input, run);
    }

    if (runButton) runButton.addEventListener("click", run);

    if (sampleButton && options.sample) {
      sampleButton.addEventListener("click", () => {
        input.value = options.sample;
        refreshInputStats();
        run();
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        input.value = "";
        clearTimeout(timer);
        version += 1;
        writeOutput("");
        refreshInputStats();
        setStatus(options.clearedHint || "已清空", "muted");
        input.focus();
        if (options.onClear) options.onClear();
      });
    }

    if (copyButton) {
      copyButton.addEventListener("click", async () => {
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
      });
    }

    refreshInputStats();
    if (options.live && input && input.value) {
      run();
    }

    return { run, refreshInputStats, setStatus, writeOutput, input, output };
  }

  window.ToolKit = { describeText, copyText, onModEnter, mountTool };
})();
