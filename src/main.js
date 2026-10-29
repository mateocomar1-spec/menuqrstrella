import "./style.css";
import {
  money,
  escapeHTML as h,
  safeImage,
  makeLine,
  orderMessage,
  validateMenu,
} from "./domain.js";
import {
  connected,
  client,
  loadMenu,
  isAdmin,
  saveMenu,
  uploadImage,
  getMenuVersion,
} from "./data.js";
const app = document.querySelector("#app");
let menu,
  draft,
  draftVersion,
  admin = false,
  category = "pizzas",
  search = "",
  cart = [],
  selection = null,
  busy = false,
  dirty = false;
let panelView = "products",
  adminSearch = "",
  adminCategory = "all",
  adminAvailability = "all";
const sizes = new Map();
const checkoutDetails = {
  name: "",
  phone: "",
  address: "",
  note: "",
  delivery: "pickup",
};
const isPanel = () => location.hash.startsWith("#admin");
const icons = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  edit: '<path d="m15 4 5 5M4 20l4-1L21 6l-5-5L3 14l-1 7Z"/>',
  photo:
    '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/>',
  cart: '<path d="M2 3h3l3 13h12l2-10H6"/><circle cx="10" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>',
  box: '<path d="m4 7 8-4 8 4v12l-8 3-8-3V7Zm0 0 8 4 8-4M12 11v11"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  store: '<path d="M3 10h18l-2-7H5l-2 7Zm2 0v11h14V10M9 21v-7h6v7"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
};
const svg = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.box}</svg>`;
const demoBanner = () =>
  !connected
    ? '<div class="demo">Demostración · Los cambios duran hasta recargar. No se envían pedidos reales.</div>'
    : "";
const brand = () =>
  `<span class="brand-name">${h(menu?.settings.name || "LA PICCOLINA")}</span><span class="brand-sub">Pizzas y empanadas</span>`;
const footer = () =>
  '<footer><span>Elegí. Compartí. Disfrutá.</span><a href="https://strellaestudio.com.ar" target="_blank" rel="noopener noreferrer">Un menú de <b>STRELLA</b> ↗</a></footer>';
function toast(text) {
  let el = document.querySelector("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = text;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.remove(), 5000);
}
function shell(content) {
  app.innerHTML = `${demoBanner()}<div class="public-shell"><header class="public-header"><a class="brand" href="#" aria-label="Volver al menú">${brand()}</a><div class="header-right"><div class="service-state"><span class="status ${menu?.settings.open ? "" : "closed"}">● ${menu?.settings.open ? "Abierto" : "Cerrado"}</span><small>Retiro${menu?.settings.delivery ? " · Delivery" : ""}</small></div><a class="icon-button" href="#admin" aria-label="Administrar el menú">☰</a></div></header>${content}${footer()}</div>`;
}
function photo(p, small = false) {
  const url = safeImage(p.image);
  return url
    ? `<img class="${small ? "thumb" : "product-image"}" src="${h(url)}" alt="${h(p.name)}" loading="lazy">`
    : `<div class="${small ? "thumb" : "product-image"} photo-placeholder" aria-label="Producto sin foto">${svg("photo")}${small ? "" : "<span>Sin foto</span>"}</div>`;
}
function card(p) {
  const enabled = p.available && menu.settings.open;
  const size = sizes.get(p.id) || "Grande";
  return `<article class="product ${!p.available ? "sold" : ""}"><div class="product-body"><h3>${h(p.name.toLocaleLowerCase("es-AR"))}</h3><p>${h(p.description)}</p><div class="product-bottom">${
    p.small !== null
      ? `<div class="size-options" role="group" aria-label="Tamaño de ${h(p.name)}">${[
          ["Chica", p.small],
          ["Grande", p.large],
        ]
          .map(
            ([label, price]) =>
              `<button class="size-option ${size === label ? "selected" : ""}" data-select-size="${h(p.id)}" data-size="${label}" aria-pressed="${size === label}" ${enabled ? "" : "disabled"}><span>${label}</span><b>${money(price)}</b></button>`,
          )
          .join("")}</div>`
      : `<span class="price">${p.price !== null ? money(p.price) : "Precio pendiente"}</span>`
  }</div></div><div class="product-visual">${photo(p)}${p.available ? `<button class="add" data-add="${h(p.id)}" aria-label="Agregar ${h(p.name)} al pedido" ${enabled ? "" : "disabled"}>+</button>` : '<span class="sold-badge">Agotado</span>'}</div></article>`;
}
function renderProducts() {
  const list = document.querySelector("#products");
  if (!list) return;
  const filtered = menu.products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  list.innerHTML = filtered.length
    ? filtered.map(card).join("")
    : '<div class="empty"><h3>No encontramos productos</h3><p>Probá con otro nombre o elegí otra categoría.</p></div>';
  document.querySelector("#result-count").textContent =
    `${filtered.length} productos`;
  document.querySelector("#category-title").textContent =
    category === "all"
      ? "Toda la carta"
      : menu.categories.find((c) => c.id === category)?.name || "Nuestra carta";
}
function renderPublic() {
  document.body.classList.remove("admin-mode");
  if (!menu.settings.active) {
    shell(
      '<main class="maintenance"><h1>Volvemos enseguida.</h1><p>Estamos actualizando nuestro menú. Gracias por esperarnos.</p></main>',
    );
    return;
  }
  const categories = menu.categories.toSorted((a, b) => a.order - b.order);
  if (category !== "all" && !categories.some((c) => c.id === category))
    category = "all";
  shell(
    `<main class="menu-main"><div class="menu-navigation"><label class="search">${svg("search")}<input id="search" type="search" placeholder="Buscar en el menú" aria-label="Buscar productos" value="${h(search)}"></label><div class="categories" role="group" aria-label="Categorías">${[...categories, { id: "all", name: "Toda la carta" }].map((c) => `<button class="chip ${category === c.id ? "selected" : ""}" data-category="${h(c.id)}" aria-pressed="${category === c.id}">${h(c.name)}</button>`).join("")}</div></div>${!menu.settings.open ? '<aside class="notice">Ahora estamos cerrados. Podés consultar la carta y volver para hacer tu pedido cuando abramos.</aside>' : ""}${menu.settings.notice ? `<aside class="notice">${h(menu.settings.notice)}</aside>` : ""}<div class="section-heading"><h1 id="category-title"></h1><span id="result-count" class="result-count"></span></div><div id="products" class="products"></div></main><button class="cart-bar ${cart.length ? "" : "hidden"}" data-action="cart"><span>${svg("cart")}<strong>Ver pedido</strong><small>· ${cart.reduce((n, l) => n + l.qty, 0)} productos</small></span><span><b>${money(cart.reduce((n, l) => n + l.qty * l.price, 0))}</b>${svg("arrow")}</span></button>`,
  );
  renderProducts();
}
function field(label, name, value, type = "text", extra = "") {
  return `<label>${h(label)}<input name="${name}" type="${type}" value="${h(value)}" ${extra}></label>`;
}
function changeCount() {
  if (!draft) return 0;
  let count = draft.products.filter(
    (p) =>
      JSON.stringify(p) !==
      JSON.stringify(menu.products.find((x) => x.id === p.id)),
  ).length;
  count += draft.categories.filter(
    (c) =>
      JSON.stringify(c) !==
      JSON.stringify(menu.categories.find((x) => x.id === c.id)),
  ).length;
  count += Object.keys(draft.settings).filter(
    (k) => draft.settings[k] !== menu.settings[k],
  ).length;
  return count;
}
function syncChanges() {
  const count = changeCount();
  dirty = count > 0;
  document.querySelectorAll("[data-action=save]").forEach((b) => {
    b.textContent = busy
      ? "Guardando…"
      : count
        ? `Guardar ${count} ${count === 1 ? "cambio" : "cambios"}`
        : "Todo guardado";
    b.disabled = busy || !count;
  });
  const status = document.querySelector("#save-status");
  if (status)
    status.textContent = count
      ? "Tenés cambios pendientes. Se publican al guardar."
      : "Tu menú está al día.";
}
function toggle(label, name, value, extra = "") {
  return `<label class="switch"><span>${h(label)}</span><input type="checkbox" role="switch" name="${name}" ${value ? "checked" : ""} ${extra}><span class="switch-track" aria-hidden="true"></span></label>`;
}
function panelRows() {
  const products = draft.products.filter(
    (p) =>
      (adminCategory === "all" || p.category === adminCategory) &&
      (adminAvailability === "all" ||
        p.available === (adminAvailability === "available")) &&
      `${p.name} ${p.description}`
        .toLowerCase()
        .includes(adminSearch.toLowerCase()),
  );
  return (
    products
      .map(
        (p) =>
          `<tr data-product-row="${h(p.id)}"><td class="product-cell">${photo(p, true)}<div><strong>${h(p.name.toLocaleLowerCase("es-AR"))}</strong><small>${h(draft.categories.find((c) => c.id === p.category)?.name || "")}</small></div></td><td class="category-cell">${h(draft.categories.find((c) => c.id === p.category)?.name)}</td>${["price", "small", "large"].map((k) => `<td data-label="${k === "price" ? "Único" : k === "small" ? "Chica" : "Grande"}"><div class="price-input"><span>$</span><input aria-label="${k === "price" ? "Precio único" : k === "small" ? "Precio chica" : "Precio grande"} de ${h(p.name)}" type="number" min="0" step="1" inputmode="decimal" data-price="${h(p.id)}" data-key="${k}" placeholder="—" value="${p[k] ?? ""}" class="${p[k] !== menu.products.find((x) => x.id === p.id)?.[k] ? "changed" : ""}"></div></td>`).join("")}<td class="availability-cell">${toggle(p.available ? "Disponible" : "Agotado", "available", p.available, `data-available="${h(p.id)}" aria-label="Disponibilidad de ${h(p.name)}"`)}</td><td class="edit-cell"><button class="icon-button" data-edit="${h(p.id)}" aria-label="Editar ${h(p.name)}">${svg("edit")}<span>Editar</span></button></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="7" class="empty">No hay productos con esos filtros.</td></tr>'
  );
}
function renderPanelRows() {
  document.querySelector("#product-rows").innerHTML = panelRows();
}
function renderPanel() {
  document.body.classList.add("admin-mode");
  if (!admin) {
    app.innerHTML = `${demoBanner()}<main class="login-layout"><div class="login-brand"><a href="#" class="brand">${brand()}</a><div><span class="eyebrow">EL CONTROL DE TU CARTA</span><h1>Tu menú.<br>A tu manera.</h1><p>Precios, productos y disponibilidad,<br>en un solo lugar.</p></div><span>Una herramienta de STRELLA Estudio</span></div><section class="login"><a href="#" class="back-link">← Volver al menú</a><h2>Bienvenido de nuevo</h2><p>Ingresá para administrar tu local.</p><form id="login">${field("Email", "email", "", "email", 'required autocomplete="username"')}${field("Contraseña", "password", "", "password", 'required autocomplete="current-password"')}<button class="primary wide">Ingresar al panel →</button><p id="login-error" role="alert"></p></form></section></main>`;
    return;
  }
  const d = draft;
  app.innerHTML = `${demoBanner()}<div class="admin-layout"><aside class="sidebar"><a href="#" class="brand">${brand()}</a><nav class="admin-nav" aria-label="Administración">${[
    ["products", "box", "Productos"],
    ["categories", "grid", "Categorías"],
    ["settings", "store", "Local y delivery"],
  ]
    .map(
      ([view, icon, label]) =>
        `<button data-view="${view}" class="${panelView === view ? "active" : ""}" aria-current="${panelView === view ? "page" : "false"}">${svg(icon)}${label}</button>`,
    )
    .join(
      "",
    )}<a href="#" target="_blank" rel="noopener">${svg("external")}Ver menú ↗</a></nav><div class="sidebar-bottom"><span class="account-avatar">LP</span><span>Mi cuenta<small>${connected ? "Administrador" : "Demostración"}</small></span>${connected ? '<button data-action="logout" class="logout">Salir</button>' : ""}</div></aside><main class="panel"><header class="panel-heading"><div><span class="eyebrow">ADMINISTRACIÓN / ${panelView === "products" ? "CARTA" : panelView === "categories" ? "ORGANIZACIÓN" : "LOCAL"}</span><h1>${panelView === "products" ? "Productos y precios" : panelView === "categories" ? "Categorías" : "Local y delivery"}</h1><p>${panelView === "products" ? "Actualizá tu carta desde un solo lugar." : panelView === "categories" ? "Organizá cómo se muestra tu carta." : "La información que tus clientes necesitan."}</p></div><div class="panel-actions"><button class="primary" data-action="save"></button><button class="text-button" data-action="discard">Descartar cambios</button></div></header><div class="local-state" id="quick-settings">${toggle("Local abierto", "open", d.settings.open)}${toggle("Delivery activo", "delivery", d.settings.delivery)}<span class="connection">${connected ? "● Conectado" : "● Prueba local"}</span></div>
 ${panelView === "products" ? `<section class="panel-content"><div class="table-toolbar"><label class="search">${svg("search")}<input id="admin-search" type="search" placeholder="Buscar producto" aria-label="Buscar producto" value="${h(adminSearch)}"></label><select id="admin-category" aria-label="Filtrar por categoría"><option value="all">Todas las categorías</option>${d.categories.map((c) => `<option value="${h(c.id)}" ${adminCategory === c.id ? "selected" : ""}>${h(c.name)}</option>`).join("")}</select><select id="admin-availability" aria-label="Filtrar por disponibilidad"><option value="all" ${adminAvailability === "all" ? "selected" : ""}>Todos los estados</option><option value="available" ${adminAvailability === "available" ? "selected" : ""}>Disponibles</option><option value="sold" ${adminAvailability === "sold" ? "selected" : ""}>Agotados</option></select><button class="secondary" data-action="new">+ Agregar producto</button></div><div class="table-wrap"><table><caption class="sr-only">Precios y disponibilidad de los productos</caption><thead><tr><th>Producto</th><th>Categoría</th><th>Único</th><th>Chica</th><th>Grande</th><th>Disponible</th><th>Editar</th></tr></thead><tbody id="product-rows">${panelRows()}</tbody></table></div><p class="hint">Los campos vacíos indican que ese precio no se ofrece. Completá Chica y Grande juntos para vender por tamaño.</p></section>` : panelView === "categories" ? `<section class="settings-card"><div class="table-heading"><h2>Orden de las categorías</h2><button class="secondary" data-action="new-category">+ Nueva categoría</button></div><div class="category-editor">${d.categories.map((c) => `<div class="category-row"><label>Nombre<input data-cat-name="${h(c.id)}" value="${h(c.name)}" required></label><label>Orden<input type="number" min="0" data-cat-order="${h(c.id)}" value="${c.order}"></label><span>${d.products.filter((p) => p.category === c.id).length} productos</span></div>`).join("")}</div></section>` : `<section class="settings-card"><h2>Información del local</h2><form id="settings" class="settings-grid">${field("Nombre del local", "name", d.settings.name, "text", "required")}${field("WhatsApp (código de país + número)", "whatsapp", d.settings.whatsapp, "tel")}${field("Costo de envío ($)", "deliveryFee", d.settings.deliveryFee, "number", 'min="0" step="1"')}${field("Aviso para clientes", "notice", d.settings.notice)}${toggle("Menú visible", "active", d.settings.active)}</form><p class="hint">Al desactivar “Menú visible”, tus clientes verán un aviso de mantenimiento.</p></section>`}<div class="save-status"><span class="status-dot"></span><span id="save-status" role="status"></span></div></main></div>`;
  syncChanges();
  if (busy)
    document
      .querySelectorAll(".panel input,.panel select,.panel button")
      .forEach((el) => (el.disabled = true));
}
function modal(content, drawer = false) {
  document.querySelector("dialog")?.remove();
  const d = document.createElement("dialog");
  if (drawer) d.classList.add("drawer");
  d.innerHTML = `<button class="modal-close" aria-label="Cerrar" data-action="close">×</button>${content}`;
  document.body.append(d);
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  });
  d.addEventListener("close", () => {
    const preview = d.querySelector("#edit-photo-preview");
    if (preview?.dataset.objectUrl)
      URL.revokeObjectURL(preview.dataset.objectUrl);
    d.remove();
  });
  d.showModal();
}
function pick(id) {
  const p = menu.products.find((p) => p.id === id);
  selection = { p, flavors: {} };
  if (!p.bundle) {
    cart.push(makeLine(p, p.small !== null ? sizes.get(p.id) || "Grande" : ""));
    renderPublic();
    toast("Agregado a tu pedido");
    return;
  }
  modal(
    `<span class="eyebrow">ARMALO COMO TE GUSTA</span><h2>${h(p.name)}</h2><p>${h(p.description)}</p>${
      p.bundle
        ? `<p>Elegí ${p.bundle} empanadas en total.</p><div class="flavors">${menu.products
            .filter(
              (x) => x.category === "empanadas" && x.available && !x.bundle,
            )
            .map(
              (x) =>
                `<label>${h(x.name)}<input type="number" min="0" max="${p.bundle}" value="0" data-flavor="${h(x.id)}" aria-label="Cantidad de ${h(x.name)}"></label>`,
            )
            .join("")}</div><p id="flavor-total">0 de ${p.bundle} elegidas</p>`
        : `<label>Tamaño<select id="size"><option value="Grande">Grande · ${money(p.large)}</option><option value="Chica">Chica · ${money(p.small)}</option></select></label>`
    }<button class="primary wide" data-action="confirm-product" ${p.bundle ? "disabled" : ""}>Agregar al pedido →</button>`,
  );
}
function showCart() {
  if (!menu.settings.delivery) checkoutDetails.delivery = "pickup";
  modal(
    `<span class="eyebrow">CASI ESTAMOS</span><h2>Tu pedido</h2><div class="cart-items">${cart.map((l, i) => `<div class="cart-item"><div><strong>${h(l.name)}</strong><small>${h(l.flavors.map((f) => `${f.qty} ${f.name}`).join(", "))}</small><span>${money(l.price * l.qty)}</span></div><div class="qty"><button data-qty="${i}" data-delta="-1" aria-label="Quitar uno">−</button><b>${l.qty}</b><button data-qty="${i}" data-delta="1" aria-label="Agregar uno">+</button></div></div>`).join("") || "<p>Tu pedido está vacío.</p>"}</div><form id="checkout">${field("Tu nombre", "name", checkoutDetails.name, "text", 'required autocomplete="name"')}${field("Tu teléfono", "phone", checkoutDetails.phone, "tel", 'required autocomplete="tel"')}<label>Entrega<select name="delivery"><option value="pickup" ${checkoutDetails.delivery === "pickup" ? "selected" : ""}>Retiro en el local</option>${menu.settings.delivery ? `<option value="delivery" ${checkoutDetails.delivery === "delivery" ? "selected" : ""}>Delivery · ${money(menu.settings.deliveryFee)}</option>` : ""}</select></label><label id="address-field" ${checkoutDetails.delivery === "delivery" ? "" : "hidden"}>Dirección<input name="address" value="${h(checkoutDetails.address)}" ${checkoutDetails.delivery === "delivery" ? "required" : ""} autocomplete="street-address"></label>${field("Aclaraciones (opcional)", "note", checkoutDetails.note)}<div class="total">Total <strong id="checkout-total">${money(cart.reduce((n, l) => n + l.qty * l.price, 0) + (checkoutDetails.delivery === "delivery" ? menu.settings.deliveryFee : 0))}</strong></div><p class="hint">El local confirma la disponibilidad y el tiempo de entrega por WhatsApp.</p><button class="primary wide" ${cart.length ? "" : "disabled"}>${connected ? "Enviar por WhatsApp ↗" : "Ver mensaje de prueba →"}</button></form>`,
  );
}
function editProduct(id) {
  const p = draft.products.find((p) => p.id === id);
  modal(
    `<span class="eyebrow">TU CARTA, AL DÍA</span><h2>Editar producto</h2><form id="product-edit" data-id="${h(id)}">${field("Nombre", "name", p.name, "text", "required")}<label>Categoría<select name="category">${draft.categories.map((c) => `<option value="${h(c.id)}" ${c.id === p.category ? "selected" : ""}>${h(c.name)}</option>`).join("")}</select></label><label>Descripción<textarea name="description">${h(p.description)}</textarea></label><div class="edit-photo-row"><div id="edit-photo-preview">${photo(p)}</div><label class="photo-upload">${svg("photo")}Subir foto<small>JPG, PNG o WebP · Hasta 5 MB</small><input type="file" id="photo" accept="image/jpeg,image/png,image/webp" ${connected ? "" : "disabled"}></label></div>${field("O usar una foto con URL HTTPS", "image", p.image, "url")}<div class="editor-prices">${[
      ["price", "Único"],
      ["small", "Chica"],
      ["large", "Grande"],
    ]
      .map(([key, label]) =>
        field(label + " ($)", key, p[key] ?? "", "number", 'min="0" step="1"'),
      )
      .join(
        "",
      )}</div><label>Selección de empanadas<select name="bundle">${[0, 6, 12, 18].map((n) => `<option value="${n}" ${p.bundle === n ? "selected" : ""}>${n ? n + " unidades" : "No corresponde"}</option>`).join("")}</select></label>${toggle("Disponible", "available", p.available)}${toggle("Destacado", "featured", p.featured)}<div class="drawer-footer"><p class="hint">Aplicá al borrador y después guardá los cambios del panel para publicarlos.</p><div class="dialog-actions"><button type="button" class="secondary" data-action="close">Cancelar</button><button type="submit" class="primary">Aplicar al borrador</button></div></div></form>`,
    true,
  );
}
async function route() {
  if (!menu) return;
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("dialog")?.close();
  if (isPanel()) {
    admin = await isAdmin();
    if (!draft) {
      draft = structuredClone(menu);
      draftVersion = getMenuVersion();
    }
    renderPanel();
  } else renderPublic();
}
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.closest("#checkout") && t.name) checkoutDetails[t.name] = t.value;
  if (t.id === "search") {
    search = t.value;
    renderProducts();
  }
  if (t.id === "admin-search") {
    adminSearch = t.value;
    renderPanelRows();
  }
  if (t.dataset.price) {
    const p = draft.products.find((p) => p.id === t.dataset.price);
    p[t.dataset.key] = t.value === "" ? null : Number(t.value);
    t.classList.toggle(
      "changed",
      p[t.dataset.key] !==
        menu.products.find((x) => x.id === p.id)?.[t.dataset.key],
    );
    syncChanges();
  }
  if (t.dataset.available) {
    draft.products.find((p) => p.id === t.dataset.available).available =
      t.checked;
    t.closest("label").querySelector("span").textContent = t.checked
      ? "Disponible"
      : "Agotado";
    syncChanges();
  }
  if (t.closest("#settings") || t.closest("#quick-settings")) {
    draft.settings[t.name] =
      t.type === "checkbox"
        ? t.checked
        : t.name === "deliveryFee"
          ? Number(t.value)
          : t.value;
    syncChanges();
  }
  if (t.dataset.catName) {
    draft.categories.find((c) => c.id === t.dataset.catName).name = t.value;
    syncChanges();
  }
  if (t.dataset.catOrder) {
    draft.categories.find((c) => c.id === t.dataset.catOrder).order = Number(
      t.value,
    );
    syncChanges();
  }
  if (t.dataset.flavor) {
    selection.flavors[t.dataset.flavor] = Number(t.value);
    const total = Object.values(selection.flavors).reduce((a, b) => a + b, 0);
    document.querySelector("#flavor-total").textContent =
      `${total} de ${selection.p.bundle} elegidas`;
    document.querySelector("[data-action=confirm-product]").disabled =
      total !== selection.p.bundle;
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "admin-category") {
    adminCategory = t.value;
    renderPanelRows();
  }
  if (t.id === "admin-availability") {
    adminAvailability = t.value;
    renderPanelRows();
  }
  if (t.name === "delivery" && t.closest("#checkout")) {
    const yes = t.value === "delivery";
    document.querySelector("#address-field").hidden = !yes;
    document.querySelector("[name=address]").required = yes;
    document.querySelector("#checkout-total").textContent = money(
      cart.reduce((n, l) => n + l.qty * l.price, 0) +
        (yes ? menu.settings.deliveryFee : 0),
    );
  }
  if (t.id === "photo" && t.files[0]) {
    const preview = document.querySelector("#edit-photo-preview");
    if (preview) {
      if (preview.dataset.objectUrl)
        URL.revokeObjectURL(preview.dataset.objectUrl);
      const url = URL.createObjectURL(t.files[0]);
      preview.dataset.objectUrl = url;
      preview.innerHTML = `<img src="${url}" alt="Vista previa de la foto seleccionada">`;
    }
  }
});
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  try {
    if (t.dataset.category) {
      category = t.dataset.category;
      renderPublic();
      window.scrollTo({ top: 0, behavior: "instant" });
      document
        .querySelector(".chip.selected")
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    if (t.dataset.selectSize) {
      sizes.set(t.dataset.selectSize, t.dataset.size);
      const parent = t.closest(".size-options");
      parent.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("selected", b === t);
        b.setAttribute("aria-pressed", String(b === t));
      });
    }
    if (t.dataset.view) {
      panelView = t.dataset.view;
      renderPanel();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (t.dataset.add) pick(t.dataset.add);
    if (t.dataset.edit) editProduct(t.dataset.edit);
    if (t.dataset.qty !== undefined) {
      const i = Number(t.dataset.qty);
      cart[i].qty += Number(t.dataset.delta);
      cart = cart.filter((l) => l.qty > 0);
      showCart();
    }
    switch (t.dataset.action) {
      case "close":
        document.querySelector("dialog")?.close();
        break;
      case "cart":
        showCart();
        break;
      case "confirm-product": {
        const p = selection.p;
        const flavors = Object.entries(selection.flavors)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => ({
            id,
            qty,
            name: menu.products.find((p) => p.id === id).name,
          }));
        cart.push(
          makeLine(p, document.querySelector("#size")?.value || "", flavors),
        );
        document.querySelector("dialog").close();
        renderPublic();
        toast("Agregado a tu pedido");
        break;
      }
      case "save":
        if (busy || !changeCount()) return;
        validateMenu(draft);
        {
          const snapshot = structuredClone(draft);
          busy = true;
          renderPanel();
          try {
            await saveMenu(snapshot, draftVersion);
            draftVersion = getMenuVersion();
            menu = snapshot;
            dirty = false;
            toast(
              connected
                ? "Menú actualizado para tus clientes."
                : "Cambios aplicados a esta prueba. Se perderán al recargar.",
            );
          } finally {
            busy = false;
            renderPanel();
          }
        }
        break;
      case "discard":
        if (changeCount())
          modal(
            '<h2>¿Descartar los cambios?</h2><p>Tu menú publicado se conserva. Las ediciones pendientes se perderán.</p><div class="dialog-actions"><button class="secondary" data-action="close">Seguir editando</button><button class="primary" data-action="confirm-discard">Descartar cambios</button></div>',
          );
        break;
      case "confirm-discard":
        draft = structuredClone(menu);
        dirty = false;
        document.querySelector("dialog").close();
        renderPanel();
        break;
      case "logout":
        await client.auth.signOut();
        admin = false;
        draft = null;
        dirty = false;
        renderPanel();
        break;
      case "new": {
        const id = crypto.randomUUID();
        draft.products.push({
          id,
          category: draft.categories[0].id,
          name: "Nuevo producto",
          description: "",
          price: null,
          small: null,
          large: null,
          image: "",
          available: false,
          featured: false,
          bundle: 0,
        });
        dirty = true;
        renderPanel();
        editProduct(id);
        break;
      }
      case "new-category":
        draft.categories.push({
          id: crypto.randomUUID(),
          name: "Nueva categoría",
          order: draft.categories.length + 1,
        });
        dirty = true;
        renderPanel();
        break;
    }
  } catch (error) {
    toast(error.message);
  }
});
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const values = Object.fromEntries(new FormData(f));
  const submit = f.querySelector("button[type=submit],button:not([type])");
  if (submit) submit.disabled = true;
  try {
    if (f.id === "login") {
      const { error } = await client.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw new Error("Email o contraseña incorrectos.");
      admin = await isAdmin();
      if (!admin) {
        await client.auth.signOut();
        throw new Error(
          "Esta cuenta no tiene permisos para administrar el local.",
        );
      }
      draft = structuredClone(menu);
      draftVersion = getMenuVersion();
      renderPanel();
    }
    if (f.id === "product-edit") {
      const p = draft.products.find((p) => p.id === f.dataset.id);
      let image = values.image;
      const file = f.querySelector("#photo").files[0];
      if (file) image = await uploadImage(file);
      if (image && !safeImage(image))
        throw new Error("Usá una URL de imagen HTTPS.");
      Object.assign(p, {
        name: values.name,
        category: values.category,
        description: values.description,
        image,
        bundle: Number(values.bundle),
        featured: values.featured === "on",
        available: values.available === "on",
        price: values.price === "" ? null : Number(values.price),
        small: values.small === "" ? null : Number(values.small),
        large: values.large === "" ? null : Number(values.large),
      });
      dirty = true;
      document.querySelector("dialog").close();
      renderPanel();
    }
    if (f.id === "checkout") {
      // Refresh production data before calculating the final message.
      if (connected) menu = await loadMenu();
      const msg = orderMessage(menu, cart, {
        ...values,
        delivery: values.delivery === "delivery",
      });
      if (connected) {
        const a = document.createElement("a");
        a.href = `https://wa.me/${menu.settings.whatsapp}?text=${encodeURIComponent(msg)}`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Abrir WhatsApp con mi pedido ↗";
        a.className = "primary wide";
        f.replaceChildren(a);
        toast("El pedido se envía cuando lo confirmás en WhatsApp.");
      } else
        modal(
          `<h2>Así llegará el pedido</h2><p class="notice">Demostración: no se envió ningún mensaje.</p><pre class="message">${h(msg)}</pre>`,
        );
    }
  } catch (error) {
    toast(error.message);
  } finally {
    if (submit) submit.disabled = false;
  }
});
window.addEventListener("hashchange", route);
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
app.innerHTML = '<main class="loading">Preparando algo rico…</main>';
loadMenu()
  .then((data) => {
    menu = data;
    route();
  })
  .catch((error) => {
    app.innerHTML = `<main class="maintenance"><h1>No pudimos cargar el menú.</h1><p>${h(error.message)}</p><button onclick="location.reload()">Reintentar</button></main>`;
  });
