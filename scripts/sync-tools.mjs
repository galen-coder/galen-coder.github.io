#!/usr/bin/env node
/* 根据 assets/tools-data.js 重写 README 中 <!-- tools:start --> 与 <!-- tools:end --> 之间的工具表。 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "assets/tools-data.js");
const readmePath = path.join(root, "README.md");
const baseUrl = "https://galen-coder.github.io/";

const source = await readFile(dataPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: dataPath });
const data = sandbox.window.TOOLS_DATA;

if (!data || !Array.isArray(data.tools)) {
  throw new Error("assets/tools-data.js 未导出有效的 TOOLS_DATA");
}

function tableFor(category) {
  const rows = data.tools
    .filter((tool) => tool.category === category.id)
    .map((tool) => {
      const name =
        tool.status === "live" && tool.path ? `[${tool.name}](${baseUrl}${tool.path})` : tool.name;
      const state = tool.status === "live" ? "已实现" : "计划中";
      return `| ${name} | ${tool.description} | ${state} |`;
    });

  return `### ${category.name}\n\n| 工具 | 说明 | 状态 |\n| --- | --- | --- |\n${rows.join("\n")}`;
}

const block = ["<!-- tools:start -->", ...data.categories.map(tableFor), "<!-- tools:end -->"].join(
  "\n\n"
);

const readme = await readFile(readmePath, "utf8");
const pattern = /<!-- tools:start -->[\s\S]*?<!-- tools:end -->/;
if (!pattern.test(readme)) {
  throw new Error("README.md 缺少 <!-- tools:start --> / <!-- tools:end --> 标记");
}

const next = readme.replace(pattern, block);
if (next === readme) {
  console.log("README 工具表已是最新");
} else {
  await writeFile(readmePath, next);
  console.log("已更新 README 工具表");
}
