/* Base64 编解码：UTF-8 安全，支持 URL 安全字符与文件编码。 */
(function () {
  const CHUNK = 0x8000;

  function bytesToBinary(bytes) {
    let binary = "";
    for (let index = 0; index < bytes.length; index += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + CHUNK));
    }
    return binary;
  }

  function encodeBytesToBase64(bytes, urlSafe) {
    let result = btoa(bytesToBinary(bytes));
    if (urlSafe) {
      result = result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    return result;
  }

  function encodeBase64(text, urlSafe) {
    return encodeBytesToBase64(new TextEncoder().encode(text), urlSafe);
  }

  function normalizeBase64(text) {
    return text.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  }

  function decodeBase64(text) {
    let normalized = normalizeBase64(text);
    if (!normalized) {
      throw new Error("请输入 Base64 内容");
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
      throw new Error("内容包含 Base64 之外的字符");
    }

    const remainder = normalized.length % 4;
    if (remainder === 1) {
      throw new Error("Base64 长度不正确");
    }
    if (remainder) {
      normalized += "=".repeat(4 - remainder);
    }

    let decoded;
    try {
      decoded = atob(normalized);
    } catch (error) {
      throw new Error("Base64 解码失败，请检查内容");
    }

    try {
      const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (error) {
      throw new Error("解码结果不是有效的 UTF-8 文本");
    }
  }

  function looksLikeBase64(text) {
    const compact = text.replace(/\s+/g, "");
    if (compact.length < 4 || compact.length % 4 === 1) return false;
    if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(compact)) return false;
    try {
      const decoded = decodeBase64(compact);
      return decoded.length > 0 && !/[\u0000-\u0008\u000e-\u001f]/.test(decoded);
    } catch (error) {
      return false;
    }
  }

  function resolveMode(raw, selected) {
    if (selected === "encode" || selected === "decode") return selected;
    return looksLikeBase64(raw) ? "decode" : "encode";
  }

  function formatBytes(size) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      encodeBase64,
      encodeBytesToBase64,
      decodeBase64,
      normalizeBase64,
      looksLikeBase64,
      resolveMode
    };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const modeSelect = document.getElementById("mode");
  const urlSafe = document.getElementById("url-safe");
  const fileInput = document.getElementById("file");
  const SAMPLE = "你好，Base64！Hello, world.";

  const tool = mountTool({
    sample: SAMPLE,
    onClear() {
      modeSelect.value = "auto";
      urlSafe.checked = false;
    },
    transform(raw) {
      const mode = resolveMode(raw, modeSelect.value);

      if (mode === "decode") {
        const text = decodeBase64(raw);
        return {
          text,
          status: `解码完成，${raw.length} → ${text.length} 字符`
        };
      }

      const text = encodeBase64(raw, urlSafe.checked);
      return {
        text,
        status: `编码完成，${raw.length} → ${text.length} 字符${urlSafe.checked ? "（URL 安全）" : ""}`
      };
    }
  });

  modeSelect.addEventListener("change", () => tool.run());
  urlSafe.addEventListener("change", () => tool.run());

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      tool.setStatus("文件超过 20 MB，请改用命令行工具处理", "error");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const text = encodeBytesToBase64(new Uint8Array(buffer), urlSafe.checked);
      tool.writeOutput(text);
      tool.setStatus(`已编码文件 ${file.name}（${formatBytes(file.size)}，${text.length} 字符）`, "ok");
    } catch (error) {
      tool.setStatus(`读取文件失败：${error.message}`, "error");
    }
  });
})();
