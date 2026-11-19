/* 时间戳转换：自动识别秒级/毫秒级时间戳与日期字符串，输出多时区结果。 */
(function () {
  function parseTimestamp(input) {
    const value = input.trim();
    if (!value) {
      throw new Error("请输入时间戳或日期");
    }

    if (/^-?\d+$/.test(value)) {
      const digits = value.replace("-", "").length;
      if (digits === 10) {
        return { ms: Number(value) * 1000, kind: "10 位秒级" };
      }
      if (digits === 13) {
        return { ms: Number(value), kind: "13 位毫秒级" };
      }
      if (digits <= 10) {
        return { ms: Number(value) * 1000, kind: `${digits} 位，按秒处理` };
      }
      return { ms: Number(value), kind: `${digits} 位，按毫秒处理` };
    }

    const ms = Date.parse(value);
    if (Number.isNaN(ms)) {
      throw new Error("无法识别的时间格式，请使用时间戳或常见日期写法");
    }
    return { ms, kind: "日期字符串" };
  }

  function formatInZone(date, timeZone) {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
      .format(date)
      .replace(/\//g, "-");
  }

  function localZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "本地时区";
    } catch (error) {
      return "本地时区";
    }
  }

  function formatReport(input) {
    const { ms, kind } = parseTimestamp(input);
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new Error("时间戳超出可表示范围");
    }

    const zones = [
      { label: "本地", zone: localZone() },
      { label: "UTC", zone: "UTC" },
      { label: "上海", zone: "Asia/Shanghai" },
      { label: "纽约", zone: "America/New_York" }
    ];
    const seen = new Set();
    const lines = [];

    lines.push(`输入：${input.trim()}（${kind}）`);
    lines.push(`秒级：${Math.floor(ms / 1000)}`);
    lines.push(`毫秒级：${ms}`);
    lines.push(`ISO：${date.toISOString()}`);
    lines.push("");

    for (const { label, zone } of zones) {
      if (seen.has(zone)) continue;
      seen.add(zone);
      lines.push(`${label}（${zone}）：${formatInZone(date, zone)}`);
    }

    return lines.join("\n");
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseTimestamp, formatReport, formatInZone };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const nowButton = document.getElementById("now");
  const SAMPLE = "1700000000";

  const tool = mountTool({
    sample: SAMPLE,
    transform(raw) {
      const report = formatReport(raw);
      const { ms } = parseTimestamp(raw);
      return { text: report, status: `转换完成：${new Date(ms).toISOString()}` };
    }
  });

  nowButton.addEventListener("click", () => {
    tool.input.value = String(Date.now());
    tool.refreshInputStats();
    tool.run();
  });
})();
