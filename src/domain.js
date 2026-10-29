export const money = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function safeImage(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
export function priceOf(product, size) {
  const price =
    size === "Chica"
      ? product.small
      : size === "Grande"
        ? product.large
        : product.price;
  if (price === null || !Number.isFinite(Number(price)) || Number(price) < 0)
    throw new Error("El producto no tiene un precio válido.");
  return Number(price);
}
export function validateMenu(menu) {
  const categoryIds = new Set();
  if (!menu.categories.length)
    throw new Error("Agregá al menos una categoría.");
  for (const c of menu.categories) {
    if (
      !c.id ||
      !c.name.trim() ||
      !Number.isFinite(c.order) ||
      c.order < 0 ||
      categoryIds.has(c.id)
    )
      throw new Error("Revisá el nombre y orden de las categorías.");
    categoryIds.add(c.id);
  }
  if (!menu.settings.name.trim())
    throw new Error("Ingresá el nombre del local.");
  if (!/^\d{10,15}$/.test(menu.settings.whatsapp))
    throw new Error(
      "Revisá el número de WhatsApp: usá solo dígitos con código de país.",
    );
  if (
    !Number.isFinite(menu.settings.deliveryFee) ||
    menu.settings.deliveryFee < 0
  )
    throw new Error("El costo de envío debe ser un número positivo o cero.");
  const ids = new Set();
  for (const p of menu.products) {
    if (ids.has(p.id))
      throw new Error("Hay productos con identificadores repetidos.");
    ids.add(p.id);
    if (!p.name.trim() || !menu.categories.some((c) => c.id === p.category))
      throw new Error("Revisá nombres y categorías de los productos.");
    const prices = [p.price, p.small, p.large].filter((x) => x !== null);
    if (
      (p.available && !prices.length) ||
      prices.some((x) => !Number.isFinite(x) || x < 0)
    )
      throw new Error(`Revisá los precios de ${p.name}.`);
    if ((p.small === null) !== (p.large === null))
      throw new Error(`Completá ambos tamaños de ${p.name}.`);
    if (p.bundle && ![6, 12, 18].includes(p.bundle))
      throw new Error("La selección de empanadas debe ser de 6, 12 o 18.");
    if (p.image && !safeImage(p.image))
      throw new Error("Las imágenes deben usar direcciones HTTPS.");
  }
}
export function makeLine(product, size = "", flavors = []) {
  if (!product.available) throw new Error("El producto está agotado.");
  if (
    product.bundle &&
    (flavors.reduce((sum, f) => sum + f.qty, 0) !== product.bundle ||
      flavors.some((f) => !Number.isInteger(f.qty) || f.qty < 1))
  )
    throw new Error(`Elegí exactamente ${product.bundle} empanadas.`);
  return {
    productId: product.id,
    size,
    flavors,
    qty: 1,
    price: priceOf(product, size),
    name: product.name + (size ? ` · ${size}` : ""),
  };
}
export function orderMessage(menu, cart, details) {
  if (!menu.settings.open || !menu.settings.active)
    throw new Error("El local no está recibiendo pedidos.");
  if (!cart.length) throw new Error("Tu pedido está vacío.");
  if (!details.name.trim() || !details.phone.trim())
    throw new Error("Completá tu nombre y teléfono.");
  if (details.delivery && (!menu.settings.delivery || !details.address.trim()))
    throw new Error(
      "Revisá la disponibilidad de envío y completá la dirección.",
    );
  const lines = cart.map((line) => {
    const p = menu.products.find((p) => p.id === line.productId);
    if (!p?.available) throw new Error(`${line.name} ya no está disponible.`);
    if (!Number.isInteger(line.qty) || line.qty < 1)
      throw new Error("Revisá las cantidades.");
    makeLine(p, line.size, line.flavors);
    for (const f of line.flavors)
      if (
        !menu.products.some(
          (x) =>
            x.id === f.id &&
            x.category === "empanadas" &&
            x.available &&
            !x.bundle,
        )
      )
        throw new Error("Un sabor de empanada ya no está disponible.");
    const price = priceOf(p, line.size);
    if (price !== line.price)
      throw new Error(
        "Cambió un precio. Quitá ese producto y volvé a agregarlo.",
      );
    return `• ${line.qty} × ${line.name}${line.flavors.length ? " (" + line.flavors.map((f) => `${f.qty} ${f.name}`).join(", ") + ")" : ""}: ${money(price * line.qty)}`;
  });
  const subtotal = cart.reduce((n, l) => n + l.price * l.qty, 0),
    fee = details.delivery ? menu.settings.deliveryFee : 0;
  return `Hola, quiero hacer un pedido en ${menu.settings.name}.\n\n${lines.join("\n")}\n\nCliente: ${details.name}\nTeléfono: ${details.phone}\nEntrega: ${details.delivery ? "Delivery" : "Retiro en el local"}${details.delivery ? "\nDirección: " + details.address : ""}${details.note ? "\nAclaraciones: " + details.note : ""}\n\nSubtotal: ${money(subtotal)}\nEnvío: ${money(fee)}\nTotal: ${money(subtotal + fee)}\n\nQuedo a la espera de la confirmación del local.`;
}
