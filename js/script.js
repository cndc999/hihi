let STORIES = {};

// ================= LOAD DATA =================
async function loadStories() {
  try {
    const res = await fetch("./data/stories.json");
    STORIES = await res.json();

    renderHot();
    renderUpdates();
    bindModal();
    initSearch(); // khởi tạo search sau khi render
  } catch (e) {
    console.error("Lỗi load stories.json:", e);
  }
}

// ================= RENDER HOT =================
function renderHot() {
  const grid = document.getElementById("hotGrid");
  if (!grid) return;
  grid.innerHTML = "";

  Object.values(STORIES).forEach(story => {
    grid.innerHTML += `
      <div class="card"
           data-id="${story.id}"
           data-title="${story.title || ""}"
           data-category="${story.category || ""}">
        <div class="cover">
          <img src="${story.cover || ""}" alt="${story.title || ""}">
        </div>
        <div class="caption">${story.title || ""}</div>
      </div>
    `;
  });

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });
}

// ================= RENDER UPDATES =================
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
        <a href="#" data-id="${story.id}" class="upd-link">${story.title}</a>
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

// ================= MODAL =================
function bindModal() {
  const closeBtn = document.getElementById("modalClose");
  const modal = document.getElementById("modal");

  closeBtn?.addEventListener("click", () => modal.classList.remove("open"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

function openModal(storyId) {
  const story = Object.values(STORIES).find(s => s.id === storyId);
  if (!story) return;

  document.getElementById("modal").classList.add("open");
  document.getElementById("modalTitle").innerText = story.title || "";
  document.getElementById("readerName").innerText = story.title || "";
  document.getElementById("readerCategory").innerText = story.category || "";
  document.getElementById("readerDesc").innerText = story.description || "";
  document.getElementById("readerCover").src = story.cover || "";

  const select = document.getElementById("chapterSelect");
  select.innerHTML = Object.keys(story.chapters || {})
    .map(ch => `<option value="${ch}">${ch}</option>`)
    .join("");

  document.getElementById("loadChapterBtn").onclick = () => {
    const chap = select.value;
    if (chap) {
      window.location.href = `reader.html?story=${story.id}&chap=${chap}`;
    }
  };
}

// ================= SEARCH + FILTER =================
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const grid = document.getElementById("hotGrid");

  if (!searchInput || !categorySelect || !grid) return;

  // đổ thể loại từ card đã render
  const cats = [...new Set(
    Array.from(grid.querySelectorAll(".card"))
      .map(c => c.dataset.category)
      .filter(Boolean)
  )];

  categorySelect.innerHTML =
    `<option value="__all__">TẤT CẢ</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join("");

  function applyFilter() {
    const q = normalize(searchInput.value);
    const cat = categorySelect.value;

    grid.querySelectorAll(".card").forEach(card => {
      const title = normalize(card.dataset.title);
      const c = card.dataset.category;

      const okName = title.includes(q);
      const okCat = cat === "__all__" || c === cat;

      card.style.display = (okName && okCat) ? "" : "none";
    });
  }

  // 🔥 FIX TRIỆT ĐỂ CHO SEARCH
  searchInput.addEventListener("input", applyFilter);
  searchInput.addEventListener("keyup", applyFilter);   // hỗ trợ gõ tiếng Việt
  searchInput.addEventListener("search", applyFilter);  // khi clear ô search
  categorySelect.addEventListener("change", applyFilter);
}

// ================= START =================
loadStories();
