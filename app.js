/* Di Sản Việt — GitHub Pages + Supabase */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const hasConfig = () => window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_") && !window.SUPABASE_ANON_KEY.includes("PASTE_");
  let db = null, stories = [], categories = [], editingStory = null, currentImageUrl = "", removeCurrentImage = false;
  let toastTimer = null;

  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  const plain = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  function notify(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }
  function show(el, yes = true) { el.classList.toggle("hidden", !yes); }
  function categoryName(id) { return categories.find(c => c.id === id)?.name || "Chưa phân loại"; }
  function storyText(story) { return story.content || ""; }

  async function init() {
    $("year").textContent = new Date().getFullYear();
    wireEvents();
    if (!hasConfig()) {
      $("story-grid").innerHTML = '<div class="loading">Website đã sẵn sàng phần giao diện. Bé hãy điền thông tin Supabase trong file <b>config.js</b> để kết nối thư viện.</div>';
      $("story-count").textContent = "Chưa kết nối cơ sở dữ liệu";
      return;
    }
    db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    await loadPublicData();
    db.auth.onAuthStateChange((event, session) => {
      if (session && ["SIGNED_IN","TOKEN_REFRESHED","INITIAL_SESSION"].includes(event)) {
        setTimeout(() => checkAdminSession(), 0);
      } else if (event === "SIGNED_OUT") {
        show($("admin-dashboard"), false); show($("admin-login-view"), true);
      }
    });
  }

  function wireEvents() {
    $("search-input").addEventListener("input", renderStories);
    $("category-filter").addEventListener("change", renderStories);
    $("category-chips").addEventListener("click", e => {
      const btn = e.target.closest("[data-category]"); if (!btn) return;
      $("category-filter").value = btn.dataset.category;
      document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === btn));
      renderStories();
    });
    $("story-grid").addEventListener("click", e => {
      const card = e.target.closest("[data-story-id]"); if (card) openReader(card.dataset.storyId);
    });
    $("admin-open").addEventListener("click", async () => {
      show($("admin-modal")); $("login-message").textContent = "";
      if (db) await checkAdminSession();
    });
    document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", () => show($(el.dataset.close), false)));
    $("login-form").addEventListener("submit", login);
    $("logout-button").addEventListener("click", logout);
    document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
    $("new-story-button").addEventListener("click", () => openEditor(null));
    $("cancel-editor").addEventListener("click", closeEditor);
    $("cancel-editor-2").addEventListener("click", closeEditor);
    $("story-form").addEventListener("submit", saveStory);
    $("docx-import").addEventListener("change", importDocx);
    $("story-image").addEventListener("change", previewImage);
    $("remove-image").addEventListener("click", () => {
      removeCurrentImage = true; currentImageUrl = ""; $("story-image").value = "";
      show($("image-preview"), false); show($("image-preview-empty"), true); show($("remove-image"), false);
    });
    $("category-form").addEventListener("submit", addCategory);
    $("admin-category-list").addEventListener("click", deleteCategoryAction);
    $("admin-story-list").addEventListener("click", adminStoryAction);
  }

  async function loadPublicData() {
    try {
      const [cats, rows] = await Promise.all([
        db.from("categories").select("id,name").order("name"),
        db.from("stories").select("id,title,summary,content,author,location,source,year_label,image_url,category_id,published,created_at").eq("published", true).order("created_at", {ascending:false})
      ]);
      if (cats.error) throw cats.error; if (rows.error) throw rows.error;
      categories = cats.data || []; stories = rows.data || [];
      populateCategoryControls(); renderStories();
    } catch (err) {
      console.error(err);
      $("story-grid").innerHTML = '<div class="loading">Chưa tải được thư viện. Hãy kiểm tra cấu hình Supabase và chính sách RLS trong hướng dẫn README.</div>';
      $("story-count").textContent = "Lỗi kết nối";
    }
  }

  function populateCategoryControls() {
    const current = $("category-filter").value;
    $("category-filter").innerHTML = '<option value="">Tất cả thể loại</option>' + categories.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");
    if (categories.some(c => c.id === current)) $("category-filter").value = current;
    $("category-chips").innerHTML = `<button class="chip ${!current ? "active" : ""}" data-category="">Tất cả</button>` +
      categories.map(c => `<button class="chip ${current === c.id ? "active" : ""}" data-category="${c.id}">${escapeHTML(c.name)}</button>`).join("");
    $("story-category").innerHTML = '<option value="">Chọn thể loại</option>' + categories.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");
  }

  function renderStories() {
    const q = $("search-input").value.trim().toLocaleLowerCase("vi");
    const cat = $("category-filter").value;
    const list = stories.filter(s => (!cat || s.category_id === cat) &&
      (!q || [s.title,s.summary,s.author,s.location,categoryName(s.category_id)].some(v => String(v || "").toLocaleLowerCase("vi").includes(q))));
    $("story-count").textContent = `${list.length} câu chuyện`;
    $("story-grid").innerHTML = list.map(s => `
      <article class="story-card" data-story-id="${s.id}" tabindex="0" role="button" aria-label="Đọc ${escapeHTML(s.title)}">
        <div class="story-cover">${s.image_url ? `<img src="${escapeHTML(s.image_url)}" alt="Ảnh bìa ${escapeHTML(s.title)}" loading="lazy">` : `<span class="cover-placeholder">❧</span>`}</div>
        <div class="story-card-body"><span class="story-tag">${escapeHTML(categoryName(s.category_id))}</span>
          <h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.summary || plain(s.content).slice(0,220))}</p>
          <div class="story-card-foot"><span>${escapeHTML(s.location || s.author || "Di sản dân gian")}</span><span class="read-link">Đọc truyện ↗</span></div>
        </div>
      </article>`).join("");
    show($("empty-state"), list.length === 0);
  }

  function openReader(id) {
    const s = stories.find(x => x.id === id); if (!s) return;
    $("modal-title").textContent = s.title;
    $("reader-category").textContent = categoryName(s.category_id);
    $("reader-meta").textContent = [s.author && `Người sưu tầm: ${s.author}`, s.location && `Địa danh: ${s.location}`, s.year_label].filter(Boolean).join(" · ");
    $("reader-body").textContent = storyText(s);
    $("reader-source").textContent = s.source ? `Nguồn tư liệu: ${s.source}` : "";
    const img = $("reader-image");
    if (s.image_url) { img.src = s.image_url; img.alt = `Ảnh bìa ${s.title}`; show(img, true); } else show(img, false);
    show($("story-modal"));
  }

  async function login(e) {
    e.preventDefault(); $("login-message").textContent = "";
    if (!db) { $("login-message").textContent = "Bé cần cấu hình Supabase trước."; return; }
    const {error} = await db.auth.signInWithPassword({email:$("login-email").value.trim(), password:$("login-password").value});
    if (error) { $("login-message").textContent = "Đăng nhập chưa thành công. Hãy kiểm tra email, mật khẩu và tài khoản đã được cấp quyền quản trị."; return; }
    await checkAdminSession();
  }

  async function checkAdminSession() {
    if (!db) return;
    const {data:{user}} = await db.auth.getUser();
    if (!user) { show($("admin-login-view"), true); show($("admin-dashboard"), false); return; }
    const {data, error} = await db.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error || !data) {
      await db.auth.signOut();
      show($("admin-login-view"), true); show($("admin-dashboard"), false);
      $("login-message").textContent = "Tài khoản này chưa được cấp quyền quản trị. Hãy làm theo bước cấp quyền trong README.";
      return;
    }
    show($("admin-login-view"), false); show($("admin-dashboard"), true);
    await loadAdminData();
  }

  async function logout() { if (db) await db.auth.signOut(); show($("admin-dashboard"), false); show($("admin-login-view"), true); notify("Đã đăng xuất."); }
  async function loadAdminData() {
    const [catRes, storyRes] = await Promise.all([
      db.from("categories").select("id,name").order("name"),
      db.from("stories").select("*").order("created_at", {ascending:false})
    ]);
    if (catRes.error || storyRes.error) { notify("Không tải được dữ liệu quản trị. Kiểm tra SQL/RLS."); return; }
    categories = catRes.data || []; stories = storyRes.data || [];
    populateCategoryControls(); renderStories(); renderAdminStories(); renderAdminCategories();
  }
  function switchTab(name) {
    document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    show($("stories-tab"), name === "stories"); show($("categories-tab"), name === "categories");
  }

  function renderAdminStories() {
    $("admin-story-list").innerHTML = stories.map(s => `<div class="admin-story-row">
      ${s.image_url ? `<img src="${escapeHTML(s.image_url)}" alt="">` : `<div class="admin-story-thumb">❧</div>`}
      <div class="admin-row-main"><b>${escapeHTML(s.title)}</b><small>${escapeHTML(categoryName(s.category_id))} · ${s.published ? "Đã xuất bản" : "Bản nháp"}</small></div>
      <div class="admin-row-actions"><button class="small-button" data-action="edit" data-id="${s.id}">Sửa</button>
      <button class="small-button" data-action="toggle" data-id="${s.id}">${s.published ? "Ẩn" : "Xuất bản"}</button>
      <button class="small-button danger" data-action="delete" data-id="${s.id}">Xóa</button></div>
    </div>`).join("") || '<p class="muted">Chưa có truyện. Bấm “Thêm truyện” để bắt đầu.</p>';
  }

  function openEditor(story) {
    editingStory = story || null; removeCurrentImage = false; currentImageUrl = story?.image_url || "";
    $("story-form").reset(); $("story-id").value = story?.id || "";
    $("story-title").value = story?.title || ""; $("story-category").value = story?.category_id || "";
    $("story-author").value = story?.author || ""; $("story-location").value = story?.location || "";
    $("story-year").value = story?.year_label || ""; $("story-summary").value = story?.summary || "";
    $("story-content").value = story?.content || ""; $("story-source").value = story?.source || "";
    $("story-published").checked = Boolean(story?.published);
    $("editor-heading").textContent = story ? "Chỉnh sửa truyện" : "Thêm truyện mới";
    $("editor-message").textContent = ""; $("story-image").value = "";
    if (currentImageUrl) { $("image-preview").src = currentImageUrl; show($("image-preview"), true); show($("image-preview-empty"), false); show($("remove-image"), true); }
    else { show($("image-preview"), false); show($("image-preview-empty"), true); show($("remove-image"), false); }
    show($("story-form"), true); $("story-form").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function closeEditor() { show($("story-form"), false); editingStory = null; $("story-form").reset(); }
  function previewImage() {
    const file = $("story-image").files[0]; if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { notify("Chỉ nhận ảnh JPG, PNG hoặc WebP."); $("story-image").value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { notify("Ảnh tối đa 5 MB."); $("story-image").value = ""; return; }
    $("image-preview").src = URL.createObjectURL(file); show($("image-preview"), true); show($("image-preview-empty"), false); show($("remove-image"), true);
    removeCurrentImage = false;
  }

  async function saveStory(e) {
    e.preventDefault();
    if (!db) return;
    const btn = $("save-story"); btn.disabled = true; btn.textContent = "Đang lưu…";
    try {
      let imageUrl = removeCurrentImage ? null : currentImageUrl;
      const file = $("story-image").files[0];
      if (file) {
        const ext = file.name.split(".").pop().toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const {error:upErr} = await db.storage.from("story-images").upload(path, file, {upsert:false,contentType:file.type});
        if (upErr) throw upErr;
        const {data:urlData} = db.storage.from("story-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const payload = {
        title:$("story-title").value.trim(), category_id:$("story-category").value || null,
        author:$("story-author").value.trim() || null, location:$("story-location").value.trim() || null,
        year_label:$("story-year").value.trim() || null, summary:$("story-summary").value.trim() || null,
        content:$("story-content").value.trim(), source:$("story-source").value.trim() || null,
        image_url:imageUrl, published:$("story-published").checked
      };
      if (editingStory) {
        const {error} = await db.from("stories").update(payload).eq("id", editingStory.id); if (error) throw error;
      } else {
        const {error} = await db.from("stories").insert(payload); if (error) throw error;
      }
      closeEditor(); await loadAdminData(); notify("Đã lưu truyện thành công.");
    } catch (err) { console.error(err); $("editor-message").textContent = "Lưu chưa thành công: " + (err.message || "Kiểm tra kết nối/quyền truy cập."); }
    finally { btn.disabled = false; btn.textContent = "Lưu truyện"; }
  }

  async function adminStoryAction(e) {
    const btn = e.target.closest("button[data-action]"); if (!btn) return;
    const s = stories.find(x => x.id === btn.dataset.id); if (!s) return;
    if (btn.dataset.action === "edit") { openEditor(s); return; }
    if (btn.dataset.action === "toggle") {
      const {error} = await db.from("stories").update({published:!s.published}).eq("id",s.id);
      if (error) { notify("Không cập nhật được: " + error.message); return; }
      await loadAdminData(); notify(s.published ? "Đã chuyển truyện thành bản nháp." : "Đã xuất bản truyện."); return;
    }
    if (btn.dataset.action === "delete" && confirm(`Xóa truyện “${s.title}”? Thao tác này không thể hoàn tác.`)) {
      const {error} = await db.from("stories").delete().eq("id",s.id);
      if (error) { notify("Không xóa được: " + error.message); return; }
      await loadAdminData(); notify("Đã xóa truyện.");
    }
  }

  async function importDocx(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!window.mammoth) { notify("Chưa tải được công cụ đọc Word. Hãy kiểm tra kết nối Internet."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { notify("File Word tối đa 10 MB."); e.target.value = ""; return; }
    try {
      const buffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({arrayBuffer:buffer});
      const text = result.value.trim();
      if (!text) { notify("Không tìm thấy văn bản trong file Word."); return; }
      openEditor(null);
      const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const filename = file.name.replace(/\.docx$/i,"");
      $("story-title").value = lines[0]?.length < 180 ? lines[0] : filename;
      $("story-content").value = lines.length > 1 ? lines.slice(1).join("\n\n") : text;
      if (lines.length === 1 || lines[0].length >= 180) $("story-content").value = text;
      $("story-summary").value = plain(text).slice(0,300);
      $("editor-message").textContent = "Đã nhập văn bản từ Word. Hãy kiểm tra tiêu đề, nội dung, nguồn tư liệu và thể loại trước khi lưu.";
      notify("Đã nhập nội dung Word vào biểu mẫu nháp.");
    } catch (err) { console.error(err); notify("Không đọc được file. Hãy kiểm tra đó là file .docx hợp lệ."); }
    finally { e.target.value = ""; }
  }

  async function addCategory(e) {
    e.preventDefault(); const name = $("new-category-name").value.trim(); if (!name) return;
    const {error} = await db.from("categories").insert({name});
    if (error) { notify(error.code === "23505" ? "Thể loại này đã tồn tại." : "Không thêm được thể loại: " + error.message); return; }
    $("new-category-name").value = ""; await loadAdminData(); notify("Đã thêm thể loại.");
  }
  async function deleteCategoryAction(e) {
    const btn = e.target.closest("[data-delete-category]"); if (!btn) return;
    const c = categories.find(x => x.id === btn.dataset.deleteCategory); if (!c) return;
    if (stories.some(s => s.category_id === c.id)) { notify("Thể loại đang có truyện sử dụng. Hãy chuyển truyện trước."); return; }
    if (!confirm(`Xóa thể loại “${c.name}”?`)) return;
    const {error} = await db.from("categories").delete().eq("id",c.id);
    if (error) { notify("Không xóa được thể loại: " + error.message); return; }
    await loadAdminData(); notify("Đã xóa thể loại.");
  }
  function renderAdminCategories() {
    $("admin-category-list").innerHTML = categories.map(c => `<div class="admin-story-row"><div class="admin-row-main"><b>${escapeHTML(c.name)}</b><small>${stories.filter(s=>s.category_id===c.id).length} truyện đang gắn thể loại này</small></div><div class="admin-row-actions"><button class="small-button danger" data-delete-category="${c.id}">Xóa</button></div></div>`).join("");
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { show($("story-modal"), false); show($("admin-modal"), false); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".story-card")) { e.preventDefault(); openReader(e.target.dataset.storyId); }
  });

  const script = document.createElement("script"); script.src = "config.js"; script.onload = init; script.onerror = init; document.head.appendChild(script);
})();