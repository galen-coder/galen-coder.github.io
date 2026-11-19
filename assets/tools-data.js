/* 工具清单：主页与工具集页面共用。README 表格由 scripts/sync-tools.mjs 生成。 */
window.TOOLS_DATA = {
  categories: [
    { id: "format", name: "格式化", en: "Format" },
    { id: "encoding", name: "编码转换", en: "Encoding" },
    { id: "convert", name: "数据转换", en: "Convert" },
    { id: "text", name: "文本处理", en: "Text" }
  ],
  tools: [
    {
      id: "json-format",
      name: "JSON 格式化",
      category: "format",
      description: "美化、压缩与校验 JSON",
      path: "tools/json-format.html",
      status: "live",
      keywords: ["json", "format", "beautify", "minify", "格式化", "压缩", "校验"]
    },
    {
      id: "html-format",
      name: "HTML 格式化",
      category: "format",
      description: "标签缩进与属性换行",
      path: null,
      status: "planned",
      keywords: ["html", "format", "indent", "标签", "缩进"]
    },
    {
      id: "base64",
      name: "Base64 编解码",
      category: "encoding",
      description: "文本与文件互转，支持 URL 安全模式",
      path: "tools/base64.html",
      status: "live",
      keywords: ["base64", "encode", "decode", "编码", "解码", "文件"]
    },
    {
      id: "url-codec",
      name: "URL 编解码",
      category: "encoding",
      description: "encodeURIComponent 与 encodeURI 互转",
      path: "tools/url-codec.html",
      status: "live",
      keywords: ["url", "uri", "encode", "decode", "编码", "解码", "链接"]
    },
    {
      id: "unicode-escape",
      name: "Unicode 转义",
      category: "encoding",
      description: "中文与 \\uXXXX 互转，支持 emoji",
      path: "tools/unicode-escape.html",
      status: "live",
      keywords: ["unicode", "escape", "转义", "中文", "emoji", "代理对"]
    },
    {
      id: "hash",
      name: "哈希计算",
      category: "encoding",
      description: "MD5、SHA-1、SHA-256/384/512",
      path: "tools/hash.html",
      status: "live",
      keywords: ["hash", "md5", "sha1", "sha256", "摘要", "校验", "文件"]
    },
    {
      id: "langgraph-history",
      name: "LangGraph 历史解析",
      category: "convert",
      description: "拆解 get_state_history 快照",
      path: "tools/langgraph-history.html",
      status: "live",
      keywords: ["langgraph", "state", "history", "快照", "解析"]
    },
    {
      id: "json-yaml",
      name: "JSON / YAML 互转",
      category: "convert",
      description: "结构化数据格式互换",
      path: null,
      status: "planned",
      keywords: ["json", "yaml", "yml", "转换"]
    },
    {
      id: "csv-json",
      name: "CSV 转 JSON",
      category: "convert",
      description: "表格数据转数组对象",
      path: null,
      status: "planned",
      keywords: ["csv", "json", "表格", "转换"]
    },
    {
      id: "timestamp",
      name: "时间戳转换",
      category: "convert",
      description: "Unix 时间戳与日期互转",
      path: "tools/timestamp.html",
      status: "live",
      keywords: ["timestamp", "unix", "date", "时间", "日期", "时区"]
    },
    {
      id: "case-convert",
      name: "大小写转换",
      category: "text",
      description: "驼峰、下划线、短横线与常量命名",
      path: "tools/case-convert.html",
      status: "live",
      keywords: ["case", "camel", "snake", "kebab", "大小写", "驼峰", "命名"]
    },
    {
      id: "line-tools",
      name: "行处理",
      category: "text",
      description: "按行去重、排序、反转与编号",
      path: "tools/line-tools.html",
      status: "live",
      keywords: ["line", "dedupe", "sort", "unique", "去重", "排序", "反转", "行"]
    },
    {
      id: "text-stats",
      name: "文本统计",
      category: "text",
      description: "字符、单词、行数与重复行分析",
      path: "tools/text-stats.html",
      status: "live",
      keywords: ["count", "stats", "word", "统计", "字数", "单词", "行数"]
    }
  ]
};
