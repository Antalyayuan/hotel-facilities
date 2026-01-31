async function apiFetch(path, options = {}) {
    const opts = { ...options };
    opts.headers = opts.headers || {};

    const isFormData = opts.body instanceof FormData;

    if (!isFormData) {
        opts.headers["Content-Type"] = "application/json";
    }
    opts.headers["Accept"] = "application/json";

    const res = await fetch(path, opts);

    if (res.status === 204) return null;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const message = data?.message || `Request failed (${res.status})`;
        const errors = data?.errors || null;
        const err = new Error(message);
        err.status = res.status;
        err.errors = errors;
        throw err;
    }

    return data;
}


const RoomTypesAPI = {
    list: ({ status = "", search = "", page = 1 } = {}) => {
        const qs = new URLSearchParams();
        if (status) qs.set("status", status);
        if (search) qs.set("search", search);
        qs.set("page", String(page));
        return apiFetch(`/api/room-types?${qs.toString()}`);
    },

    // ✅ body 直接传 fd，不 JSON.stringify
    create: (body) => apiFetch("/api/room-types", { method: "POST", body }),

    // ✅ update 用 POST + _method=PUT（更稳定）
    update: (id, body) => apiFetch(`/api/room-types/${id}`, { method: "POST", body }),

    remove: (id) => apiFetch(`/api/room-types/${id}`, { method: "DELETE" }),
};


const AmenitiesAPI = {
    list: () => apiFetch("/api/amenities"),
};
