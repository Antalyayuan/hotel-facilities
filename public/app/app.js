console.log("app.js loaded");
const listError = document.getElementById("listError");
const grid = document.getElementById("grid");
const statusLine = document.getElementById("statusLine");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const sortByEl = document.getElementById("sortBy");


const btnAdd = document.getElementById("btnAdd");
const btnRefresh = document.getElementById("btnRefresh");

const modalOverlay = document.getElementById("modalOverlay");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancel = document.getElementById("btnCancel");
const modalTitle = document.getElementById("modalTitle");
const form = document.getElementById("roomTypeForm");
const formError = document.getElementById("formError");

const roomTypeIdEl = document.getElementById("roomTypeId");
const nameEl = document.getElementById("name");
const statusEl = document.getElementById("status");
const priceEl = document.getElementById("price_per_night");
const maxOccEl = document.getElementById("max_occupancy");

const descEl = document.getElementById("description");
const amenityBox = document.getElementById("amenityCheckboxes");
const imageEl = document.getElementById("image_url");
const imageFileEl = document.getElementById("imageFile");
const imagePreview = document.getElementById("imagePreview");
let currentImageUrl = "";
let currentSavedImageUrl = "";   // 当前房型“已保存的最终显示图片”（打开 modal 时设置）
let objectUrlToRevoke = null;    // 预览用的 blob URL（避免内存泄露）

let allRoomTypes = [];   // 缓存 API 原始数据
let currentSort = "";    // "", "price_asc", "price_desc"


let allAmenities = [];
let debounceTimer = null;

function setListError(msg = "") {
    if (!listError) return;
    listError.textContent = msg;
}
function setStatus(text) {
    if (statusLine) statusLine.textContent = text;
}
function openModal({ mode, roomType = null }) {
    formError.textContent = "";

    // 打开前：清理 file input + 预览
    imageFileEl.value = "";
    setPreview(""); // 会负责隐藏/清理 blob url
    modalOverlay.classList.remove("hidden");

    if (mode === "create") {
        modalTitle.textContent = "Add Room Type";
        roomTypeIdEl.value = "";
        nameEl.value = "";
        statusEl.value = "active";
        priceEl.value = "0.00";
        maxOccEl.value = "2";
        imageEl.value = "";
        descEl.value = "";

        currentSavedImageUrl = "";
        renderAmenityCheckboxes(amenityBox, allAmenities, []);
        return;
    }

    // edit
    modalTitle.textContent = "Edit Room Type";
    roomTypeIdEl.value = roomType.id;
    nameEl.value = roomType.name || "";
    statusEl.value = roomType.status || "active";
    priceEl.value = Number(roomType.price_per_night || 0).toFixed(2);
    maxOccEl.value = String(roomType.max_occupancy || 2);
    descEl.value = roomType.description || "";

    currentSavedImageUrl = roomType.image_url || "";

    // Image URL 输入框：只显示外链（否则留空，避免 “不是合法URL” 的校验问题）
    imageEl.value = /^https?:\/\//i.test(currentSavedImageUrl) ? currentSavedImageUrl : "";

    // 预览：统一走 setPreview（不要再手动改 imagePreview.src）
    setPreview(currentSavedImageUrl);

    const selectedIds = (roomType.amenities || []).map(a => a.id);
    renderAmenityCheckboxes(amenityBox, allAmenities, selectedIds);
}

function closeModal() {
    modalOverlay.classList.add("hidden");

    formError.textContent = "";

    // 清空输入
    imageEl.value = "";
    imageFileEl.value = "";

    // 清预览（会自动 revoke blob url）
    setPreview("");

    currentSavedImageUrl = "";
}





function readAmenityIds() {
    const ids = [];
    amenityBox.querySelectorAll('input[type="checkbox"]:checked')
        .forEach(chk => ids.push(Number(chk.value)));
    return ids;
}

async function loadAmenities() {
    // 需要 /api/amenities 返回数组
    allAmenities = await AmenitiesAPI.list();
}


// Load room types with server-side filter + client-side sort
async function loadRoomTypes() {
    setStatus("Loading room types...");
    grid.innerHTML = "";

    try {
        const status = statusFilter.value;
        const search = searchInput.value.trim();

        const res = await RoomTypesAPI.list({ status, search, page: 1 });

        // 兼容：后端可能返回 {data:[...]} 或直接返回 [...]
        const list = Array.isArray(res) ? res : (res.data || []);

        //  加：排序
        const sort = sortByEl.value;
        if (sort === "price_asc") {
            list.sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
        } else if (sort === "price_desc") {
            list.sort((a, b) => Number(b.price_per_night) - Number(a.price_per_night));
        }

        if (!list.length) {
            setStatus("No room types found.");
            grid.innerHTML = `<div class="muted">No data.</div>`;
            return;
        }

        setStatus(`Loaded ${list.length} room type(s).`);
        setListError("");

        grid.innerHTML = list.map(roomTypeCardHtml).join("");
    } catch (e) {
        console.error(e);
        setStatus("Failed to load.");
        grid.innerHTML = `<div class="muted">Error: ${e.message}</div>`;
    }
}


function bindGridActions() {
    grid.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const id = Number(btn.dataset.id);

        if (!id || Number.isNaN(id)) {
            setListError("Internal error: missing room type id on button.");
            console.warn("Missing data-id on button:", btn);
            return;
        }

        if (action === "rooms") {
            window.location.href = `/app/rooms.html?roomTypeId=${id}`;
            return;
        }

        if (action === "edit") {
            try {
                setListError("");
                const detail = await apiFetch(`/api/room-types/${id}`);
                openModal({ mode: "edit", roomType: detail.data ?? detail });
                // ↑ 如果你 GET /api/room-types/{id} 返回 {data:{...}} 用 detail.data
                //   如果直接返回 {...} 用 detail
            } catch (err) {
                setListError(err.message);
            }
            return;
        }

        if (action === "delete") {
            try {
                setListError("");
                await RoomTypesAPI.remove(id);
                await loadRoomTypes();
            } catch (err) {
                setListError(err.message);
            }
        }
    });
}

function bindFilters() {
    statusFilter.addEventListener("change", loadRoomTypes);

    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadRoomTypes, 250);
    });

    sortByEl.addEventListener("change", loadRoomTypes);


    btnRefresh.addEventListener("click", loadRoomTypes);
}
function setPreview(src, { isObjectUrl = false } = {}) {
    // 只有在要切换预览时，才释放旧的 blob url
    if (objectUrlToRevoke && (!isObjectUrl || src !== objectUrlToRevoke)) {
        URL.revokeObjectURL(objectUrlToRevoke);
        objectUrlToRevoke = null;
    }

    if (!src) {
        imagePreview.style.display = "none";
        imagePreview.src = "";
        return;
    }

    // 如果这次传入的是 blob url，记录它，等下次再释放
    if (isObjectUrl) {
        objectUrlToRevoke = src;
    }

    imagePreview.src = src;
    imagePreview.style.display = "block";
}


function bindModal() {
    btnAdd.addEventListener("click", () => openModal({ mode: "create" }));
    btnCloseModal.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    imageFileEl.addEventListener("change", () => {
        const file = imageFileEl.files?.[0];

        if (!file) {
            const v = imageEl.value.trim();
            if (v && /^https?:\/\//i.test(v)) setPreview(v);
            else setPreview(currentSavedImageUrl);
            return;
        }

        // ✅ 选了文件：建议清空 URL，避免冲突
        imageEl.value = "";

        const blobUrl = URL.createObjectURL(file);
        setPreview(blobUrl, { isObjectUrl: true });

        console.log("file change fired", imageFileEl.files);
        console.log("preview img exists?", imagePreview);

    });

    imageEl.addEventListener("input", () => {
        const v = imageEl.value.trim();

        // 如果用户选了 file，就让 file 优先（你已有）
        if (imageFileEl.files?.[0]) return;

        if (!v) return setPreview(currentSavedImageUrl);

        if (/^https?:\/\//i.test(v)) setPreview(v);
        else setPreview(currentSavedImageUrl);
    });





    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        formError.textContent = "";

        // ✅ 前端手动校验（配合 form novalidate）
        const name = nameEl.value.trim();
        if (!name) {
            formError.textContent = "Name is required.";
            nameEl.focus();
            return;
        }

        // ✅ 用 FormData 提交（支持文件）
        const fd = new FormData();
        fd.append("name", name);
        fd.append("status", statusEl.value);
        fd.append("price_per_night", priceEl.value);
        fd.append("max_occupancy", maxOccEl.value);

        const imageUrl = imageEl.value.trim();
        if (imageUrl) fd.append("image_url", imageUrl);

        const desc = descEl.value.trim();
        if (desc) fd.append("description", desc);

        // amenities（多值）
        readAmenityIds().forEach((id) => fd.append("amenity_ids[]", String(id)));

        // file
        if (imageFileEl?.files?.[0]) {
            fd.append("image", imageFileEl.files[0]);
        }

        try {
            const id = roomTypeIdEl.value;

            if (!id) {
                // ✅ 把 fd 传进去
                await RoomTypesAPI.create(fd);
            } else {
                // ✅ Laravel 有些环境 PUT + multipart 会麻烦，推荐 method override
                fd.append("_method", "PUT");
                await RoomTypesAPI.update(id, fd);
            }

            formError.textContent = "";
            closeModal();
            await loadRoomTypes();
        } catch (err) {
            if (err.status === 422 && err.errors) {
                const firstKey = Object.keys(err.errors)[0];
                formError.textContent = err.errors[firstKey]?.[0] || err.message;
            } else {
                formError.textContent = err.message;
            }
        }
    });
}


(async function init() {
    console.log("init: start");
    try {
        console.log("init: before loadAmenities");
        await loadAmenities();
        console.log("init: after loadAmenities", allAmenities?.length);

        bindGridActions();
        bindFilters();
        bindModal();

        console.log("init: before loadRoomTypes");
        await loadRoomTypes();
        console.log("init: after loadRoomTypes");
    } catch (e) {
        console.error("init failed:", e);
        setStatus("Init failed: " + e.message);
    }
})();
