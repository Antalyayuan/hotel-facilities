console.log("rooms.js loaded");

const pageTitle = document.getElementById("pageTitle");
const subTitle = document.getElementById("subTitle");
const roomsStatus = document.getElementById("roomsStatus");
const roomsTableWrap = document.getElementById("roomsTableWrap");
const tableError = document.getElementById("tableError");


const addRoomForm = document.getElementById("addRoomForm");
const roomNumberEl = document.getElementById("roomNumber");
const roomStatusEl = document.getElementById("roomStatus");
const roomError = document.getElementById("roomError");
const btnReload = document.getElementById("btnReload");

function qsParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}
function setTableError(msg = "") {
    if (!tableError) return;
    tableError.textContent = msg;
}

function setRoomsStatus(t) {
    roomsStatus.textContent = t;
}

function renderTable(rooms) {
    if (!rooms.length) {
        roomsTableWrap.innerHTML = `<div class="muted">No rooms yet.</div>`;
        return;
    }

    const rows = rooms.map(r => `
    <tr data-id="${r.id}">
      <td><b>${r.room_number}</b></td>
      <td>
        <select data-action="status">
          <option value="available" ${r.status === 'available' ? 'selected' : ''}>available</option>
          <option value="occupied" ${r.status === 'occupied' ? 'selected' : ''}>occupied</option>
          <option value="maintenance" ${r.status === 'maintenance' ? 'selected' : ''}>maintenance</option>
        </select>
      </td>
      <td style="text-align:right">
        <button class="btn btn-ghost btn-danger" data-action="delete">Delete</button>
      </td>
    </tr>
  `).join("");

    roomsTableWrap.innerHTML = `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="text-align:left; color:#6b7280; font-size:12px;">
          <th style="padding:10px 6px;">Room</th>
          <th style="padding:10px 6px;">Status</th>
          <th style="padding:10px 6px; text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

    // 给 select 增加跟 styles 一致的外观
    roomsTableWrap.querySelectorAll("select").forEach(sel => {
        sel.style.border = "1px solid var(--border)";
        sel.style.borderRadius = "10px";
        sel.style.padding = "8px 10px";
        sel.style.background = "#fff";
    });
}

async function load() {
    const roomTypeId = qsParam("roomTypeId");
    if (!roomTypeId) {
        pageTitle.textContent = "Manage Rooms";
        subTitle.textContent = "Missing roomTypeId in URL.";
        return;
    }

    setRoomsStatus("Loading rooms...");
    const data = await apiFetch(`/api/room-types/${roomTypeId}/rooms`);

    const rt = data.room_type;
    const rooms = data.rooms || [];

    pageTitle.textContent = `Manage Rooms — ${rt.name}`;
    subTitle.textContent = `£${Number(rt.price_per_night).toFixed(2)} / night · Max ${rt.max_occupancy} · Status: ${rt.status}`;
    setRoomsStatus(`Loaded ${rooms.length} room(s).`);

    roomError.textContent = "";   // 清新增表单的错误
    setTableError("");            // 清表格区域的错误


    renderTable(rooms);
}

roomsTableWrap.addEventListener("change", async (e) => {
    const sel = e.target.closest('select[data-action="status"]');
    if (!sel) return;

    const tr = e.target.closest("tr");
    const id = tr.dataset.id;
    const status = sel.value;

    try {
        await apiFetch(`/api/rooms/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
    } catch (err) {
        setTableError(err.message);
    }
});

roomsTableWrap.addEventListener("click", async (e) => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;

    const tr = e.target.closest("tr");
    const id = tr.dataset.id;

    // 清掉旧错误
    setTableError("");

    // 前端先挡一次（体验更好）
    const status = tr.querySelector('select[data-action="status"]').value;
    if (status === 'occupied') {
        setTableError('Cannot delete an occupied room. Change status first.');
        return;
    }

    try {
        await apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
        await load();
    } catch (err) {
        setTableError(err.message);
    }
});


addRoomForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    roomError.textContent = "";

    const roomTypeId = qsParam("roomTypeId");
    const payload = {
        room_number: roomNumberEl.value.trim(),
        status: roomStatusEl.value,
    };

    try {
        await apiFetch(`/api/room-types/${roomTypeId}/rooms`, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        roomNumberEl.value = "";
        roomStatusEl.value = "available";
        await load();
    } catch (err) {
        if (err.status === 422 && err.errors) {
            const firstKey = Object.keys(err.errors)[0];
            roomError.textContent = err.errors[firstKey]?.[0] || err.message;
        } else {
            roomError.textContent = err.message;
        }
    }
});

btnReload.addEventListener("click", load);

load().catch(err => {
    console.error(err);
    setRoomsStatus("Failed: " + err.message);
});
