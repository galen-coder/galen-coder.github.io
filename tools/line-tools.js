/* 行处理：去空行、去重、排序、反转、打乱、行号与前后缀。 */
(function () {
  const COLLATOR = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

  function shuffle(lines) {
    const result = lines.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }

  function countLines(text) {
    return text ? text.replace(/\n$/, "").split("\n").length : 0;
  }

  function processLines(text, options) {
    let lines = text.split("\n");

    if (options.removeEmpty) {
      lines = lines.filter((line) => line.trim() !== "");
    }
    if (options.dedupe) {
      lines = Array.from(new Set(lines));
    }
    if (options.sort === "asc" || options.sort === "desc") {
      lines.sort(COLLATOR.compare);
      if (options.sort === "desc") lines.reverse();
    }
    if (options.reverse) {
      lines.reverse();
    }
    if (options.shuffle) {
      lines = shuffle(lines);
    }
    if (options.number) {
      lines = lines.map((line, index) => `${index + 1}. ${line}`);
    }
    if (options.prefix || options.suffix) {
      lines = lines.map((line) => `${options.prefix || ""}${line}${options.suffix || ""}`);
    }

    return {
      text: lines.join("\n"),
      inputCount: countLines(text),
      outputCount: lines.length
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { processLines, shuffle, countLines };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const controls = {
    removeEmpty: document.getElementById("remove-empty"),
    dedupe: document.getElementById("dedupe"),
    sort: document.getElementById("sort"),
    reverse: document.getElementById("reverse"),
    shuffle: document.getElementById("shuffle"),
    number: document.getElementById("number"),
    prefix: document.getElementById("prefix"),
    suffix: document.getElementById("suffix")
  };
  const optionElements = Object.values(controls);
  const SAMPLE = "banana\napple\n\nbanana\nCherry\napple\n";

  const tool = mountTool({
    live: true,
    delay: 120,
    sample: SAMPLE,
    onClear() {
      controls.removeEmpty.checked = true;
      controls.dedupe.checked = true;
      controls.sort.value = "none";
      controls.reverse.checked = false;
      controls.shuffle.checked = false;
      controls.number.checked = false;
      controls.prefix.value = "";
      controls.suffix.value = "";
    },
    transform(raw) {
      const result = processLines(raw, {
        removeEmpty: controls.removeEmpty.checked,
        dedupe: controls.dedupe.checked,
        sort: controls.sort.value,
        reverse: controls.reverse.checked,
        shuffle: controls.shuffle.checked,
        number: controls.number.checked,
        prefix: controls.prefix.value,
        suffix: controls.suffix.value
      });

      return {
        text: result.text,
        status: `处理完成：输入 ${result.inputCount} 行 → 输出 ${result.outputCount} 行`
      };
    }
  });

  optionElements.forEach((element) => {
    element.addEventListener("change", () => tool.run());
    if (element.type === "text") {
      element.addEventListener("input", () => {
        clearTimeout(element._timer);
        element._timer = setTimeout(() => tool.run(), 240);
      });
    }
  });
})();
