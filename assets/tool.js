/* 工具页共享函数。以全局对象挂载，保证 file:// 直接打开也可用。 */
(function () {
  function describeText(text) {
    return text ? `${text.split("\n").length} 行 / ${text.length} 字符` : "";
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-1000px";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) {
      throw new Error("复制失败");
    }
  }

  function onModEnter(element, handler) {
    element.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handler(event);
      }
    });
  }

  window.ToolKit = { describeText, copyText, onModEnter };
})();
