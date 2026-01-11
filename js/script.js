let STORIES = {};
let HOT_PAGE = 1;
let HOT_PER_PAGE = 14;
let HOT_Q = "";
let HOT_CAT = "__all__";

async function loadStories() {
  try {
    const res = await fetch("./data/stories.json");
    STORIES = await res.json();
    renderHot();
    renderUpdates();
    bindModal();
    initSearch();
  } catch (e) {
    console.error("Lỗi load stories.json:", e);
  }
}

function renderHot() {
  const grid = document.getElementById("hotGrid");
  const pager = document.getElementById("hotPager");
  if (!grid || !pager) return;

  const all = Object.values(STORIES);

  const filtered = all.filter(story => {
    const title = normalize(story.title || "");
    const cat = (story.category || "").trim();
    const catN = normalize(cat);

    const q = normalize(HOT_Q);
    const okText = !q || title.includes(q) || catN.includes(q);
    const okCat = HOT_CAT === "__all__" || cat === HOT_CAT;

    return okText && okCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / HOT_PER_PAGE));
  if (HOT_PAGE > totalPages) HOT_PAGE = totalPages;
  if (HOT_PAGE < 1) HOT_PAGE = 1;

  const start = (HOT_PAGE - 1) * HOT_PER_PAGE;
  const pageItems = filtered.slice(start, start + HOT_PER_PAGE);

  grid.innerHTML = pageItems.map(story => `
    <div class="card"
         data-id="${story.id}"
         data-title="${story.title || ""}"
         data-category="${story.category || ""}">
      <div class="cover">
        <img src="${story.cover || ""}" alt="${story.title || ""}">
      </div>
      <div class="caption">${story.title || ""}</div>
    </div>
  `).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });

  pager.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    return `<button type="button" data-page="${p}" class="${p === HOT_PAGE ? "active" : ""}">${p}</button>`;
  }).join("");

  pager.querySelectorAll("button[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      HOT_PAGE = Number(btn.dataset.page || "1");
      renderHot();
    });
  });
}

function renderUpdates() {
  const box = document.getElementById("updatesList");
  if (!box) return;
  box.innerHTML = "";

  const arr = Object.values(STORIES);
  arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  arr.forEach(story => {
    const chapters = Object.keys(story.chapters || {});
    const lastChap = chapters.length ? chapters[chapters.length - 1] : "";

    box.innerHTML += `
      <div class="row">
        <a href="#" data-id="${story.id}" class="upd-link">${story.title || ""}</a>
        <div class="muted">${story.category || ""}</div>
        <div class="chap">${lastChap}</div>
        <div class="time">${story.updated || ""}</div>
      </div>
    `;
  });

  box.querySelectorAll(".upd-link").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(a.dataset.id);
    });
  });
}

function bindModal() {
  const closeBtn = document.getElementById("modalClose");
  const modal = document.getElementById("modal");

  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("open"));

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }
}

function openModal(storyId) {
  const story = Object.values(STORIES).find(s => s.id === storyId);
  if (!story) return;

  const modal = document.getElementById("modal");
  if (modal) modal.classList.add("open");

  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.innerText = story.title || "Đọc truyện";

  const readerName = document.getElementById("readerName");
  if (readerName) readerName.innerText = story.title || "";

  const readerCategory = document.getElementById("readerCategory");
  if (readerCategory) readerCategory.innerText = story.category || "";

  const readerDesc = document.getElementById("readerDesc");
  if (readerDesc) readerDesc.innerText = story.description || "";

  const readerCover = document.getElementById("readerCover");
  if (readerCover) readerCover.src = story.cover || "";

  const select = document.getElementById("chapterSelect");
  if (select) {
    const chapters = Object.keys(story.chapters || {});
    select.innerHTML = chapters.map(ch => `<option value="${ch}">${ch}</option>`).join("");
  }

  const btn = document.getElementById("loadChapterBtn");
  if (btn && select) {
    btn.onclick = () => {
      const chap = (select.value || "").trim();
      if (chap) window.location.href = `reader.html?story=${story.id}&chap=${chap}`;
    };
  }
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const navCategoryMenu = document.getElementById("navCategoryMenu");

  if (!searchInput || !categorySelect) return;

  const cats = [...new Set(
    Object.values(STORIES).map(s => (s.category || "").trim()).filter(Boolean)
  )];

  categorySelect.innerHTML = `<option value="__all__">TẤT CẢ</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join("");

  if (navCategoryMenu) {
    navCategoryMenu.innerHTML = cats.map(c => `<a href="#" data-cat="${c}">${c}</a>`).join("");
    navCategoryMenu.querySelectorAll("a[data-cat]").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        categorySelect.value = a.dataset.cat || "__all__";
        HOT_CAT = categorySelect.value;
        HOT_PAGE = 1;
        renderHot();
      });
    });
  }

  const apply = () => {
    HOT_Q = searchInput.value || "";
    HOT_CAT = categorySelect.value || "__all__";
    HOT_PAGE = 1;
    renderHot();
  };

  searchInput.addEventListener("input", apply);
  searchInput.addEventListener("keyup", apply);
  searchInput.addEventListener("search", apply);
  categorySelect.addEventListener("change", apply);
}

loadStories();
