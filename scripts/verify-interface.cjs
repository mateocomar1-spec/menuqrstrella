const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../public/menu.json")),
);
fs.mkdirSync("/tmp/piccolina-ui-verification", { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto((process.env.UI_TEST_URL || "http://localhost:5174") + "/");
  await page.locator(".product").first().waitFor();
  assert.equal(
    await page.locator(".demo").count(),
    1,
    "Usar un servidor en modo demostración; nunca el sitio real.",
  );
  assert.equal(await page.locator(".hero").count(), 0);
  assert.equal(await page.locator("#category-title").innerText(), "Pizzas");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator("[data-select-size=p1][data-size=Chica]").click();
  assert.equal(
    await page
      .locator("[data-select-size=p1][data-size=Chica]")
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("[data-add=p1]").click();
  await page.locator("[data-action=cart]").click();
  await page.locator("#checkout [name=name]").fill("Prueba");
  await page.locator("#checkout [name=phone]").fill("2944123456");
  await page.locator('[data-qty="0"][data-delta="1"]').click();
  assert.equal(
    await page.locator("#checkout [name=name]").inputValue(),
    "Prueba",
  );
  await page.locator("#checkout button").click();
  await page.locator(".message").waitFor();
  assert.match(await page.locator(".message").innerText(), /Chica/);
  await page.locator(".modal-close").click();
  await page.locator("[data-category=all]").click();
  assert.equal(await page.locator(".product").count(), 83);
  await page.locator("#search").fill("zzzznoproduct");
  assert.equal(await page.locator(".product").count(), 0);
  await page.locator("#search").fill("");
  const dozen = catalog.products.find((p) => p.bundle === 12 && p.available);
  const flavor = catalog.products.find(
    (p) => p.category === "empanadas" && !p.bundle && p.available,
  );
  await page.locator(`[data-add="${dozen.id}"]`).click();
  assert.ok(await page.locator("[data-action=confirm-product]").isDisabled());
  await page.locator(`[data-flavor="${flavor.id}"]`).fill("12");
  assert.ok(await page.locator("[data-action=confirm-product]").isEnabled());
  await page.locator("[data-action=confirm-product]").click();
  await page.locator("[data-category=pizzas]").click();
  await page.screenshot({
    animations: "disabled",
    path: "/tmp/piccolina-ui-verification/nuevo-menu-movil.png",
  });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    animations: "disabled",
    path: "/tmp/piccolina-ui-verification/nuevo-menu-escritorio.png",
  });
  await page.goto(
    (process.env.UI_TEST_URL || "http://localhost:5174") + "/#admin",
  );
  await page.locator("table").waitFor();
  assert.equal(await page.locator("tbody tr").count(), 83);
  assert.ok(await page.locator("[data-action=save]").isDisabled());
  const price = page.locator("[data-price=p1][data-key=small]");
  await price.fill("19500");
  assert.equal(
    await page.locator("[data-action=save]").innerText(),
    "Guardar 1 cambio",
  );
  await price.fill("19000");
  assert.ok(await page.locator("[data-action=save]").isDisabled());
  await price.fill("19500");
  await page.locator("#admin-search").fill("muzzarella");
  assert.equal(
    await page.locator("tbody tr").count(),
    catalog.products.filter((p) =>
      `${p.name} ${p.description}`.toLowerCase().includes("muzzarella"),
    ).length,
  );
  await page.locator("[data-edit=p1]").click();
  await page
    .locator("#product-edit [name=description]")
    .fill("Descripción de prueba");
  await page.locator("#product-edit button[type=submit]").click();
  assert.equal(
    await page.locator("[data-action=save]").innerText(),
    "Guardar 1 cambio",
  );
  await page.locator("#admin-search").fill("");
  await page.locator("[data-available=p2]").uncheck();
  assert.equal(
    await page.locator("[data-action=save]").innerText(),
    "Guardar 2 cambios",
  );
  await page.screenshot({
    animations: "disabled",
    path: "/tmp/piccolina-ui-verification/nuevo-panel-escritorio.png",
  });
  await page.locator("[data-action=save]").click();
  await page
    .locator("#toast")
    .filter({ hasText: "Cambios aplicados" })
    .waitFor();
  assert.ok(await page.locator("[data-action=save]").isDisabled());
  await page.locator("[data-view=categories]").click();
  await page.locator("[data-cat-name=pizzas]").fill("Pizzas artesanales");
  assert.equal(
    await page.locator("[data-action=save]").innerText(),
    "Guardar 1 cambio",
  );
  await page.locator("[data-action=discard]").click();
  await page.locator("[data-action=confirm-discard]").click();
  assert.equal(
    await page.locator("[data-cat-name=pizzas]").inputValue(),
    "Pizzas",
  );
  await page.locator("[data-view=settings]").click();
  await page.locator("[name=deliveryFee]").fill("7000");
  await page.locator("[data-view=products]").click();
  assert.equal(
    await page.locator("[data-action=save]").innerText(),
    "Guardar 1 cambio",
  );
  await page.locator("[data-action=discard]").click();
  await page.locator("[data-action=confirm-discard]").click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    animations: "disabled",
    path: "/tmp/piccolina-ui-verification/nuevo-panel-movil.png",
  });
  await page.locator("[data-edit=p1]").click();
  await page.locator("dialog.drawer").waitFor();
  assert.ok(
    await page.evaluate(
      () =>
        document.querySelector("dialog").getBoundingClientRect().width <=
        innerWidth,
    ),
  );
  await page.screenshot({
    animations: "disabled",
    path: "/tmp/piccolina-ui-verification/nueva-edicion-movil.png",
  });
  await page.locator(".modal-close").click();
  await page.locator("#admin-category").selectOption("bebidas");
  assert.ok((await page.locator("tbody tr").count()) > 0);
  await page.locator("#admin-availability").selectOption("sold");
  assert.match(await page.locator("tbody").innerText(), /No hay productos/);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: menú 320/390/1440px, selector tamaños, carrito, docena, búsqueda, edición masiva, contador y reversión de cambios, filtros, categorías, configuración, editor móvil; sin errores JS. Prueba en modo demostración, sin escribir en Supabase.",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
