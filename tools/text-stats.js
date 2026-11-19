/* 文本统计：字符、中文、英文单词、行、段落、UTF-8 字节与重复行。 */
(function () {
  function preview(text, limit) {
    const chars = Array.from(text);
    return chars.length > limit ? `${chars.slice(0, limit).join("")}…` : text;
  }

  function analyzeText(text) {
    const chars = Array.from(text);
    const lines = text ? text.replace(/\n$/, "").split("\n") : [];
    const nonEmptyLines = lines.filter((line) => line.trim() !== "");
    const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim() !== "");
    const chinese = text.match(/[\u4e00-\u9fff]/g) || [];
    const words = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
    const counts = new Map();

    for (const line of nonEmptyLines) {
      counts.set(line, (counts.get(line) || 0) + 1);
    }

    const duplicates = Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, 10);

    const longest = lines.reduce((max, line) => {
      const length = Array.from(line).length;
      return length > max.length ? { length, line } : max;
    }, { length: 0, line: "" });

    return {
      characters: chars.length,
      charactersNoSpace: Array.from(text.replace(/\s+/g, "")).length,
      chinese: chinese.length,
      words: words.length,
      lines: lines.length,
      nonEmptyLines: nonEmptyLines.length,
      paragraphs: paragraphs.length,
      bytes: new TextEncoder().encode(text).length,
      longest,
      duplicates
    };
  }

  function formatStats(stats) {
    const rows = [
      ["字符数（含空白）", stats.characters],
      ["字符数（不含空白）", stats.charactersNoSpace],
      ["中文字符", stats.chinese],
      ["英文单词", stats.words],
      ["行数", `${stats.lines}（非空 ${stats.nonEmptyLines}）`],
      ["段落数", stats.paragraphs],
      ["UTF-8 字节", stats.bytes],
      [
        "最长行",
        stats.longest.length ? `${stats.longest.length} 字符：${preview(stats.longest.line, 60)}` : "0 字符"
      ]
    ];

    const report = rows.map(([label, value]) => `${label}：${value}`);
    report.push("", "重复行 Top 10");

    if (!stats.duplicates.length) {
      report.push("  无");
    } else {
      stats.duplicates.forEach(([line, count]) => {
        report.push(`  ${count} 次  ${preview(line, 60)}`);
      });
    }

    return report.join("\n");
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { analyzeText, formatStats, preview };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const SAMPLE = "Build small, make it real.\n构建小东西，让它真实可用。\n\nThe best projects start as tiny loops.\n构建小东西，让它真实可用。\n";

  mountTool({
    live: true,
    delay: 120,
    sample: SAMPLE,
    transform(raw) {
      const stats = analyzeText(raw);
      return {
        text: formatStats(stats),
        status: `统计完成：${stats.characters} 字符 / ${stats.lines} 行 / ${stats.bytes} 字节`
      };
    }
  });
})();
