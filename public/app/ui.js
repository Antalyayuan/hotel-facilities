function money(v) {
    const n = Number(v || 0);
    return `£${n.toFixed(2)}`;
}

function badgeHtml(status) {
    const cls = status === "active" ? "badge" : "badge inactive";
    return `<span class="${cls}">${status === "active" ? "Active" : "Inactive"}</span>`;
}

function amenitiesHtml(amenities) {
    const list = amenities || [];
    const shown = list.slice(0, 6);
    const more = list.length - shown.length;

    const items = shown.map(a => `<div>• ${a.name}</div>`).join("");
    const moreLine = more > 0 ? `<div class="amenity-more">+${more} more amenities</div>` : "";

    return `<div class="amenities">${items}${moreLine}</div>`;
}

function roomTypeCardHtml(rt) {
    const img = rt.image_url
        ? `<img src="${rt.image_url}" alt="${rt.name}">`
        : "";

    return `
  <div class="room-card card" data-id="${rt.id}">
    <div class="thumb">
      ${img}
      ${badgeHtml(rt.status)}
    </div>
    <div class="room-body">
      <h3 class="title">${rt.name}</h3>
      <div class="desc">${rt.description || ""}</div>

      <div class="price-row">
        <div>
          <div class="price">${money(rt.price_per_night)}</div>
          <div class="small">/ night</div>
        </div>
        <div class="small">Max <b>${rt.max_occupancy}</b></div>
      </div>

      <div class="meta">
        <div><b>${rt.total_rooms}</b> Total Rooms</div>
        <div class="ok">${rt.available_rooms} Available</div>
      </div>

      <div class="small" style="margin-bottom:8px;color:#6b7280">Amenities</div>
      ${amenitiesHtml(rt.amenities)}
    </div>

    <div class="actions">
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" data-action="edit" data-id="${rt.id}">Edit</button>
      </div>
      <button class="btn btn-primary" data-action="rooms" data-id="${rt.id}">Manage Rooms</button>
    </div>

  </div>
  `;
}

function renderAmenityCheckboxes(container, amenities, selectedIds = []) {
    container.innerHTML = "";
    for (const a of amenities) {
        const checked = selectedIds.includes(a.id) ? "checked" : "";
        container.insertAdjacentHTML("beforeend", `
      <label class="chk">
        <input type="checkbox" value="${a.id}" ${checked} />
        ${a.name}
      </label>
    `);
    }
}
