const input = document.querySelector("#history-input");
const result = document.querySelector("#result");
const status = document.querySelector("#status");
const formattedOutput = document.querySelector("#formatted-output");
const inputStats = document.querySelector("#input-stats");
const outputStats = document.querySelector("#output-stats");

let selectedId = null;
let drawEdgesRef = null;

const SAMPLE = `[
    StateSnapshot(
        values={'num': 1, 'msg': '加1后：1'},
        next=(),
        config={
            'configurable': {
                'thread_id': 'demo_001',
                'checkpoint_ns': '',
                'checkpoint_id': '1f1e4069-b196-64e0-8001-f134787aa531'
            }
        },
        metadata={'source': 'loop', 'step': 1, 'parents': {}},
        created_at='2026-11-19T10:47:24.826542+00:00',
        parent_config={
            'configurable': {
                'thread_id': 'demo_001',
                'checkpoint_ns': '',
                'checkpoint_id': '1f1e4069-b195-68ec-8000-a902f3959a4b'
            }
        },
        tasks=(),
        interrupts=()
    ),
    StateSnapshot(
        values={'num': 0},
        next=('add_one',),
        config={
            'configurable': {
                'thread_id': 'demo_001',
                'checkpoint_ns': '',
                'checkpoint_id': '1f1e4069-b195-68ec-8000-a902f3959a4b'
            }
        },
        metadata={'source': 'loop', 'step': 0, 'parents': {}},
        created_at='2026-11-19T10:47:24.826235+00:00',
        parent_config={
            'configurable': {
                'thread_id': 'demo_001',
                'checkpoint_ns': '',
                'checkpoint_id': '1f1e4069-b194-6c58-bfff-d816ea8f618b'
            }
        },
        tasks=(
            PregelTask(
                id='e6e772a4-91fb-ad8e-b64b-5692070d83cc',
                name='add_one',
                path=('__pregel_pull', 'add_one'),
                error=None,
                interrupts=(),
                state=None,
                result={'num': 1, 'msg': '加1后：1'}
            ),
        ),
        interrupts=()
    ),
    StateSnapshot(
        values={},
        next=('__start__',),
        config={
            'configurable': {
                'thread_id': 'demo_001',
                'checkpoint_ns': '',
                'checkpoint_id': '1f1e4069-b194-6c58-bfff-d816ea8f618b'
            }
        },
        metadata={'source': 'input', 'step': -1, 'parents': {}},
        created_at='2026-11-19T10:47:24.825912+00:00',
        parent_config=None,
        tasks=(
            PregelTask(
                id='73f468ae-8417-abfc-42f4-9ab69c3754b1',
                name='__start__',
                path=('__pregel_pull', '__start__'),
                error=None,
                interrupts=(),
                state=None,
                result={'num': 0}
            ),
        ),
        interrupts=()
    )
]`;

class ParseError extends Error {
  constructor(message, line, column) {
    super(`${message}（第 ${line} 行，第 ${column} 列）`);
    this.line = line;
    this.column = column;
  }
}

class Parser {
  constructor(source) {
    this.source = source;
    this.pos = 0;
  }

  fail(message) {
    const before = this.source.slice(0, this.pos);
    const line = before.split("\n").length;
    const column = this.pos - before.lastIndexOf("\n");
    throw new ParseError(message, line, column);
  }

  skip() {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.pos += 1;
    }
  }

  parseValue() {
    this.skip();
    const ch = this.source[this.pos];
    if (ch === undefined) {
      this.fail("内容不完整");
    }
    if (ch === "[") {
      return this.parseSequence("list", "]");
    }
    if (ch === "(") {
      return this.parseSequence("tuple", ")");
    }
    if (ch === "{") {
      return this.parseDict();
    }
    if (ch === "'" || ch === '"') {
      return { type: "string", value: this.parseString() };
    }
    if (ch === "-" || ch === "+" || /\d/.test(ch) || (ch === "." && /\d/.test(this.source[this.pos + 1] || ""))) {
      return this.parseNumber();
    }
    if (/[A-Za-z_]/.test(ch)) {
      return this.parseName();
    }
    return this.fail(`无法识别字符 “${ch}”`);
  }

  parseSequence(type, close) {
    this.pos += 1;
    const items = [];
    for (;;) {
      this.skip();
      if (this.source[this.pos] === close) {
        this.pos += 1;
        break;
      }
      if (this.pos >= this.source.length) {
        this.fail(`缺少闭合符号 ${close}`);
      }
      items.push(this.parseValue());
      this.skip();
      if (this.source[this.pos] === ",") {
        this.pos += 1;
        continue;
      }
      if (this.source[this.pos] === close) {
        this.pos += 1;
        break;
      }
      this.fail(`缺少分隔符或闭合符号 ${close}`);
    }
    return { type, items };
  }

  parseDict() {
    this.pos += 1;
    const entries = [];
    for (;;) {
      this.skip();
      if (this.source[this.pos] === "}") {
        this.pos += 1;
        break;
      }
      if (this.pos >= this.source.length) {
        this.fail("缺少闭合符号 }");
      }
      const ch = this.source[this.pos];
      let key;
      if (ch === "'" || ch === '"') {
        key = this.parseString();
      } else if (/[A-Za-z_]/.test(ch)) {
        key = this.readIdentifier();
      } else {
        this.fail("对象的键必须是字符串或标识符");
      }
      this.skip();
      if (this.source[this.pos] !== ":") {
        this.fail("缺少冒号");
      }
      this.pos += 1;
      entries.push({ key, value: this.parseValue() });
      this.skip();
      if (this.source[this.pos] === ",") {
        this.pos += 1;
        continue;
      }
      if (this.source[this.pos] === "}") {
        this.pos += 1;
        break;
      }
      this.fail("缺少分隔符或闭合符号 }");
    }
    return { type: "dict", entries };
  }

  parseString() {
    const quote = this.source[this.pos];
    this.pos += 1;
    let value = "";
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === "\\") {
        const next = this.source[this.pos + 1];
        if (next === "u") {
          const hex = this.source.slice(this.pos + 2, this.pos + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            value += String.fromCharCode(parseInt(hex, 16));
            this.pos += 6;
            continue;
          }
        }
        const escapes = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", 0: "\0", "\\": "\\", "'": "'", '"': '"' };
        value += escapes[next] ?? next;
        this.pos += 2;
        continue;
      }
      if (ch === quote) {
        this.pos += 1;
        return value;
      }
      value += ch;
      this.pos += 1;
    }
    return this.fail("字符串未闭合");
  }

  parseNumber() {
    const match = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(this.source.slice(this.pos));
    if (!match) {
      this.fail("无效的数字");
    }
    this.pos += match[0].length;
    return { type: "number", value: match[0] };
  }

  readIdentifier() {
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.source.slice(this.pos));
    if (!match) {
      this.fail("无效的标识符");
    }
    this.pos += match[0].length;
    return match[0];
  }

  parseName() {
    const name = this.readIdentifier();
    if (name === "None") {
      return { type: "none" };
    }
    if (name === "True" || name === "False") {
      return { type: "bool", value: name === "True" };
    }
    this.skip();
    if (this.source[this.pos] === "(") {
      return this.parseCall(name);
    }
    return { type: "name", value: name };
  }

  parseCall(name) {
    this.pos += 1;
    const args = [];
    const kwargs = {};
    for (;;) {
      this.skip();
      if (this.source[this.pos] === ")") {
        this.pos += 1;
        break;
      }
      if (this.pos >= this.source.length) {
        this.fail("调用缺少闭合括号");
      }
      const kwarg = /^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)/.exec(this.source.slice(this.pos));
      if (kwarg) {
        this.pos += kwarg[0].length;
        kwargs[kwarg[1]] = this.parseValue();
      } else {
        args.push(this.parseValue());
      }
      this.skip();
      if (this.source[this.pos] === ",") {
        this.pos += 1;
        continue;
      }
      if (this.source[this.pos] === ")") {
        this.pos += 1;
        break;
      }
      this.fail("调用缺少分隔符或闭合括号");
    }
    return { type: "call", name, args, kwargs };
  }
}

function normalizeInput(text) {
  const source = text.trim();
  if (!source) {
    throw new Error("请先粘贴 get_state_history 的结果");
  }
  const candidates = [source.indexOf("StateSnapshot("), source.indexOf("[")].filter((index) => index >= 0);
  const start = candidates.length ? Math.min(...candidates) : source.indexOf("{");
  return start >= 0 ? source.slice(start) : source;
}

function parseHistory(text) {
  const source = normalizeInput(text);
  const parser = new Parser(source);
  const values = [parser.parseValue()];

  for (;;) {
    parser.skip();
    if (parser.pos >= source.length) {
      break;
    }
    if (source.startsWith("StateSnapshot(", parser.pos) || source[parser.pos] === "[") {
      values.push(parser.parseValue());
      continue;
    }
    break;
  }

  return values.length === 1 ? values[0] : { type: "list", items: values };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightPlain(segment) {
  return escapeHtml(segment).replace(/([{}()[\],:=])/g, '<span class="py-punct">$1</span>');
}

function highlightPython(text) {
  const pattern = /("(?:\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}|\\[^ux]|[^\\"])*"|'(?:\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}|\\[^ux]|[^\\'])*')|\b(True|False|None)\b|(?<![\w.])-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|\b([A-Za-z_][A-Za-z0-9_]*)(?=\s*=)/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    html += highlightPlain(text.slice(lastIndex, match.index));

    if (match[1] !== undefined) {
      const rest = text.slice(pattern.lastIndex);
      const isKey = /^\s*:/.test(rest);
      html += `<span class="${isKey ? "py-key" : "py-string"}">${escapeHtml(match[1])}</span>`;
    } else if (match[2] !== undefined) {
      html += `<span class="py-literal">${match[2]}</span>`;
    } else if (match[3] !== undefined) {
      html += `<span class="py-call">${match[3]}</span>`;
    } else if (match[4] !== undefined) {
      html += `<span class="py-key">${match[4]}</span>`;
    } else {
      html += `<span class="py-number">${match[0]}</span>`;
    }

    lastIndex = pattern.lastIndex;
  }

  html += highlightPlain(text.slice(lastIndex));
  return html;
}

function quotePython(value) {
  const escaped = String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `'${escaped}'`;
}

function formatPython(node, indent = 0) {
  if (!node) {
    return "None";
  }
  const pad = "    ".repeat(indent);
  const inner = "    ".repeat(indent + 1);

  switch (node.type) {
    case "string":
      return quotePython(node.value);
    case "number":
      return node.value;
    case "bool":
      return node.value ? "True" : "False";
    case "none":
      return "None";
    case "name":
      return node.value;
    case "list":
    case "tuple": {
      if (!node.items.length) {
        return node.type === "tuple" ? "()" : "[]";
      }
      const open = node.type === "tuple" ? "(" : "[";
      const close = node.type === "tuple" ? ")" : "]";
      const trailing = node.type === "tuple" ? "," : "";
      const body = node.items.map((item) => `${inner}${formatPython(item, indent + 1)}`).join(",\n");
      return `${open}\n${body}${trailing}\n${pad}${close}`;
    }
    case "dict": {
      if (!node.entries.length) {
        return "{}";
      }
      const body = node.entries
        .map((entry) => `${inner}${quotePython(entry.key)}: ${formatPython(entry.value, indent + 1)}`)
        .join(",\n");
      return `{\n${body}\n${pad}}`;
    }
    case "call": {
      const parts = Object.entries(node.kwargs).map(
        ([key, value]) => `${inner}${key}=${formatPython(value, indent + 1)}`
      );
      if (node.args.length) {
        parts.unshift(...node.args.map((arg) => `${inner}${formatPython(arg, indent + 1)}`));
      }
      if (!parts.length) {
        return `${node.name}()`;
      }
      return `${node.name}(\n${parts.join(",\n")}\n${pad})`;
    }
    default:
      return "";
  }
}

function toPlain(node) {
  if (!node) {
    return undefined;
  }
  switch (node.type) {
    case "string":
      return node.value;
    case "number":
      return Number(node.value);
    case "bool":
      return node.value;
    case "none":
      return null;
    case "name":
      return node.value;
    case "list":
    case "tuple":
      return node.items.map(toPlain);
    case "dict":
      return Object.fromEntries(node.entries.map((entry) => [entry.key, toPlain(entry.value)]));
    case "call": {
      const value = { __type: node.name };
      for (const [key, item] of Object.entries(node.kwargs)) {
        value[key] = toPlain(item);
      }
      if (node.args.length) {
        value.__args = node.args.map(toPlain);
      }
      return value;
    }
    default:
      return undefined;
  }
}

function scalar(node) {
  const value = toPlain(node);
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : undefined;
}

function dictValue(node, key) {
  if (!node || node.type !== "dict") {
    return undefined;
  }
  const entry = node.entries.find((item) => item.key === key);
  return entry ? entry.value : undefined;
}

function getKwarg(node, name) {
  return node && node.type === "call" ? node.kwargs[name] : undefined;
}

function setStatus(message, tone = "ok") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function formatTime(value) {
  if (!value) {
    return "未知时间";
  }
  return value.replace("T", " ").slice(0, 19);
}

function shortId(value) {
  return value && value.length > 10 ? `${value.slice(0, 8)}…` : value;
}

function shortCheckpoint(value) {
  return value && value.length > 12 ? `…${value.slice(-8)}` : value;
}

function renderInline(node) {
  if (!node) {
    return '<span class="empty">无</span>';
  }
  if (["dict", "list", "tuple", "call"].includes(node.type)) {
    return `<pre class="code-block">${escapeHtml(formatPython(node))}</pre>`;
  }
  return `<code>${escapeHtml(formatPython(node))}</code>`;
}

function renderValues(node) {
  if (!node) {
    return '<p class="empty">无</p>';
  }
  if (node.type === "dict") {
    if (!node.entries.length) {
      return '<p class="empty">空对象</p>';
    }
    const rows = node.entries
      .map(
        (entry) =>
          `<div class="kv-row"><dt>${escapeHtml(entry.key)}</dt><dd>${renderInline(entry.value)}</dd></div>`
      )
      .join("");
    return `<dl class="kv-list">${rows}</dl>`;
  }
  return `<pre class="code-block">${escapeHtml(formatPython(node))}</pre>`;
}

function renderNext(node) {
  const items = node && ["tuple", "list"].includes(node.type) ? node.items.map(scalar).filter((item) => item !== undefined) : [];
  if (!items.length) {
    return '<p class="empty">无，流程已结束</p>';
  }
  return `<div class="chip-list">${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderTasks(node) {
  const tasks = node && ["tuple", "list"].includes(node.type) ? node.items : [];
  if (!tasks.length) {
    return '<p class="empty">无</p>';
  }
  return `<div class="task-list">${tasks
    .map((task) => {
      if (!task || task.type !== "call") {
        return `<pre class="code-block">${escapeHtml(formatPython(task))}</pre>`;
      }
      const name = scalar(getKwarg(task, "name")) ?? task.name;
      const id = scalar(getKwarg(task, "id")) ?? "";
      const rows = [];
      const path = getKwarg(task, "path");
      const resultNode = getKwarg(task, "result");
      const errorNode = getKwarg(task, "error");
      const stateNode = getKwarg(task, "state");
      const interrupts = getKwarg(task, "interrupts");

      if (path) {
        rows.push(`<div class="kv-row"><dt>path</dt><dd><code>${escapeHtml(formatPython(path))}</code></dd></div>`);
      }
      if (resultNode) {
        rows.push(`<div class="kv-row"><dt>result</dt><dd>${renderInline(resultNode)}</dd></div>`);
      }
      if (errorNode && errorNode.type !== "none") {
        rows.push(`<div class="kv-row"><dt>error</dt><dd class="text-danger">${escapeHtml(formatPython(errorNode))}</dd></div>`);
      }
      if (stateNode && stateNode.type !== "none") {
        rows.push(`<div class="kv-row"><dt>state</dt><dd>${renderInline(stateNode)}</dd></div>`);
      }
      if (interrupts && !(interrupts.type === "tuple" && !interrupts.items.length)) {
        rows.push(`<div class="kv-row"><dt>interrupts</dt><dd>${renderInline(interrupts)}</dd></div>`);
      }

      return `<div class="task">
        <div class="task-head">
          <strong>${escapeHtml(name)}</strong>
          ${id ? `<code class="task-id" title="${escapeHtml(id)}">${escapeHtml(shortId(id))}</code>` : ""}
        </div>
        <dl class="kv-list">${rows.join("")}</dl>
      </div>`;
    })
    .join("")}</div>`;
}

function renderSnapshot(node, index) {
  const config = getKwarg(node, "config");
  const configurable = dictValue(config, "configurable");
  const metadata = getKwarg(node, "metadata");
  const parentConfig = getKwarg(node, "parent_config");
  const parentConfigurable = dictValue(parentConfig, "configurable");
  const interrupts = getKwarg(node, "interrupts");

  const source = scalar(dictValue(metadata, "source")) ?? "unknown";
  const step = scalar(dictValue(metadata, "step"));
  const createdAt = scalar(getKwarg(node, "created_at")) ?? "";
  const threadId = scalar(dictValue(configurable, "thread_id"));
  const checkpointNs = scalar(dictValue(configurable, "checkpoint_ns"));
  const checkpointId = scalar(dictValue(configurable, "checkpoint_id"));
  const parentCheckpointId = scalar(dictValue(parentConfigurable, "checkpoint_id"));
  const sourceClass = `source-${String(source).replace(/[^a-z]/gi, "").toLowerCase()}`;

  const detailRows = [
    ["thread_id", threadId],
    ["checkpoint_ns", checkpointNs],
    ["checkpoint_id", checkpointId],
    ["parent checkpoint_id", parentCheckpointId],
  ]
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([label, value]) => `<div class="kv-row"><dt>${label}</dt><dd><code>${escapeHtml(value)}</code></dd></div>`)
    .join("");

  const hasInterrupts = interrupts && ["tuple", "list"].includes(interrupts.type) && interrupts.items.length > 0;

  return `<article class="snapshot">
    <header class="snap-head">
      <span class="snap-index">#${index + 1}</span>
      <span class="badge ${sourceClass}">${escapeHtml(source)}</span>
      ${step !== undefined ? `<span class="badge">step ${escapeHtml(step)}</span>` : ""}
      <time class="snap-time" datetime="${escapeHtml(createdAt)}" title="${escapeHtml(createdAt)}">${escapeHtml(formatTime(createdAt))}</time>
      ${checkpointId ? `<code class="snap-id" title="${escapeHtml(checkpointId)}">${escapeHtml(shortId(checkpointId))}</code>` : ""}
    </header>
    <div class="snap-grid">
      <section class="snap-field">
        <h4>values</h4>
        ${renderValues(getKwarg(node, "values"))}
      </section>
      <section class="snap-field">
        <h4>next</h4>
        ${renderNext(getKwarg(node, "next"))}
      </section>
    </div>
    <section class="snap-field">
      <h4>tasks</h4>
      ${renderTasks(getKwarg(node, "tasks"))}
    </section>
    <details class="snap-details">
      <summary>配置与元数据</summary>
      <dl class="kv-list">${detailRows}</dl>
      ${metadata ? `<pre class="code-block">metadata = ${escapeHtml(formatPython(metadata))}</pre>` : ""}
      ${hasInterrupts ? `<pre class="code-block">interrupts = ${escapeHtml(formatPython(interrupts))}</pre>` : ""}
    </details>
    <details class="snap-details">
      <summary>原始数据</summary>
      <pre class="code-block">${escapeHtml(formatPython(node))}</pre>
    </details>
  </article>`;
}

function snapshotNodes(root) {
  const nodes = root && ["list", "tuple"].includes(root.type) ? root.items : [root];
  return (nodes || []).filter((node) => node && node.type === "call" && node.name === "StateSnapshot");
}

function buildItems(snapshots) {
  return snapshots.map((node, index) => {
    const configurable = dictValue(getKwarg(node, "config"), "configurable");
    const metadata = getKwarg(node, "metadata");
    const parentConfigurable = dictValue(getKwarg(node, "parent_config"), "configurable");
    return {
      node,
      index,
      id: scalar(dictValue(configurable, "checkpoint_id")) ?? `snapshot-${index}`,
      parentId: scalar(dictValue(parentConfigurable, "checkpoint_id")),
      threadId: scalar(dictValue(configurable, "thread_id")),
      source: scalar(dictValue(metadata, "source")) ?? "unknown",
      step: scalar(dictValue(metadata, "step")),
      createdAt: scalar(getKwarg(node, "created_at")) ?? "",
      values: valuesEntries(getKwarg(node, "values")),
      next: nextItems(getKwarg(node, "next")),
      task: taskPreview(getKwarg(node, "tasks")),
      checkpoint: shortCheckpoint(scalar(dictValue(configurable, "checkpoint_id")) ?? ""),
    };
  });
}

function compactNode(node) {
  return formatPython(node).replace(/\s+/g, " ").trim();
}

function valuesEntries(node) {
  if (!node || node.type !== "dict" || !node.entries.length) {
    return [];
  }
  return node.entries.slice(0, 4).map((entry) => ({
    key: entry.key,
    value: compactNode(entry.value),
  }));
}

function nextItems(node) {
  return node && ["tuple", "list"].includes(node.type) ? node.items.map(scalar).filter((value) => value !== undefined) : [];
}

function taskPreview(node) {
  if (!node || !["tuple", "list"].includes(node.type) || !node.items.length) {
    return null;
  }
  const task = node.items[0];
  if (!task || task.type !== "call") {
    return { name: "task", detail: compactNode(task), error: false, extra: 0 };
  }
  const error = getKwarg(task, "error");
  const result = getKwarg(task, "result");
  const hasError = Boolean(error && error.type !== "none");
  return {
    name: scalar(getKwarg(task, "name")) ?? task.name,
    detail: hasError ? compactNode(error) : result ? compactNode(result) : "",
    error: hasError,
    extra: node.items.length - 1,
  };
}

function renderFlowNode(item) {
  const sourceClass = `source-${String(item.source).replace(/[^a-z]/gi, "").toLowerCase()}`;
  const time = item.createdAt ? item.createdAt.slice(11, 19) : "";
  const valuesHtml = item.values.length
    ? item.values
        .map(
          (entry) =>
            `<span class="flow-node-kv"><span class="flow-node-key">${escapeHtml(entry.key)}</span><span class="flow-node-val">${escapeHtml(entry.value)}</span></span>`
        )
        .join("")
    : '<span class="flow-node-empty">空状态</span>';
  const nextHtml = item.next.length
    ? item.next.map((target) => `<span class="chip">${escapeHtml(target)}</span>`).join("")
    : '<span class="flow-node-end">结束</span>';
  const taskHtml = item.task
    ? `<span class="flow-node-task${item.task.error ? " is-error" : ""}" title="${escapeHtml(item.task.detail)}">task ${escapeHtml(item.task.name)}${
        item.task.detail ? ` → ${escapeHtml(item.task.detail)}` : ""
      }${item.task.extra ? ` +${item.task.extra}` : ""}</span>`
    : "";

  return `<button class="flow-node" type="button" data-id="${escapeHtml(item.id)}" aria-pressed="false">
      <span class="flow-node-top">
        <span class="badge ${sourceClass}">${escapeHtml(item.source)}</span>
        <span class="flow-node-step">${item.step === undefined ? "step ?" : `step ${escapeHtml(item.step)}`}</span>
      </span>
      <span class="flow-node-values">${valuesHtml}</span>
      <span class="flow-node-next"><span class="flow-node-label">next</span>${nextHtml}</span>
      ${taskHtml}
      <span class="flow-node-meta">${escapeHtml(time)} · ${escapeHtml(item.checkpoint)}</span>
    </button>`;
}

function renderFlow(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = item.step === undefined ? "?" : String(item.step);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });

  const steps = [...groups.keys()].sort((a, b) => (a === "?" ? 1 : b === "?" ? -1 : Number(a) - Number(b)));
  const columns = steps
    .map((step) => {
      const list = groups.get(step).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return `<div class="flow-column">
          <span class="flow-step-label">step ${escapeHtml(step)}</span>
          ${list.map(renderFlowNode).join("")}
        </div>`;
    })
    .join("");

  return `<div class="flow-wrap">
      <p class="flow-hint">悬浮节点查看相邻快照，点击查看完整详情</p>
      <div class="flow">
        <div class="flow-inner">
          <svg class="flow-edges" aria-hidden="true"></svg>
          <div class="flow-columns">${columns}</div>
        </div>
      </div>
    </div>
    <section id="flow-detail" class="flow-detail" aria-live="polite"></section>`;
}

function renderResult(items) {
  const threadIds = [...new Set(items.map((item) => item.threadId).filter(Boolean))];
  const sources = [...new Set(items.map((item) => item.source))];

  return `<div class="result-summary">
      <div><span>快照</span><strong>${items.length}</strong></div>
      ${threadIds.length ? `<div><span>thread_id</span><code>${escapeHtml(threadIds.join(", "))}</code></div>` : ""}
      <div><span>来源</span><span class="source-list">${sources
        .map((source) => `<span class="badge source-${String(source).replace(/[^a-z]/gi, "").toLowerCase()}">${escapeHtml(source)}</span>`)
        .join("")}</span></div>
    </div>
    ${renderFlow(items)}`;
}

function mountFlow(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const nodes = [...result.querySelectorAll(".flow-node")];
  const svg = result.querySelector(".flow-edges");
  const inner = result.querySelector(".flow-inner");
  const detail = result.querySelector("#flow-detail");
  if (!svg || !inner || !detail) {
    return;
  }

  const edges = items
    .filter((item) => item.parentId && byId.has(item.parentId))
    .map((item) => ({ fromId: item.parentId, toId: item.id }));

  edges.forEach((edge) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "flow-edge");
    path.dataset.from = edge.fromId;
    path.dataset.to = edge.toId;
    svg.appendChild(path);
  });

  const edgeEls = [...svg.querySelectorAll(".flow-edge")];

  function drawEdges() {
    const base = inner.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${inner.scrollWidth} ${inner.scrollHeight}`);
    edgeEls.forEach((path) => {
      const fromNode = nodes.find((node) => node.dataset.id === path.dataset.from);
      const toNode = nodes.find((node) => node.dataset.id === path.dataset.to);
      if (!fromNode || !toNode) {
        return;
      }
      const a = fromNode.getBoundingClientRect();
      const b = toNode.getBoundingClientRect();
      const x1 = a.right - base.left;
      const y1 = a.top - base.top + a.height / 2;
      const x2 = b.left - base.left;
      const y2 = b.top - base.top + b.height / 2;
      const curve = Math.max(36, (x2 - x1) / 2);
      path.setAttribute("d", `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`);
    });
  }

  function paint(item) {
    const related = new Set();
    if (item.parentId) {
      related.add(item.parentId);
    }
    items.forEach((other) => {
      if (other.parentId === item.id) {
        related.add(other.id);
      }
    });
    nodes.forEach((node) => node.classList.toggle("is-related", related.has(node.dataset.id)));
    edgeEls.forEach((path) => path.classList.toggle("is-active", path.dataset.from === item.id || path.dataset.to === item.id));
  }

  function resetPaint() {
    nodes.forEach((node) => node.classList.remove("is-related"));
    edgeEls.forEach((path) => path.classList.remove("is-active"));
    if (selectedId && byId.has(selectedId)) {
      paint(byId.get(selectedId));
    }
  }

  function select(item) {
    selectedId = item.id;
    nodes.forEach((node) => {
      const isSelected = node.dataset.id === item.id;
      node.classList.toggle("is-selected", isSelected);
      node.setAttribute("aria-pressed", String(isSelected));
    });
    resetPaint();
    detail.innerHTML = renderSnapshot(item.node, item.index);
  }

  nodes.forEach((node) => {
    const item = byId.get(node.dataset.id);
    if (!item) {
      return;
    }
    node.addEventListener("mouseenter", () => paint(item));
    node.addEventListener("mouseleave", resetPaint);
    node.addEventListener("focus", () => paint(item));
    node.addEventListener("blur", resetPaint);
    node.addEventListener("click", () => select(item));
  });

  drawEdgesRef = drawEdges;
  requestAnimationFrame(drawEdges);

  if (items.length) {
    select(items[0]);
  }
}

function updateInputStats() {
  const value = input.value;
  inputStats.textContent = value ? `${value.split("\n").length} 行 / ${value.length} 字符` : "0 字符";
}

function updateOutputStats(text) {
  outputStats.textContent = text ? `${text.split("\n").length} 行 / ${text.length} 字符` : "";
}

function writeFormatted(root) {
  const text = formatPython(root);
  formattedOutput.innerHTML = highlightPython(text);
  updateOutputStats(text);
}

function clearFormatted() {
  formattedOutput.innerHTML = "";
  updateOutputStats("");
}

function runParse() {
  try {
    const root = parseHistory(input.value);
    writeFormatted(root);

    const snapshots = snapshotNodes(root);
    if (snapshots.length) {
      const items = buildItems(snapshots);
      result.innerHTML = renderResult(items);
      mountFlow(items);
      setStatus(`解析完成，共 ${snapshots.length} 条快照`);
      return;
    }
    result.innerHTML = `<div class="result-note">未识别到 StateSnapshot，以下为解析后的数据结构。</div>
      <pre class="code-block">${escapeHtml(formatPython(root))}</pre>`;
    selectedId = null;
    drawEdgesRef = null;
    setStatus("解析完成，但未发现 StateSnapshot", "muted");
  } catch (error) {
    clearFormatted();
    result.innerHTML = "";
    selectedId = null;
    drawEdgesRef = null;
    setStatus(error.message, "error");
  }
}

document.querySelector("#parse").addEventListener("click", runParse);

document.querySelector("#copy").addEventListener("click", async () => {
  const text = formattedOutput.textContent;
  if (!text) {
    setStatus("没有可复制的格式化结果", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("已复制格式化结果");
  } catch (error) {
    setStatus("复制失败，请手动选择内容复制", "error");
  }
});

document.querySelector("#sample").addEventListener("click", () => {
  input.value = SAMPLE;
  updateInputStats();
  runParse();
});

document.querySelector("#clear").addEventListener("click", () => {
  input.value = "";
  updateInputStats();
  clearFormatted();
  result.innerHTML = "";
  selectedId = null;
  drawEdgesRef = null;
  setStatus("已清空。按 Cmd/Ctrl + Enter 开始解析。", "muted");
  input.focus();
});

input.addEventListener("input", updateInputStats);

input.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    runParse();
  }
});

window.addEventListener("resize", () => {
  if (drawEdgesRef) {
    drawEdgesRef();
  }
});

updateInputStats();
