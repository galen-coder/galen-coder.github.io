# galen-coder.github.io

Galen Coder 的 GitHub Pages 站点，提供一组纯浏览器运行的文本处理工具，数据不上传服务器。

在线地址：<https://galen-coder.github.io/>

## 工具分类

<!-- tools:start -->

### 格式化

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| [JSON 格式化](https://galen-coder.github.io/tools/json-format.html) | 美化、压缩与校验 JSON | 已实现 |
| HTML 格式化 | 标签缩进与属性换行 | 计划中 |

### 编码转换

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| [Base64 编解码](https://galen-coder.github.io/tools/base64.html) | 文本与文件互转，支持 URL 安全模式 | 已实现 |
| [URL 编解码](https://galen-coder.github.io/tools/url-codec.html) | encodeURIComponent 与 encodeURI 互转 | 已实现 |
| [Unicode 转义](https://galen-coder.github.io/tools/unicode-escape.html) | 中文与 \uXXXX 互转，支持 emoji | 已实现 |
| [哈希计算](https://galen-coder.github.io/tools/hash.html) | MD5、SHA-1、SHA-256/384/512 | 已实现 |

### 数据转换

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| [LangGraph 历史解析](https://galen-coder.github.io/tools/langgraph-history.html) | 拆解 get_state_history 快照 | 已实现 |
| JSON / YAML 互转 | 结构化数据格式互换 | 计划中 |
| CSV 转 JSON | 表格数据转数组对象 | 计划中 |
| [时间戳转换](https://galen-coder.github.io/tools/timestamp.html) | Unix 时间戳与日期互转 | 已实现 |

### 文本处理

| 工具 | 说明 | 状态 |
| --- | --- | --- |
| [大小写转换](https://galen-coder.github.io/tools/case-convert.html) | 驼峰、下划线、短横线与常量命名 | 已实现 |
| [行处理](https://galen-coder.github.io/tools/line-tools.html) | 按行去重、排序、反转与编号 | 已实现 |
| [文本统计](https://galen-coder.github.io/tools/text-stats.html) | 字符、单词、行数与重复行分析 | 已实现 |

<!-- tools:end -->

## 目录结构

```text
.
├── index.html                 # 主页与工具入口
├── styles.css                 # 全站样式
├── script.js                  # 主页交互
├── assets/
│   ├── tools-data.js          # 工具清单数据
│   ├── tools-render.js        # 主页与工具集渲染
│   ├── tool.css               # 工具页共享样式
│   └── tool.js                # 工具页共享函数
├── tools/
│   ├── index.html             # 工具集（搜索与分类筛选）
│   ├── json-format.html       # JSON 格式化
│   ├── json-format.js
│   └── ...                    # 其余工具页与脚本
├── scripts/
│   └── sync-tools.mjs         # 同步 README 工具表
└── favicon.svg
```

修改 `assets/tools-data.js` 后运行 `node scripts/sync-tools.mjs` 更新上方工具表。

## 本地预览

```bash
python3 -m http.server 8000
```

打开 <http://localhost:8000/>。

纯函数冒烟测试：

```bash
node scripts/smoke-test.mjs
```

## 发布

站点通过 GitHub Pages 从 `main` 分支根目录发布，推送到 `main` 后自动构建。
