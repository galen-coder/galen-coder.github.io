/* 哈希计算：MD5 为纯 JS 实现，SHA 系列使用 WebCrypto。 */
(function () {
  const MD5_SHIFT = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  const MD5_K = new Int32Array(64);
  for (let index = 0; index < 64; index += 1) {
    MD5_K[index] = Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) | 0;
  }

  function md5Bytes(bytes) {
    const length = bytes.length;
    const paddedLength = (((length + 8) >> 6) + 1) * 64;
    const buffer = new Uint8Array(paddedLength);
    buffer.set(bytes);
    buffer[length] = 0x80;

    const bitLength = length * 8;
    const view = new DataView(buffer.buffer);
    view.setUint32(paddedLength - 8, bitLength >>> 0, true);
    view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;
    const words = new Int32Array(16);

    for (let offset = 0; offset < paddedLength; offset += 64) {
      for (let index = 0; index < 16; index += 1) {
        words[index] = view.getInt32(offset + index * 4, true);
      }

      let A = a0;
      let B = b0;
      let C = c0;
      let D = d0;

      for (let index = 0; index < 64; index += 1) {
        let F;
        let g;

        if (index < 16) {
          F = (B & C) | (~B & D);
          g = index;
        } else if (index < 32) {
          F = (D & B) | (~D & C);
          g = (5 * index + 1) % 16;
        } else if (index < 48) {
          F = B ^ C ^ D;
          g = (3 * index + 5) % 16;
        } else {
          F = C ^ (B | ~D);
          g = (7 * index) % 16;
        }

        F = (F + A + MD5_K[index] + words[g]) | 0;
        A = D;
        D = C;
        C = B;
        B = (B + ((F << MD5_SHIFT[index]) | (F >>> (32 - MD5_SHIFT[index])))) | 0;
      }

      a0 = (a0 + A) | 0;
      b0 = (b0 + B) | 0;
      c0 = (c0 + C) | 0;
      d0 = (d0 + D) | 0;
    }

    const digest = new Uint8Array(16);
    const digestView = new DataView(digest.buffer);
    digestView.setInt32(0, a0, true);
    digestView.setInt32(4, b0, true);
    digestView.setInt32(8, c0, true);
    digestView.setInt32(12, d0, true);
    return digest;
  }

  function toHex(bytes) {
    let hex = "";
    for (const byte of bytes) {
      hex += byte.toString(16).padStart(2, "0");
    }
    return hex;
  }

  function toBase64(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
    }
    return btoa(binary);
  }

  const SHA_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

  async function hashBytes(bytes) {
    const rows = [["MD5", md5Bytes(bytes)]];

    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("当前环境不支持 WebCrypto，无法计算 SHA 系列；请通过 https 或 localhost 打开");
    }

    for (const algorithm of SHA_ALGORITHMS) {
      const digest = await window.crypto.subtle.digest(algorithm, bytes);
      rows.push([algorithm, new Uint8Array(digest)]);
    }
    return rows;
  }

  function formatDigests(rows) {
    return rows
      .map(([name, bytes]) => `${name}\n  hex  ${toHex(bytes)}\n  b64  ${toBase64(bytes)}`)
      .join("\n\n");
  }

  function formatBytes(size) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      md5Bytes,
      toHex,
      toBase64,
      hashBytes,
      formatDigests,
      md5Hex(text) {
        return toHex(md5Bytes(new TextEncoder().encode(text)));
      }
    };
  }

  if (typeof document === "undefined") return;

  const { mountTool } = window.ToolKit;
  const fileInput = document.getElementById("file");
  const SAMPLE = "The quick brown fox jumps over the lazy dog";

  const tool = mountTool({
    sample: SAMPLE,
    transform: async (raw) => {
      const bytes = new TextEncoder().encode(raw);
      const rows = await hashBytes(bytes);
      return {
        text: formatDigests(rows),
        status: `已计算 ${rows.length} 种摘要（${raw.length} 字符 / ${bytes.length} 字节）`
      };
    }
  });

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      tool.setStatus("文件超过 20 MB，请改用命令行工具计算", "error");
      return;
    }

    try {
      const rows = await hashBytes(new Uint8Array(await file.arrayBuffer()));
      tool.writeOutput(formatDigests(rows));
      tool.setStatus(`已计算文件 ${file.name}（${formatBytes(file.size)}）的 ${rows.length} 种摘要`, "ok");
    } catch (error) {
      tool.setStatus(error.message, "error");
    }
  });
})();
