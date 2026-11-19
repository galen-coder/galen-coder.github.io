#!/usr/bin/env node
/* 纯函数冒烟测试：直接加载 tools/*.js 导出的函数，不依赖浏览器。 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const base64 = require("../tools/base64.js");
const urlCodec = require("../tools/url-codec.js");
const unicode = require("../tools/unicode-escape.js");
const hash = require("../tools/hash.js");
const timestamp = require("../tools/timestamp.js");
const lineTools = require("../tools/line-tools.js");
const textStats = require("../tools/text-stats.js");
const caseConvert = require("../tools/case-convert.js");

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  if (actual === expected) {
    passed += 1;
    return;
  }
  failures.push(`${name}\n  期望: ${JSON.stringify(expected)}\n  实际: ${JSON.stringify(actual)}`);
}

check("base64 编码中文", base64.encodeBase64("你好"), "5L2g5aW9");
check("base64 解码中文", base64.decodeBase64("5L2g5aW9"), "你好");
check("base64 URL 安全编码", base64.encodeBase64("??>>", true), "Pz8-Pg");
check("base64 无填充解码", base64.decodeBase64("5L2g5aW9"), "你好");
check("base64 自动识别", base64.resolveMode("5L2g5aW9", "auto"), "decode");
check("base64 普通文本走编码", base64.resolveMode("hello world", "auto"), "encode");

check("URL 组件编码", urlCodec.convertUrl("a b/c", "component", false).text, "a%20b%2Fc");
check(
  "URL 解码",
  urlCodec.convertUrl("%E4%BD%A0%E5%A5%BD", "decode", false).text,
  "你好"
);
check(
  "URL 按行保留错误行",
  urlCodec.convertUrl("ok\n%ZZ", "decode", true).text,
  "ok\n%ZZ"
);
check("URL 错误行计数", urlCodec.convertUrl("ok\n%ZZ", "decode", true).failed, 1);

check("Unicode 转义中文", unicode.escapeUnicode("中", false, true), "\\u4e2d");
check("Unicode 大写", unicode.escapeUnicode("中", true, true), "\\u4E2D");
check("Unicode emoji 代理对", unicode.escapeUnicode("🌍", false, true), "\\ud83c\\udf0d");
check("Unicode 还原中文", unicode.unescapeUnicode("\\u4e2d"), "中");
check("Unicode 还原 emoji", unicode.unescapeUnicode("\\ud83c\\udf0d"), "🌍");
check("Unicode 自动识别", unicode.resolveMode("\\u4e2d", "auto"), "unescape");

check("MD5('abc')", hash.md5Hex("abc"), "900150983cd24fb0d6963f7d28e17f72");
check("MD5('')", hash.md5Hex(""), "d41d8cd98f00b204e9800998ecf8427e");
check(
  "MD5 长句",
  hash.md5Hex("The quick brown fox jumps over the lazy dog"),
  "9e107d9d372bb6826bd81d3542a419d6"
);

check("时间戳 10 位", timestamp.parseTimestamp("1700000000").ms, 1700000000000);
check("时间戳 13 位", timestamp.parseTimestamp("1700000000000").ms, 1700000000000);
check(
  "时间戳报告含上海时区",
  timestamp.formatReport("1700000000").includes("Asia/Shanghai"),
  true
);

const lines = lineTools.processLines("b\na\n\nb\n", {
  removeEmpty: true,
  dedupe: true,
  sort: "asc",
  reverse: false,
  shuffle: false,
  number: false,
  prefix: "",
  suffix: ""
});
check("行处理去重排序", lines.text, "a\nb");
check("行处理输出行数", lines.outputCount, 2);

const numbered = lineTools.processLines("a\nb", {
  removeEmpty: true,
  dedupe: false,
  sort: "none",
  reverse: false,
  shuffle: false,
  number: true,
  prefix: "- ",
  suffix: ""
});
check("行处理行号与前缀", numbered.text, "- 1. a\n- 2. b");

const stats = textStats.analyzeText("你好\nhello");
check("统计字符数", stats.characters, 8);
check("统计中文字符", stats.chinese, 2);
check("统计英文单词", stats.words, 1);
check("统计行数", stats.lines, 2);
check("统计 UTF-8 字节", stats.bytes, 12);

check("拆分命名", caseConvert.splitWords("userName").join(","), "user,name");
check("camelCase", caseConvert.convertCase("foo bar", "camel"), "fooBar");
check("PascalCase", caseConvert.convertCase("foo bar", "pascal"), "FooBar");
check("snake_case", caseConvert.convertCase("fooBar", "snake"), "foo_bar");
check("kebab-case", caseConvert.convertCase("fooBar", "kebab"), "foo-bar");
check("CONSTANT_CASE", caseConvert.convertCase("foo bar", "constant"), "FOO_BAR");
check("全部大写", caseConvert.convertCase("abc", "upper"), "ABC");
check("句首大写", caseConvert.convertCase("hello world", "sentence"), "Hello world");
check("每词首字母大写", caseConvert.convertCase("hello world", "title"), "Hello World");

console.log(`通过 ${passed} 项`);
if (failures.length) {
  console.error(`失败 ${failures.length} 项：\n${failures.join("\n\n")}`);
  process.exit(1);
}
console.log("全部断言通过");
