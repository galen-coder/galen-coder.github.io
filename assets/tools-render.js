/* 根据 assets/tools-data.js 渲染主页工具区与 tools/index.html 工具集。 */
(function () {
  const data = window.TOOLS_DATA;
  if (!data) return;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolvePath(path) {
    const root = document.body.dataset.root || "";
    return root ? `${root}/${path}` : path;
  }

  function toolsOf(categoryId) {
    return data.tools.filter((tool) => tool.category === categoryId);
  }

  function toolCard(tool) {
    const body =
      '<span class="tool-card-body">' +
      `<strong>${escapeHtml(tool.name)}</strong>` +
      `<span>${escapeHtml(tool.description)}</span>` +
      "</span>";
    const state = `<span class="tool-card-state">${tool.status === "live" ? "可用" : "计划中"}</span>`;

    if (tool.status === "live" && tool.path) {
      return `<a class="tool-card is-live" href="${escapeHtml(resolvePath(tool.path))}" target="_blank" rel="noopener">${body}${state}</a>`;
    }
    return `<div class="tool-card is-planned">${body}${state}</div>`;
  }

  function toolItem(tool) {
    return `<li data-tool="${escapeHtml(tool.id)}">${toolCard(tool)}</li>`;
  }

  function groupMarkup(category, items) {
    return (
      `<article class="tool-group" data-group="${escapeHtml(category.id)}">` +
      `<h3>${escapeHtml(category.name)} <span>${escapeHtml(category.en)}</span></h3>` +
      `<ul class="tool-list">${items.map(toolItem).join("")}</ul>` +
      "</article>"
    );
  }

  function renderHome() {
    const grid = document.getElementById("tools-grid");
    if (!grid) return;

    grid.innerHTML = data.categories
      .map((category) => {
        const items = toolsOf(category.id);
        return items.length ? groupMarkup(category, items) : "";
      })
      .join("");

    const summary = document.getElementById("tools-summary");
    if (summary) {
      const live = data.tools.filter((tool) => tool.status === "live").length;
      summary.textContent = `全部处理在浏览器本地完成，输入内容不会离开你的设备。已上线 ${live} 个工具，${data.tools.length - live} 个计划中。`;
    }
  }

  function renderCatalog() {
    const grid = document.getElementById("tool-catalog");
    if (!grid) return;

    const search = document.getElementById("tool-search");
    const filters = document.getElementById("tool-filters");
    const count = document.getElementById("tool-count");
    const empty = document.getElementById("tool-empty");
    const totalLive = data.tools.filter((tool) => tool.status === "live").length;
    let active = "all";

    grid.innerHTML = data.categories
      .map((category) => groupMarkup(category, toolsOf(category.id)))
      .join("");

    filters.innerHTML = [{ id: "all", name: "全部" }, ...data.categories]
      .map(
        (category) =>
          `<button class="filter-chip${category.id === "all" ? " is-active" : ""}" type="button" data-category="${escapeHtml(category.id)}" aria-pressed="${category.id === "all"}">${escapeHtml(category.name)}</button>`
      )
      .join("");

    function apply() {
      const query = (search.value || "").trim().toLowerCase();
      let visible = 0;

      data.categories.forEach((category) => {
        const group = grid.querySelector(`[data-group="${category.id}"]`);
        if (!group) return;
        let groupVisible = 0;

        group.querySelectorAll("[data-tool]").forEach((node) => {
          const tool = data.tools.find((item) => item.id === node.dataset.tool);
          if (!tool) return;
          const haystack = `${tool.name} ${tool.description} ${(tool.keywords || []).join(" ")}`.toLowerCase();
          const matchesCategory = active === "all" || tool.category === active;
          const matchesQuery = !query || haystack.includes(query);
          node.hidden = !(matchesCategory && matchesQuery);
          if (!node.hidden) {
            groupVisible += 1;
            visible += 1;
          }
        });

        group.hidden = groupVisible === 0;
      });

      count.textContent = `显示 ${visible} / ${data.tools.length} 个工具 · ${totalLive} 个可用`;
      empty.hidden = visible > 0;
    }

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      active = button.dataset.category;
      filters.querySelectorAll(".filter-chip").forEach((chip) => {
        const selected = chip === button;
        chip.classList.toggle("is-active", selected);
        chip.setAttribute("aria-pressed", String(selected));
      });
      apply();
    });

    search.addEventListener("input", apply);
    apply();
  }

  renderHome();
  renderCatalog();
})();
