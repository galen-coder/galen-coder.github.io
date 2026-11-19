# galen-coder.github.io

Galen Coder 的 GitHub Pages 站点，提供一组纯浏览器运行的文本处理工具，数据不上传服务器。

在线地址：<https://galen-coder.github.io/>

## 工具分类

### 格式化

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| [JSON 格式化](https://galen-coder.github.io/tools/json-format.html) | 美化、压缩、校验 JSON，支持 2/4 空格与 Tab 缩进 | 已实现 |
| HTML 格式化 | 标签缩进与属性换行 | 计划中 |

### 编码转换

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| Base64 编解码 | 文本与 Base64 互转，支持 URL 安全模式 | 计划中 |
| URL 编解码 | encodeURIComponent / decodeURIComponent | 计划中 |
| Unicode 转义 | 中文与 `\uXXXX` 互转 | 计划中 |

### 数据转换

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| [LangGraph 历史解析](https://galen-coder.github.io/tools/langgraph-history.html) | 解析 `get_state_history` 的 StateSnapshot / PregelTask / Interrupt 结构 | 已实现 |
| JSON / YAML 互转 | JSON 与 YAML 结构互转 | 计划中 |
| CSV 转 JSON | 表格数据转数组对象 | 计划中 |
| 时间戳转换 | Unix 时间戳与日期互转 | 计划中 |

### 文本处理

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| 大小写转换 | 全大写、全小写、驼峰、短横线命名 | 计划中 |
| 行去重排序 | 按行去重、排序、反转 | 计划中 |
| 文本统计 | 字符数、单词数、行数统计 | 计划中 |

## 目录结构

```text
.
├── index.html                 # 主页与工具入口
├── styles.css                 # 全站样式
├── script.js                  # 主页交互
├── tools/
│   ├── json-format.html       # JSON 格式化工具
│   ├── json-format.js
│   ├── langgraph-history.html # LangGraph 历史解析工具
│   └── langgraph-history.js
├── assets/
└── favicon.svg
```

## 本地预览

```bash
python3 -m http.server 8000
```

打开 <http://localhost:8000/>。

## 发布

站点通过 GitHub Pages 从 `main` 分支根目录发布，推送到 `main` 后自动构建。
