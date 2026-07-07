const money = value => `${String.fromCharCode(8377)}${Number(value || 0).toLocaleString("en-IN")}`;

const SUPABASE_URL = "https://diimzhrdjuhvuquqpqwq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_a3PMJ9KLw9tUyt8AbSxbZw_3JwGqgk0";
const SUPABASE_SCRIPT_URLS = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"
];
let supabaseClient = null;
let cloudReady = false;

const defaultProducts = [
  { id: "cow-ghee", name: "Cow Ghee", type: "Cow Ghee", price: 799, old: 899, size: "500 ml", badge: "Best Seller", img: "assets/cow-ghee-ee.png", rating: 4.8, reviews: 256, desc: "Pure cow ghee, slow-crafted with an inspired traditional preparation for rich aroma, taste, and purity." },
  { id: "buffalo-ghee", name: "Buffalo Ghee", type: "Buffalo Ghee", price: 699, old: 799, size: "500 ml", badge: "Rich Aroma", img: "assets/buffalo-ghee-ee.png", rating: 4.7, reviews: 189, desc: "Thick, creamy buffalo ghee with a deep traditional flavor for sweets, rice, and everyday cooking." }
];

const defaultHeroSlides = [
  {
    image: "assets/hero-ghee-food.png",
    eyebrow: "Premium Indian Ghee",
    title: "Pure Ghee, Slow-Crafted for Indian Homes",
    copy: "Golden aroma, traditional taste, and everyday nourishment in every spoon of EE Desi Delights ghee.",
    cta: "Shop Ghee",
    link: "#shop"
  },
  {
    image: "assets/buffalo-ghee-ee.png",
    eyebrow: "Cow & Buffalo Ghee",
    title: "Two Pure Choices for Every Kitchen",
    copy: "Choose pure cow ghee or rich buffalo ghee, both slow-crafted for authentic flavor.",
    cta: "View Products",
    link: "#products"
  },
  {
    image: "assets/ghee-gift-hamper-ee.png",
    eyebrow: "Festive Bulk Orders",
    title: "Traditional Ghee Gifts with a Premium Finish",
    copy: "Create memorable wedding, corporate, and festive hampers with EE Desi Delights green-gold packaging.",
    cta: "Bulk Enquiry",
    link: "#bulk"
  }
];

const defaultSettings = {
  headerLogo: "assets/logo-transparent.png",
  footerLogo: "assets/logo-white.png",
  brandName: "EE Desi Delights",
  razorpayEnabled: true,
  razorpayKey: "rzp_test_1DP5mmOlF5G5ag",
  razorpayMerchant: "EE Desi Delights",
  razorpayCurrency: "INR",
  supportPhone: "+91 96666 77434",
  supportEmail: "eedesidelights@gmail.com",
  address: "Hyderabad, Telangana, India",
  shippingCharge: 0,
  packagingCharge: 20,
  couponCode: "GHEE10",
  couponDiscount: 10
};

let products = JSON.parse(localStorage.getItem("ee_desi_v3_products") || "null") || defaultProducts;
let heroSlides = JSON.parse(localStorage.getItem("ee_desi_v3_hero_slides") || "null") || defaultHeroSlides;
const savedSettings = JSON.parse(localStorage.getItem("ee_desi_v3_settings") || "null") || {};

const sizeTiers = [
  { label: "500 ml", multiplier: 1 },
  { label: "1 Litre", multiplier: 1.875 },
  { label: "2 Litre", multiplier: 3.5 },
  { label: "5 Litre", multiplier: 8.125 }
];

function isVisibleSizeLabel(label = "") {
  return !["200 ml", "200ml"].includes(String(label).trim().toLowerCase());
}

let state = {
  cart: JSON.parse(localStorage.getItem("ee_desi_v2_cart") || "[]"),
  user: JSON.parse(localStorage.getItem("ee_desi_v2_user") || "null"),
  users: JSON.parse(localStorage.getItem("ee_desi_v2_users") || "[]"),
  admin: JSON.parse(localStorage.getItem("ee_desi_v2_admin") || "null"),
  orders: JSON.parse(localStorage.getItem("ee_desi_v2_orders") || "[]"),
  checkout: JSON.parse(localStorage.getItem("ee_desi_v2_checkout") || "{}"),
  settings: { ...defaultSettings, ...savedSettings }
};

state.cart = state.cart.filter(item => isVisibleSizeLabel(item.size));

if (state.admin && !state.admin.cloud) {
  state.admin = null;
  localStorage.removeItem("ee_desi_v2_admin");
}

let heroTimer = null;
let activeHero = 0;

const app = document.getElementById("app");
const toast = document.getElementById("toast");

function loadExternalScript(src) {
  return new Promise(resolve => {
    let settled = false;
    const done = value => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(false), 1800);
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => { clearTimeout(timer); done(true); }, { once: true });
      existing.addEventListener("error", () => { clearTimeout(timer); done(false); }, { once: true });
      if (window.supabase) { clearTimeout(timer); done(true); }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => { clearTimeout(timer); done(true); };
    script.onerror = () => { clearTimeout(timer); done(false); };
    document.head.appendChild(script);
  });
}

async function initSupabase() {
  for (const src of SUPABASE_SCRIPT_URLS) {
    if (window.supabase) break;
    await loadExternalScript(src);
  }
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return false;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return true;
}

function dbProductToProduct(row, sizes = []) {
  const sizeOptions = sizes
    .filter(size => size.product_id === row.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(size => ({ label: size.label, price: Number(size.price || 0) }));
  const defaultSize = sizes.find(size => size.product_id === row.id && size.is_default) || sizes.find(size => size.product_id === row.id);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    price: Number(row.price || defaultSize?.price || 0),
    old: Number(row.old || row.price || 0),
    size: row.size || defaultSize?.label || "500 ml",
    badge: row.badge || "",
    img: row.img || "assets/cow-ghee-ee.png",
    rating: Number(row.rating || 4.8),
    reviews: Number(row.reviews || 0),
    desc: row.description || "",
    sizeOptions
  };
}

function settingsRowsToObject(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

function productToDb(product, index = 0) {
  const defaultOption = defaultSizeOption(product);
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    price: Number(defaultOption.price || product.price || 0),
    old: Number(product.old || defaultOption.price || product.price || 0),
    size: defaultOption.label || product.size || "500 ml",
    badge: product.badge || "",
    img: product.img || "",
    rating: Number(product.rating || 4.8),
    reviews: Number(product.reviews || 0),
    description: product.desc || "",
    sort_order: index + 1,
    active: true
  };
}

async function loadCloudStore() {
  if (!supabaseClient) return false;
  const [productRes, sizeRes, settingsRes, heroRes] = await Promise.all([
    supabaseClient.from("products").select("*").eq("active", true).order("sort_order", { ascending: true }),
    supabaseClient.from("product_sizes").select("*").order("sort_order", { ascending: true }),
    supabaseClient.from("site_settings").select("*"),
    supabaseClient.from("hero_slides").select("*").eq("active", true).order("sort_order", { ascending: true })
  ]);

  if (productRes.error || sizeRes.error || settingsRes.error || heroRes.error) {
    cloudReady = false;
    return false;
  }

  if (productRes.data?.length) products = productRes.data.map(row => dbProductToProduct(row, sizeRes.data || []));
  if (heroRes.data?.length) {
    heroSlides = heroRes.data.map(row => ({
      dbId: row.id,
      image: row.image,
      eyebrow: row.eyebrow,
      title: row.title,
      copy: row.copy,
      cta: row.cta,
      link: row.link
    }));
  }
  state.settings = { ...defaultSettings, ...state.settings, ...settingsRowsToObject(settingsRes.data || []) };
  cloudReady = true;
  save();
  return true;
}

async function saveCloudSettings(keys) {
  if (!supabaseClient || !cloudReady) return false;
  const rows = keys.map(key => ({ key, value: state.settings[key] }));
  const { error } = await supabaseClient.from("site_settings").upsert(rows, { onConflict: "key" });
  return !error;
}

async function saveCloudProduct(product) {
  if (!supabaseClient || !cloudReady) return false;
  const productIndex = products.findIndex(item => item.id === product.id);
  const productPayload = productToDb(product, productIndex);
  const { error: productError } = await supabaseClient.from("products").upsert(productPayload, { onConflict: "id" });
  if (productError) return false;
  const { error: deleteError } = await supabaseClient.from("product_sizes").delete().eq("product_id", product.id);
  if (deleteError) return false;
  const defaultOption = defaultSizeOption(product);
  const sizeRows = sizeOptionsFor(product).map((option, index) => ({
    product_id: product.id,
    label: option.label,
    price: Number(option.price || 0),
    is_default: option.label === defaultOption.label,
    sort_order: index + 1
  }));
  if (!sizeRows.length) return true;
  const { error: sizeError } = await supabaseClient.from("product_sizes").insert(sizeRows);
  return !sizeError;
}

async function deleteCloudProduct(id) {
  if (!supabaseClient || !cloudReady) return false;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  return !error;
}

async function saveCloudHeroSlide(index) {
  if (!supabaseClient || !cloudReady) return false;
  const slide = heroSlides[index];
  const payload = {
    image: slide.image,
    eyebrow: slide.eyebrow,
    title: slide.title,
    copy: slide.copy,
    cta: slide.cta,
    link: slide.link,
    sort_order: index + 1,
    active: true
  };
  const query = slide.dbId
    ? supabaseClient.from("hero_slides").update(payload).eq("id", slide.dbId)
    : supabaseClient.from("hero_slides").insert(payload).select("id").single();
  const { data, error } = await query;
  if (!error && data?.id) slide.dbId = data.id;
  return !error;
}

async function saveCloudOrder(order) {
  if (!supabaseClient || !cloudReady) return false;
  const address = {
    line1: state.checkout.address,
    city: state.checkout.city,
    state: state.checkout.stateName,
    pincode: state.checkout.pincode
  };
  const orderPayload = {
    id: order.id,
    customer_name: state.checkout.fullName || state.user?.name || "",
    customer_email: state.checkout.email || state.user?.email || "",
    customer_phone: state.checkout.phone || state.user?.phone || "",
    address,
    subtotal: order.subtotal,
    shipping: order.shipping,
    packing: order.packing,
    discount: order.discount,
    total: order.total,
    coupon: state.checkout.coupon || null,
    payment_method: order.payment,
    payment_status: order.payment.includes("Paid") ? "paid" : "pending",
    razorpay_order_id: order.razorpay_order_id || null,
    razorpay_payment_id: order.razorpay_payment_id || null,
    status: order.status
  };
  const { error: orderError } = await supabaseClient.from("orders").insert(orderPayload);
  if (orderError) return false;
  const itemRows = order.items.map(item => {
    const product = products.find(p => p.id === item.id);
    const unitPrice = product ? lineUnitPrice(item, product) : Number(item.unitPrice || 0);
    return {
      order_id: order.id,
      product_id: item.id,
      product_name: product?.name || item.id,
      size: product ? lineSize(item, product) : item.size,
      unit_price: unitPrice,
      qty: item.qty,
      line_total: unitPrice * item.qty
    };
  });
  if (!itemRows.length) return true;
  const { error: itemsError } = await supabaseClient.from("order_items").insert(itemRows);
  return !itemsError;
}

async function loadCloudOrders() {
  if (!supabaseClient || !cloudReady || !state.admin?.cloud) return false;
  const [ordersRes, itemsRes] = await Promise.all([
    supabaseClient.from("orders").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("order_items").select("*")
  ]);
  if (ordersRes.error || itemsRes.error) return false;
  state.orders = (ordersRes.data || []).map(order => {
    const items = (itemsRes.data || [])
      .filter(item => item.order_id === order.id)
      .map(item => ({
        id: item.product_id,
        size: item.size,
        unitPrice: item.unit_price,
        qty: item.qty
      }));
    return {
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      packing: order.packing,
      discount: order.discount,
      total: order.total,
      payment: order.payment_method,
      status: order.status
    };
  });
  save();
  return true;
}

async function updateCloudOrderStatus(id, status) {
  if (!supabaseClient || !cloudReady || !state.admin?.cloud) return false;
  const { error } = await supabaseClient.from("orders").update({ status }).eq("id", id);
  return !error;
}

function save() {
  localStorage.setItem("ee_desi_v2_cart", JSON.stringify(state.cart));
  localStorage.setItem("ee_desi_v2_user", JSON.stringify(state.user));
  localStorage.setItem("ee_desi_v2_users", JSON.stringify(state.users));
  localStorage.setItem("ee_desi_v2_admin", JSON.stringify(state.admin));
  localStorage.setItem("ee_desi_v2_orders", JSON.stringify(state.orders));
  localStorage.setItem("ee_desi_v2_checkout", JSON.stringify(state.checkout));
  localStorage.setItem("ee_desi_v3_settings", JSON.stringify(state.settings));
  localStorage.setItem("ee_desi_v3_products", JSON.stringify(products));
  localStorage.setItem("ee_desi_v3_hero_slides", JSON.stringify(heroSlides));
  updateHeader();
  applySiteSettings();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function updateHeader() {
  document.getElementById("cartCount").textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function applySiteSettings() {
  const headerLogo = document.querySelector(".brand img");
  const footerLogo = document.querySelector(".footer-logo");
  if (headerLogo) headerLogo.src = state.settings.headerLogo || defaultSettings.headerLogo;
  if (footerLogo) footerLogo.src = state.settings.footerLogo || defaultSettings.footerLogo;
  document.title = `${state.settings.brandName || "EE Desi Delights"} | Pure Ghee Store`;
}

const launchScreenDate = "2026-07-03";
const launchScreenSeenKey = "ee_desi_launch_seen_date";

function indiaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function showLaunchScreen() {
  const today = indiaDateKey();
  const previewLaunch = new URLSearchParams(location.search).get("launch") === "preview";
  if (!previewLaunch && (today !== launchScreenDate || localStorage.getItem(launchScreenSeenKey) === today)) return;
  if (document.querySelector(".launch-screen")) return;

  const screen = document.createElement("div");
  screen.className = "launch-screen";
  screen.setAttribute("role", "dialog");
  screen.setAttribute("aria-modal", "true");
  screen.setAttribute("aria-labelledby", "launchTitle");
  screen.innerHTML = `
    <div class="launch-card">
      <span class="launch-shine"></span>
      <img class="launch-logo" src="${state.settings.headerLogo || defaultSettings.headerLogo}" alt="${state.settings.brandName || "EE Desi Delights"}" />
      <span class="launch-eyebrow">Grand Launch Today</span>
      <h2 id="launchTitle">Welcome to ${state.settings.brandName || "EE Desi Delights"}</h2>
      <p>Pure cow ghee and buffalo ghee are ready for your home. Tap Launch to enter with a little celebration.</p>
      <button class="launch-btn" type="button">${icon("sparkles")} Launch Website</button>
    </div>`;

  document.body.appendChild(screen);
  document.body.classList.add("launch-locked");
  refreshIcons();

  screen.querySelector(".launch-btn").addEventListener("click", event => {
    event.currentTarget.disabled = true;
    localStorage.setItem(launchScreenSeenKey, today);
    screen.classList.add("launch-screen--celebrating");
    launchConfetti();
    setTimeout(() => {
      screen.classList.add("launch-screen--closing");
      setTimeout(() => {
        screen.remove();
        document.body.classList.remove("launch-locked");
      }, 450);
    }, 1500);
  });
}

function launchConfetti() {
  const oldStage = document.querySelector(".launch-confetti-stage");
  if (oldStage) oldStage.remove();

  const stage = document.createElement("div");
  stage.className = "launch-confetti-stage";
  const colors = ["#d4af37", "#0f3d2e", "#23a455", "#fff7d1", "#7a4e2d", "#f7f2e6"];
  const pieces = 96;
  for (let index = 0; index < pieces; index++) {
    const piece = document.createElement("span");
    const spread = window.innerWidth < 700 ? window.innerWidth * 1.05 : window.innerWidth * .78;
    const x = (Math.random() - .5) * spread;
    const y = window.innerHeight * (.55 + Math.random() * .58);
    const rotate = (Math.random() * 900 - 450).toFixed(0);
    const duration = 1450 + Math.random() * 1000;
    const delay = Math.random() * 180;
    piece.className = `launch-confetti-piece${index % 4 === 0 ? " round" : ""}`;
    piece.style.cssText = `
      --x: ${x.toFixed(0)}px;
      --y: ${y.toFixed(0)}px;
      --r: ${rotate}deg;
      --d: ${duration.toFixed(0)}ms;
      --c: ${colors[index % colors.length]};
      left: ${34 + Math.random() * 32}%;
      animation-delay: ${delay.toFixed(0)}ms;
    `;
    stage.appendChild(piece);
  }

  document.body.appendChild(stage);
  setTimeout(() => stage.remove(), 2800);
}

function upsertUser(user) {
  const email = (user.email || "").toLowerCase();
  if (!email) return;
  const existing = state.users.find(u => u.email.toLowerCase() === email);
  const next = { name: user.name || "Demo Customer", email: user.email, phone: user.phone || "", role: user.role || "customer", joined: user.joined || new Date().toLocaleDateString("en-IN") };
  if (existing) Object.assign(existing, next);
  else state.users.push(next);
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function sizeOptionsFor(product) {
  const basePrice = Number(product?.price || 0);
  const savedOptions = Array.isArray(product?.sizeOptions)
    ? product.sizeOptions
        .map(option => ({ label: String(option.label || "").trim(), price: Number(option.price || 0) }))
        .filter(option => option.label && option.price > 0 && isVisibleSizeLabel(option.label))
    : [];
  if (savedOptions.length) return savedOptions;
  return sizeTiers.map(tier => ({
    label: tier.label,
    price: tier.label === "500 ml" ? basePrice : Math.max(1, Math.round((basePrice * tier.multiplier + 1) / 50) * 50 - 1)
  }));
}

function defaultSizeOption(product) {
  const options = sizeOptionsFor(product);
  return options.find(option => option.label === product?.size) || options.find(option => option.label === "500 ml") || options[0] || { label: product?.size || "500 ml", price: product?.price || 0 };
}

function sizeRangeText(product) {
  const options = sizeOptionsFor(product);
  if (!options.length) return product?.size || "500 ml";
  if (options.length === 1) return options[0].label;
  return `${options[0].label} to ${options[options.length - 1].label}`;
}

function lineSize(item, product) {
  return item.size || defaultSizeOption(product).label;
}

function lineUnitPrice(item, product) {
  return Number(item.unitPrice) || defaultSizeOption(product).price || 0;
}

function lineKey(item, product) {
  return item.key || `${item.id}::${lineSize(item, product)}`;
}

function productCard(product) {
  const productSizes = sizeOptionsFor(product);
  const defaultOption = defaultSizeOption(product);
  return `
    <article class="product-card">
      <a class="img-wrap" href="#product/${product.id}">
        <span class="tag">${product.badge}</span>
        <img src="${product.img}" alt="${product.name}" />
      </a>
      <div class="product-body">
        <div class="rating">&#9733;&#9733;&#9733;&#9733;&#9733; <span>${product.rating} (${product.reviews})</span></div>
        <a href="#product/${product.id}" class="product-title">${product.name}</a>
        <div class="product-meta">${product.type} &bull; ${sizeRangeText(product)}</div>
        <div class="card-purchase" data-qty="1" data-size="${escapeAttr(defaultOption.label)}" data-unit-price="${defaultOption.price}">
          <label class="card-size-label">Select Size
            <select class="card-size-select" aria-label="Select size for ${product.name}" onchange="changeCardSize(this)">
              ${productSizes.map(option => `<option value="${option.price}" data-size="${escapeAttr(option.label)}" ${option.label === defaultOption.label ? "selected" : ""}>${option.label} &mdash; ${money(option.price)}</option>`).join("")}
            </select>
          </label>
          <div class="price-row">
            <div><span class="price">${money(defaultOption.price)}</span><small class="price-quantity">for 1 jar</small></div>
            <div class="card-quantity"><small>Quantity</small><div class="card-qty">
              <button type="button" onclick="changeCardQty(this, -1)" aria-label="Decrease ${product.name} quantity">&minus;</button>
              <span>1</span>
              <button type="button" onclick="changeCardQty(this, 1)" aria-label="Increase ${product.name} quantity">+</button>
            </div></div>
          </div>
          <button class="btn primary card-add" type="button" onclick="addCardSelection(this, '${product.id}')">${icon("shopping-cart")} Add to Cart</button>
          <div class="post-add-actions hidden">
            <a class="btn ghost" href="#cart">Proceed</a>
            <a class="btn whatsapp-order product-whatsapp" href="#" target="_blank" rel="noreferrer">${icon("message-circle")} WhatsApp</a>
          </div>
        </div>
      </div>
    </article>`;
}

function renderHome() {
  if (window.matchMedia("(max-width: 700px)").matches) activeHero = 0;
  app.innerHTML = `
    <section class="hero">
      <div class="hero-slider">
        ${heroSlides.map((slide, index) => `
          <article class="hero-slide ${index === activeHero ? "active" : ""}">
            <img class="hero-bg" src="${slide.image}" alt="${slide.eyebrow}" />
            <div class="hero-copy">
              <div class="eyebrow">${slide.eyebrow}</div>
              <h1>${slide.title.replace("Ghee", "<span>Ghee</span>")}</h1>
              <p>${slide.copy}</p>
              <div class="hero-actions">
                <a class="btn primary" href="${slide.link}">${icon("shopping-bag")} ${slide.cta}</a>
                <a class="btn gold" href="#product/cow-ghee">${icon("sparkles")} View Best Seller</a>
              </div>
              <div class="trust-row">
                <div class="trust-item">${icon("leaf")}<b>100% Natural</b><span>No additives</span></div>
                <div class="trust-item">${icon("milk")}<b>A2 Cow Milk</b><span>Selected sourcing</span></div>
                <div class="trust-item">${icon("package-check")}<b>Secure Packing</b><span>Leak-safe jars</span></div>
                <div class="trust-item">${icon("truck")}<b>PAN India</b><span>3-5 day delivery</span></div>
              </div>
            </div>
            <div class="hero-card"><img src="assets/cow-ghee-ee.png" alt="EE Desi Delights Cow Ghee" /></div>
          </article>
        `).join("")}
        <div class="hero-float"><span>Pure<br>Tradition<br>Every Spoon</span></div>
        <div class="slider-controls">${heroSlides.map((_, index) => `<button class="slider-dot ${index === activeHero ? "active" : ""}" onclick="setHeroSlide(${index})" aria-label="Show slide ${index + 1}"></button>`).join("")}</div>
      </div>
    </section>
    <section class="marquee"><div class="marquee-track">
      <span>100% Natural Ghee</span><span>Inspired traditional preparation</span><span>No Preservatives</span><span>Hyderabad Delivery</span><span>Secure Packaging</span>
      <span>100% Natural Ghee</span><span>Inspired traditional preparation</span><span>No Preservatives</span><span>Hyderabad Delivery</span><span>Secure Packaging</span>
    </div></section>
    ${features()}
    <section class="section" id="products">
      <div class="section-inner products-head">
        <div><span class="eyebrow">Our Products</span><h2>Pure Ghee Collection</h2></div>
        <a class="btn ghost" href="#shop">View All ${icon("arrow-right")}</a>
      </div>
      <div class="section-inner products-grid">${products.slice(0, 4).map(productCard).join("")}</div>
    </section>
    ${aboutSection()}
    ${processSection()}
    ${storyBand()}
    ${reviewsSection()}
    ${bulkSection()}
    ${faqSection()}
  `;
  startHeroSlider();
}

function setHeroSlide(index) {
  activeHero = index;
  document.querySelectorAll(".hero-slide").forEach((slide, i) => slide.classList.toggle("active", i === activeHero));
  document.querySelectorAll(".slider-dot").forEach((dot, i) => dot.classList.toggle("active", i === activeHero));
  startHeroSlider();
}

function startHeroSlider() {
  clearInterval(heroTimer);
  if (!document.querySelector(".hero-slider")) return;
  if (window.matchMedia("(max-width: 700px)").matches) return;
  heroTimer = setInterval(() => setHeroSlide((activeHero + 1) % heroSlides.length), 5200);
}

function pageHero(title, copy) {
  return `<section class="page-hero"><div class="section-inner"><span class="eyebrow">EE Desi Delights</span><h1>${title}</h1><p>${copy}</p></div></section>`;
}

function storyBand() {
  return `
    <section class="section">
      <div class="section-inner split">
        <div>
          <span class="eyebrow">Why Our Ghee Feels Different</span>
          <h2>Warm aroma, clean ingredients, and a traditional finish</h2>
          <p>Milkzen-inspired movement meets EE Desi Delights tradition: animated content blocks, visual storytelling, and a premium ecommerce journey built around authentic Indian ghee.</p>
          <div class="button-row"><a class="btn primary" href="#about">${icon("book-open")} Our Story</a><a class="btn ghost" href="#shipping-policy">Delivery Details</a></div>
        </div>
        <div class="about-img"><img src="assets/hero-ghee-food.png" alt="Ghee served with Indian food" /></div>
      </div>
    </section>`;
}

function features() {
  return `
    <section class="features">
      <div class="features-grid">
        <div class="feature">${icon("leaf")}<div><b>Pure & Natural</b><span>No preservatives</span></div></div>
        <div class="feature">${icon("heart")}<div><b>Made With Love</b><span>Small batches</span></div></div>
        <div class="feature">${icon("flame")}<div><b>Rich Aroma</b><span>Slow simmered</span></div></div>
        <div class="feature">${icon("shield-check")}<div><b>Hygienic Packing</b><span>Double sealed</span></div></div>
        <div class="feature">${icon("rotate-ccw")}<div><b>Easy Returns</b><span>7-day support</span></div></div>
      </div>
    </section>`;
}

function aboutSection() {
  return `
    <section class="section cream-band" id="about">
      <div class="section-inner split">
        <div class="about-img"><img src="assets/traditional-process.png" alt="Inspired traditional ghee preparation" /></div>
        <div>
          <span class="eyebrow">About EE Desi Delights</span>
          <h2>Ghee made the slow, traditional way</h2>
          <p>EE Desi Delights is built around one promise: pure tradition in every spoon. Our ghee is prepared through patient heating, careful filtering, and honest packaging so the natural golden aroma stays intact.</p>
          <ul class="check-list">
            <li>${icon("check-circle")} Inspired traditional preparation</li>
            <li>${icon("check-circle")} Naturally grainy texture and deep aroma</li>
            <li>${icon("check-circle")} No chemicals, artificial colors, or preservatives</li>
            <li>${icon("check-circle")} Packed fresh in food-safe glass jars</li>
          </ul>
        </div>
      </div>
    </section>`;
}

function processSection() {
  const steps = [
    ["milk", "Selected Milk", "We source quality cow and buffalo milk for pure, flavorful ghee."],
    ["utensils", "Curd & Churn", "Curd is churned to separate butter in a traditional style."],
    ["flame", "Slow Simmer", "Butter is cooked gently until it turns aromatic and golden."],
    ["package-check", "Fresh Packing", "Every jar is filtered, sealed, and packed with care."]
  ];
  return `
    <section class="section">
      <div class="section-inner">
        <span class="eyebrow">How It's Made</span><h2>From milk to golden ghee</h2>
        <div class="process-grid" style="margin-top:24px">${steps.map(s => `<div class="process-card">${icon(s[0])}<h3>${s[1]}</h3><p>${s[2]}</p></div>`).join("")}</div>
      </div>
    </section>`;
}

function reviewsSection() {
  return `
    <section class="section cream-band">
      <div class="section-inner">
        <span class="eyebrow">Customer Reviews</span><h2>Loved by ghee families</h2>
        <div class="stats-grid" style="margin-top:24px">
          <div class="stat-card"><b>4.8</b><span>Average rating</span></div>
          <div class="stat-card"><b>1200+</b><span>Happy customers</span></div>
          <div class="stat-card"><b>3-5</b><span>Days PAN India</span></div>
          <div class="stat-card"><b>0</b><span>Preservatives</span></div>
        </div>
        <div class="reviews-grid" style="margin-top:20px">
          ${["Pure and authentic aroma.", "Perfect grainy texture.", "Packaging was neat and safe.", "Best ghee for dal and rice."].map((r, i) => `<div class="review-card"><div class="rating">&#9733;&#9733;&#9733;&#9733;&#9733;</div><h3>${r}</h3><p>${["Priyanka R.", "Rajesh M.", "Anitha K.", "Sandeep V."][i]} &bull; Verified Buyer</p></div>`).join("")}
        </div>
      </div>
    </section>`;
}

function bulkSection() {
  return `
    <section class="section" id="bulk">
      <div class="section-inner split">
        <div>
          <span class="eyebrow">Bulk Orders</span><h2>Pure ghee for events, stores, and gifting</h2>
          <p>Order EE Desi Delights ghee for weddings, corporate gifts, pooja needs, restaurants, sweet shops, and family functions. Demo bulk enquiry is included for the local site.</p>
          <div class="button-row"><button class="btn primary" onclick="showToast('Bulk enquiry demo submitted. We will call you shortly.')">${icon("send")} Request Quote</button><a class="btn ghost" href="#shop">Browse Packs</a></div>
        </div>
        <div class="about-img"><img src="assets/ghee-gift-hamper-ee.png" alt="EE Desi Delights Cow Ghee and Buffalo Ghee gift hamper" /></div>
      </div>
    </section>`;
}

function faqSection() {
  const faqs = [
    ["Is EE Desi Delights ghee preservative-free?", "Yes. The demo content presents every ghee product as free from preservatives, artificial colors, and chemicals."],
    ["Do you deliver outside Hyderabad?", "Yes, the checkout demo supports Hyderabad and PAN India delivery."],
    ["Can I pay with Razorpay?", "Yes. Razorpay checkout is connected through a server-side order and payment verification flow."],
    ["Can the address be detected automatically?", "Yes. Use the location button during checkout. Browser permission is required, and reverse geocoding is attempted for demo autofill."]
  ];
  return `<section class="section cream-band"><div class="section-inner"><span class="eyebrow">FAQ</span><h2>Ghee shopping questions</h2><div style="display:grid;gap:14px;margin-top:24px">${faqs.map(f => `<details class="faq-item"><summary><b>${f[0]}</b></summary><p>${f[1]}</p></details>`).join("")}</div></div></section>`;
}

function renderShop() {
  app.innerHTML = `
    <section class="section">
      <div class="section-inner products-head">
        <div><span class="eyebrow">Shop</span><h2>EE Desi Delights Ghee</h2><p>Choose from Cow Ghee and Buffalo Ghee.</p></div>
        <select id="sortProducts"><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select>
      </div>
      <div class="section-inner products-grid" id="shopGrid">${products.map(productCard).join("")}</div>
    </section>`;
  document.getElementById("sortProducts").addEventListener("change", e => {
    const sorted = [...products].sort((a, b) => e.target.value === "low" ? defaultSizeOption(a).price - defaultSizeOption(b).price : e.target.value === "high" ? defaultSizeOption(b).price - defaultSizeOption(a).price : 0);
    document.getElementById("shopGrid").innerHTML = sorted.map(productCard).join("");
    refreshIcons();
  });
}

function renderProduct(id) {
  const product = products.find(p => p.id === id) || products[0];
  const productSizes = sizeOptionsFor(product);
  const defaultOption = defaultSizeOption(product);
  app.innerHTML = `
    <section class="product-detail">
      <div class="breadcrumb">Home &rsaquo; Shop &rsaquo; ${product.type} &rsaquo; ${defaultOption.label}</div>
      <div class="detail-grid">
        <div>
          <div class="gallery-main"><span class="tag">${product.badge}</span><img id="mainProductImage" src="${product.img}" alt="${product.name}" /></div>
          <div class="thumbs">
            <img src="assets/cow-ghee-ee.png" onclick="setMainImage(this.src)" alt="Cow Ghee" />
            <img src="assets/buffalo-ghee-ee.png" onclick="setMainImage(this.src)" alt="Buffalo Ghee" />
            <img src="${product.img}" onclick="setMainImage(this.src)" alt="${product.name}" />
          </div>
        </div>
        <div class="detail-info">
          <h1>${product.name}</h1>
          <p class="detail-sub">Inspired traditional preparation | 100% Pure & Natural</p>
          <div class="rating">&#9733;&#9733;&#9733;&#9733;&#9733; ${product.rating} (${product.reviews} Reviews) | 1200+ Happy Customers</div>
          <div class="detail-price" id="detailPrice" data-unit-price="${defaultOption.price}">${money(defaultOption.price)}</div>
          <small>(Inclusive of all taxes)</small>
          <p>${product.desc}</p>
          <div class="assurance">
            <div>${icon("milk")}<span>A2 cow milk quality</span></div>
            <div>${icon("leaf")}<span>100% natural</span></div>
            <div>${icon("shield-check")}<span>No preservatives</span></div>
          </div>
          <h4>Select Size</h4>
          <div class="size-grid">${productSizes.map(s => `<button class="size-btn ${s.label === defaultOption.label ? "active" : ""}" data-size="${escapeAttr(s.label)}" onclick="selectSize(this, ${s.price})">${s.label}<br>${money(s.price)}</button>`).join("")}</div>
          <h4>Quantity</h4>
          <div class="qty-row">
            <div class="qty-control"><button onclick="changeDetailQty(-1)">&minus;</button><span id="detailQty">1</span><button onclick="changeDetailQty(1)">+</button></div>
            <button class="btn primary" onclick="addDetailToCart('${product.id}')">${icon("shopping-cart")} Add to Cart</button>
            <button class="btn gold" onclick="buyNow('${product.id}')">Buy Now</button>
          </div>
        </div>
      </div>
      <div class="tabs">
        <div class="tab-buttons">
          ${["Description", "Benefits", "Ingredients", "How It's Made", "Storage", "Shipping & Returns"].map((t, i) => `<button class="${i === 0 ? "active" : ""}" onclick="switchTab(this, '${t}')">${t}</button>`).join("")}
        </div>
        <div class="tab-content">
          <div id="tabText">
            <p>${product.name} is crafted for homes that value purity, taste, and traditional Indian cooking. Use it over hot rice, dal, rotis, sweets, and pooja preparations.</p>
            <ul class="check-list"><li>${icon("check-circle")} Rich in natural aroma</li><li>${icon("check-circle")} Supports authentic taste</li><li>${icon("check-circle")} No additives or preservatives</li></ul>
          </div>
          <div class="method-card">${icon("cooking-pot")}<div><h3>Inspired traditional preparation</h3><p>The traditional process churns curd into butter and slowly cooks it to create pure, aromatic ghee.</p></div></div>
        </div>
      </div>
    </section>
    <section class="section cream-band"><div class="section-inner"><h2>You May Also Like</h2><div class="products-grid" style="margin-top:24px">${products.filter(p => p.id !== product.id).slice(0,4).map(productCard).join("")}</div></div></section>`;
}

function renderCart() {
  const items = state.cart.map(line => {
    const product = products.find(p => p.id === line.id);
    return product ? { ...line, product, size: lineSize(line, product), unitPrice: lineUnitPrice(line, product), key: lineKey(line, product) } : null;
  }).filter(Boolean);
  const totals = cartTotals();
  app.innerHTML = `
    <section class="cart-page">
      <div class="section-inner"><span class="eyebrow">Cart</span><h2>Your Ghee Cart</h2></div>
      <div class="cart-grid" style="margin-top:24px">
        <div>${items.length ? items.map(item => cartItem(item)).join("") : `<div class="checkout-box"><h3>Your cart is empty</h3><p>Add pure EE Desi Delights ghee to continue.</p><a class="btn primary" href="#shop">Shop Now</a></div>`}</div>
        <aside class="summary-box">${summaryHtml(totals)}${couponHtml()}<div class="cart-action-row"><a class="btn primary" href="#checkout">${icon("lock")} Proceed</a><a class="btn whatsapp-order" href="${cartWhatsAppLink()}" target="_blank" rel="noreferrer">${icon("message-circle")} WhatsApp</a></div></aside>
      </div>
    </section>`;
}

function cartItem(item) {
  return `<div class="cart-item">
    <img src="${item.product.img}" alt="${item.product.name}" />
    <div><h3>${item.product.name}</h3><p>${item.size} &bull; ${money(item.unitPrice)} each</p><div class="line-actions"><div class="qty-control"><button onclick="updateQty('${item.key}', -1)">&minus;</button><span>${item.qty}</span><button onclick="updateQty('${item.key}', 1)">+</button></div><button class="remove-btn" onclick="removeFromCart('${item.key}')">Remove</button></div></div>
    <strong>${money(item.unitPrice * item.qty)}</strong>
  </div>`;
}

function cartTotals() {
  const subtotal = state.cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? lineUnitPrice(item, product) * item.qty : 0);
  }, 0);
  const shipping = subtotal ? Number(state.settings.shippingCharge || 0) : 0;
  const packing = subtotal ? Number(state.settings.packagingCharge || 0) : 0;
  const activeCoupon = String(state.settings.couponCode || "").trim().toUpperCase();
  const discountPercent = Math.max(0, Number(state.settings.couponDiscount || 0));
  const discount = activeCoupon && state.checkout.coupon === activeCoupon ? Math.round(subtotal * (discountPercent / 100)) : 0;
  return { subtotal, shipping, packing, discount, total: subtotal + shipping + packing - discount };
}

function summaryHtml(totals) {
  return `<h3>Order Summary</h3>
    <div class="summary-row"><span>Subtotal</span><b>${money(totals.subtotal)}</b></div>
    <div class="summary-row"><span>Shipping Charges</span><b>${money(totals.shipping)}</b></div>
    <div class="summary-row"><span>Packaging Charges</span><b>${money(totals.packing)}</b></div>
    <div class="summary-row"><span>Coupon Discount</span><b>- ${money(totals.discount)}</b></div>
    <div class="summary-row summary-total"><span>Total Amount</span><b>${money(totals.total)}</b></div>
    <small>Inclusive of all taxes</small>`;
}

function couponHtml() {
  const activeCoupon = String(state.settings.couponCode || "").trim().toUpperCase();
  const discountPercent = Math.max(0, Number(state.settings.couponDiscount || 0));
  const applied = activeCoupon && state.checkout.coupon === activeCoupon;
  return `<div class="coupon-block">
    <h4>Have a coupon?</h4>
    <div class="coupon">
      <input id="couponCode" aria-label="Coupon code" autocomplete="off" maxlength="20" placeholder="Enter coupon code" value="${state.checkout.coupon || ""}" onkeydown="if(event.key === 'Enter'){event.preventDefault(); applyCoupon();}" />
      <button class="${applied ? "remove-coupon" : ""}" onclick="${applied ? "removeCoupon()" : "applyCoupon()"}" type="button">${applied ? "Remove" : "Apply"}</button>
    </div>
    <small class="coupon-hint ${applied ? "applied" : ""}">${applied ? `${icon("badge-check")} ${activeCoupon} applied &mdash; ${discountPercent}% off` : activeCoupon ? `Use ${activeCoupon} for ${discountPercent}% off` : "Coupon offers are currently off"}</small>
  </div>`;
}

function productWhatsAppLink(product, qty, size = defaultSizeOption(product).label, unitPrice = defaultSizeOption(product).price) {
  const message = `Hello EE Desi Delights, I would like to order:\n${product.name} (${size})\nQuantity: ${qty}\nTotal: ${money(unitPrice * qty)}`;
  return `https://wa.me/919666677434?text=${encodeURIComponent(message)}`;
}

function cartWhatsAppLink() {
  const lines = state.cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return product ? `${product.name} (${lineSize(item, product)}) x ${item.qty} = ${money(lineUnitPrice(item, product) * item.qty)}` : "";
  }).filter(Boolean);
  const totals = cartTotals();
  const message = `Hello EE Desi Delights, I would like to place this order:\n${lines.join("\n")}\nTotal: ${money(totals.total)}`;
  return `https://wa.me/919666677434?text=${encodeURIComponent(message)}`;
}

function numericCoord(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function mapsLink(latitude, longitude) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return "";
  return `https://www.google.com/maps?q=${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`;
}

function checkoutAddressPayload() {
  const latitude = state.checkout.latitude || "";
  const longitude = state.checkout.longitude || "";
  const mapLink = state.checkout.mapLink || mapsLink(latitude, longitude);
  return {
    line1: state.checkout.address || "",
    landmark: state.checkout.landmark || "",
    city: state.checkout.city || "",
    state: state.checkout.stateName || "",
    pincode: state.checkout.pincode || "",
    note: state.checkout.note || "",
    latitude,
    longitude,
    mapLink
  };
}

function checkoutMapPicker(c = {}) {
  const latitude = c.latitude || "";
  const longitude = c.longitude || "";
  const mapLink = c.mapLink || mapsLink(latitude, longitude);
  return `
    <div class="checkout-map-card">
      <div class="checkout-map-head">
        <div>
          <h3>Pin Delivery Location</h3>
          <p>Use current location, click the map, or drag the pin. You can still edit the address above.</p>
        </div>
        <div class="map-actions">
          <button type="button" class="btn ghost" onclick="locateAddressOnMap()">${icon("search")} Find Address</button>
          <button type="button" class="btn ghost" onclick="useLocation()">${icon("crosshair")} Use Current Location</button>
        </div>
      </div>
      <div id="checkoutMap" class="checkout-map"></div>
      <div class="map-info-row">
        <span id="mapStatus">${latitude && longitude ? `Pinned: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : "Map pin not selected yet"}</span>
        <a id="mapPreviewLink" href="${mapLink || "#"}" target="_blank" rel="noreferrer" class="map-preview-link ${mapLink ? "" : "disabled"}">${icon("map")} Open Map</a>
      </div>
      <input type="hidden" id="latitude" value="${escapeAttr(latitude)}" />
      <input type="hidden" id="longitude" value="${escapeAttr(longitude)}" />
      <input type="hidden" id="mapLink" value="${escapeAttr(mapLink)}" />
    </div>`;
}

function updateMapFields(latitude, longitude, message = "Location pin updated") {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const link = mapsLink(lat, lng);
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");
  const linkInput = document.getElementById("mapLink");
  const status = document.getElementById("mapStatus");
  const preview = document.getElementById("mapPreviewLink");
  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
  if (linkInput) linkInput.value = link;
  if (status) status.textContent = `${message}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  if (preview) {
    preview.href = link;
    preview.classList.remove("disabled");
  }
}

function setCheckoutPin(latitude, longitude, zoom = 16, message = "Location pin updated") {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (checkoutMarker) checkoutMarker.setLatLng([lat, lng]);
  if (checkoutMap) checkoutMap.setView([lat, lng], zoom);
  updateMapFields(lat, lng, message);
}

function initCheckoutMap() {
  const mapNode = document.getElementById("checkoutMap");
  if (!mapNode) return;
  const hasSavedPin = Boolean(state.checkout.latitude && state.checkout.longitude);
  const lat = numericCoord(state.checkout.latitude, 17.385044);
  const lng = numericCoord(state.checkout.longitude, 78.486671);
  if (hasSavedPin) updateMapFields(lat, lng, "Saved pin");
  else {
    const status = document.getElementById("mapStatus");
    if (status) status.textContent = "Use current location, find address, or tap the map to set exact delivery pin.";
  }
  if (typeof L === "undefined") {
    const status = document.getElementById("mapStatus");
    if (status) status.textContent = "Map could not load. Use Current Location to save GPS coordinates.";
    return;
  }
  if (checkoutMap) {
    checkoutMap.remove();
    checkoutMap = null;
    checkoutMarker = null;
  }
  checkoutMap = L.map("checkoutMap", { scrollWheelZoom: false }).setView([lat, lng], hasSavedPin ? 16 : 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(checkoutMap);
  checkoutMarker = L.marker([lat, lng], { draggable: true }).addTo(checkoutMap);
  checkoutMarker.on("dragend", async () => {
    const point = checkoutMarker.getLatLng();
    updateMapFields(point.lat, point.lng, "Pin dragged");
    await reverseGeocode(point.lat, point.lng, true);
  });
  checkoutMap.on("click", async event => {
    setCheckoutPin(event.latlng.lat, event.latlng.lng, checkoutMap.getZoom(), "Pin selected");
    await reverseGeocode(event.latlng.lat, event.latlng.lng, true);
  });
  setTimeout(() => checkoutMap?.invalidateSize(), 250);
}

function clearCheckoutPinForAddressEdit() {
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");
  const linkInput = document.getElementById("mapLink");
  const status = document.getElementById("mapStatus");
  const preview = document.getElementById("mapPreviewLink");
  if (latInput) latInput.value = "";
  if (lngInput) lngInput.value = "";
  if (linkInput) linkInput.value = "";
  state.checkout.latitude = "";
  state.checkout.longitude = "";
  state.checkout.mapLink = "";
  if (status) status.textContent = "Address changed. Tap Find Address or Use Current Location to update the exact pin.";
  if (preview) {
    preview.href = "#";
    preview.classList.add("disabled");
  }
}

function attachLocationEditGuards() {
  ["address", "landmark", "city", "pincode"].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.addEventListener("input", clearCheckoutPinForAddressEdit);
  });
  const stateField = document.getElementById("stateName");
  if (stateField) stateField.addEventListener("change", clearCheckoutPinForAddressEdit);
}
async function reverseGeocode(latitude, longitude, fillAddress = true) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
    const data = await res.json();
    const a = data.address || {};
    if (fillAddress) {
      const addressField = document.getElementById("address");
      const cityField = document.getElementById("city");
      const pinField = document.getElementById("pincode");
      const stateField = document.getElementById("stateName");
      if (addressField) addressField.value = data.display_name || `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
      if (cityField) cityField.value = a.city || a.town || a.village || a.suburb || "";
      if (pinField) pinField.value = a.postcode || "";
      if (stateField) stateField.innerHTML = `<option>${a.state || "Telangana"}</option><option>Telangana</option><option>Andhra Pradesh</option><option>Karnataka</option><option>Maharashtra</option><option>Tamil Nadu</option><option>Delhi</option>`;
    }
    collectCheckout();
    return data;
  } catch {
    collectCheckout();
    showToast("GPS saved. Address lookup was unavailable.");
    return null;
  }
}

async function locateAddressOnMap() {
  const query = [
    document.getElementById("address")?.value,
    document.getElementById("landmark")?.value,
    document.getElementById("city")?.value,
    document.getElementById("stateName")?.value,
    document.getElementById("pincode")?.value
  ].filter(Boolean).join(", ");
  if (!query.trim()) { showToast("Enter address first, then tap Find Address"); return; }
  showToast("Finding address on map...");
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data?.length) { showToast("Address not found. Please use current location or drag the pin."); return; }
    const point = data[0];
    setCheckoutPin(point.lat, point.lon, 17, "Address found");
    await reverseGeocode(point.lat, point.lon, false);
    collectCheckout();
    showToast("Map pin updated from address");
  } catch {
    showToast("Could not search address right now");
  }
}

function renderCheckout() {
  if (!state.cart.length) { location.hash = "#cart"; return; }
  const totals = cartTotals();
  const c = state.checkout;
  app.innerHTML = `
    <section class="checkout-page">
      <div class="section-inner">
        <div class="breadcrumb">Home &rsaquo; Cart &rsaquo; Checkout</div>
        <h2>Checkout <span style="font:600 15px Poppins;color:var(--green)">${icon("lock")} 100% Secure Checkout</span></h2>
        <div class="steps"><div class="step active"><b>1</b>Shipping Details</div><div class="step active"><b>2</b>Payment</div><div class="step active"><b>3</b>Review & Place Order</div></div>
      </div>
      <div class="checkout-grid">
        <form class="checkout-box" id="checkoutForm">
          <div class="location-row"><div><h3>Shipping Details</h3><p>Enter where you want your ghee delivered.</p></div><button type="button" class="btn ghost" onclick="useLocation()">${icon("map-pin")} Use Location</button></div>
          <div class="form-grid">
            ${field("fullName", "Full Name", c.fullName || state.user?.name || "", "Enter your full name")}
            ${field("phone", "Phone Number", c.phone || "", "+91 Enter mobile number")}
            ${field("email", "Email Address", c.email || state.user?.email || "", "Enter email")}
            ${field("address", "Address", c.address || "", "House no., Building, Street, Area", true)}
            ${field("landmark", "Landmark", c.landmark || "", "E.g. Near Sai Baba Temple")}
            ${field("city", "City", c.city || "", "Enter city")}
            <div class="field"><label>State</label><select id="stateName"><option>${c.stateName || "Telangana"}</option><option>Andhra Pradesh</option><option>Karnataka</option><option>Maharashtra</option><option>Tamil Nadu</option><option>Delhi</option></select></div>
            ${field("pincode", "Pincode", c.pincode || "", "Enter pincode")}
            ${field("note", "Delivery Note", c.note || "", "Any special instructions?")}
          </div>
          ${checkoutMapPicker(c)}
          <div style="height:22px"></div>
          <h3>Delivery Options</h3>
          <div class="delivery-options">
            <label class="option active"><span><input type="radio" name="delivery" checked /> Standard Delivery<br><small>3-5 Working Days PAN India</small></span><b>${money(80)}</b></label>
            <label class="option"><span><input type="radio" name="delivery" /> Express Delivery<br><small>1-2 Working Days selected locations</small></span><b>${money(150)}</b></label>
          </div>
          <div style="height:22px"></div>
          <h3>Payment Method</h3>
          <div class="payment-options">
            <label class="option active"><span><input type="radio" name="payment" value="razorpay" checked /> UPI / Google Pay / PhonePe / Paytm<br><small>Secure Razorpay checkout</small></span><b>Razorpay</b></label>
            <label class="option"><span><input type="radio" name="payment" value="card" /> Credit / Debit Card<br><small>Visa, Mastercard, RuPay and more</small></span><b>Card</b></label>
          </div>
          <button class="btn primary" style="width:100%;margin-top:24px" type="submit">${icon("lock")} Proceed to Payment</button>
        </form>
        <aside>
          <div class="summary-box">
            <h3>${icon("shopping-bag")} Order Summary</h3>
            ${state.cart.map(line => {
              const p = products.find(x => x.id === line.id);
              const size = lineSize(line, p);
              const unitPrice = lineUnitPrice(line, p);
              return `<div class="summary-product"><img src="${p.img}" alt="${p.name}" /><div><b>${p.name}</b><br><small>${size}<br>Qty: ${line.qty}</small></div><b>${money(unitPrice * line.qty)}</b></div>`;
            }).join("")}
            ${summaryHtml(totals)}
          </div>
          <div class="summary-box" style="margin-top:14px">
            ${couponHtml()}
          </div>
          <div class="summary-box" style="margin-top:14px"><h3>Why Shop With Us?</h3><p>Pure ghee, secure packaging, fast delivery, easy returns, and trusted checkout.</p></div>
        </aside>
      </div>
    </section>`;
  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
  initCheckoutMap();
  attachLocationEditGuards();
}

function field(id, label, value, placeholder, wide = false) {
  return `<div class="field ${wide ? "field-wide" : ""}"><label>${label}</label>${wide ? `<textarea id="${id}" placeholder="${placeholder}" required>${value}</textarea>` : `<input id="${id}" value="${value}" placeholder="${placeholder}" ${["fullName","phone","email","city","pincode"].includes(id) ? "required" : ""} />`}</div>`;
}

function renderDashboard() {
  if (!state.user) { openAuth("login"); app.innerHTML = `<section class="section"><div class="section-inner"><h2>Please login to view dashboard</h2><p>Your demo orders and profile appear after login.</p></div></section>`; return; }
  app.innerHTML = `
    <section class="dashboard-page">
      <div class="section-inner"><span class="eyebrow">My Account</span><h2>User Dashboard</h2></div>
      <div class="dashboard-grid" style="margin-top:24px">
        <aside class="dashboard-nav">
          <button class="active" onclick="dashTab('overview', this)">Overview</button>
          <button onclick="dashTab('orders', this)">Orders</button>
          <button onclick="dashTab('profile', this)">Profile</button>
          <button onclick="logout()">Logout</button>
        </aside>
        <div id="dashContent">${dashboardOverview()}</div>
      </div>
    </section>`;
}

function renderAboutPage() {
  app.innerHTML = `
    ${pageHero("About EE Desi Delights", "A premium Indian ghee brand built on purity, traditional methods, and honest packaging.")}
    ${aboutSection()}
    ${processSection()}
    <section class="section">
      <div class="section-inner">
        <span class="eyebrow">Our Promise</span><h2>Pure tradition in every spoon</h2>
        <div class="process-grid" style="margin-top:24px">
          <div class="process-card">${icon("leaf")}<h3>Natural</h3><p>No chemicals, artificial colors, or preservatives are added to our demo ghee products.</p></div>
          <div class="process-card">${icon("heart")}<h3>Made With Love</h3><p>Small-batch preparation keeps the aroma, grainy texture, and rich traditional taste intact.</p></div>
          <div class="process-card">${icon("shield-check")}<h3>Trusted Packing</h3><p>Glass jars, secure sealing, and clean dispatch workflows support a premium delivery experience.</p></div>
          <div class="process-card">${icon("map-pin")}<h3>India Ready</h3><p>Designed for Hyderabad local delivery and PAN India shipping in the ecommerce checkout flow.</p></div>
        </div>
      </div>
    </section>`;
}

function renderBulkPage() {
  app.innerHTML = `
    ${pageHero("Bulk Ghee Orders", "Wedding gifts, festive hampers, restaurants, pooja supplies, and corporate gifting with EE Desi Delights.")}
    ${bulkSection()}
    <section class="section cream-band">
      <div class="section-inner split">
        <div class="about-img"><img src="assets/ghee-gift-hamper-ee.png" alt="EE Desi Delights Cow Ghee and Buffalo Ghee gift hamper" /></div>
        <div>
          <span class="eyebrow">Bulk Categories</span><h2>Built for gifting and food service</h2>
          <ul class="check-list">
            <li>${icon("check-circle")} Wedding return gifts and festive hampers</li>
            <li>${icon("check-circle")} Sweet shops, restaurants, caterers, and cloud kitchens</li>
            <li>${icon("check-circle")} Pooja, temple, and daily diya requirements</li>
            <li>${icon("check-circle")} Custom quantity packs for family events</li>
          </ul>
          <button class="btn primary" onclick="showToast('Bulk order demo request submitted')">${icon("phone-call")} Request Call Back</button>
        </div>
      </div>
    </section>`;
}

function renderContactPage() {
  app.innerHTML = `
    ${pageHero("Contact Us", "Questions about ghee, delivery, bulk orders, or demo checkout? We are here to help.")}
    <section class="section">
      <div class="section-inner split">
        <form class="checkout-box" onsubmit="event.preventDefault(); showToast('Contact form submitted in demo mode'); this.reset();">
          <h3>Send Enquiry</h3>
          <div class="form-grid">
            <div class="field"><label>Name</label><input required placeholder="Your name" /></div>
            <div class="field"><label>Phone</label><input required placeholder="+91 mobile number" /></div>
            <div class="field"><label>Email</label><input type="email" placeholder="Email address" /></div>
            <div class="field field-wide"><label>Message</label><textarea required placeholder="Tell us what you need"></textarea></div>
          </div>
          <button class="btn primary" type="submit" style="margin-top:18px">${icon("send")} Submit</button>
        </form>
        <div>
          <span class="eyebrow">Reach EE Desi Delights</span><h2>Hyderabad based, PAN India ready</h2>
          <p><b>Phone:</b> +91 96666 77434</p>
          <p><b>Email:</b> eedesidelights@gmail.com</p>
          <p><b>Address:</b> Hyderabad, Telangana, India</p>
          <p><b>Hours:</b> Mon - Sun, 9:00 AM - 9:00 PM</p>
          <div class="button-row"><a class="btn gold" href="https://wa.me/919666677434" target="_blank">${icon("message-circle")} WhatsApp</a><a class="btn ghost" href="#shop">Shop Now</a></div>
        </div>
      </div>
    </section>`;
}

function renderFaqPage() {
  app.innerHTML = `${pageHero("Frequently Asked Questions", "Everything customers usually ask before buying pure Indian ghee online.")}${faqSection()}`;
}

function renderPolicyPage(type) {
  const pages = {
    "shipping-policy": {
      title: "Shipping & Delivery Policy",
      copy: "Demo shipping rules for EE Desi Delights ghee orders across Hyderabad and PAN India.",
      points: [
        "Hyderabad delivery is estimated in 2-3 working days after order confirmation.",
        "PAN India standard delivery is estimated in 3-5 working days depending on the pincode.",
        "Every ghee jar is sealed, cushioned, and packed to reduce leakage or breakage risk.",
        "Shipping charges are shown during checkout before payment."
      ]
    },
    "returns-policy": {
      title: "Returns & Refunds Policy",
      copy: "A customer-friendly demo policy for damaged, incorrect, or quality concern orders.",
      points: [
        "Raise a return request within 7 days of delivery for damaged or incorrect items.",
        "Food safety rules mean opened jars cannot be returned unless there is a verified quality issue.",
        "Refunds are processed to the original payment mode in this demo policy.",
        "Clear photos of packaging and jar condition may be requested for support."
      ]
    },
    "privacy-policy": {
      title: "Privacy Policy",
      copy: "How the demo website handles account, cart, checkout, and location information.",
      points: [
        "This local demo stores login, cart, and order information in your browser localStorage.",
        "Location access is optional and used only to autofill checkout address fields.",
        "Checkout and order information can be stored in the connected EE Desi Delights Supabase backend.",
        "Razorpay is loaded only when payment checkout is required."
      ]
    },
    terms: {
      title: "Terms & Conditions",
      copy: "Demo ecommerce terms for using the EE Desi Delights local website.",
      points: [
        "Product prices, delivery timelines, and offers can be updated from the admin panel.",
        "Razorpay live/test mode depends on the keys configured in Vercel.",
        "Images and copy are prepared for presentation and can be replaced with final business assets.",
        "By placing a demo order, you agree that the order is stored locally for dashboard preview only."
      ]
    }
  };
  const page = pages[type] || pages.terms;
  app.innerHTML = `
    ${pageHero(page.title, page.copy)}
    <section class="section">
      <div class="section-inner">
        <div class="checkout-box">
          <h2>${page.title}</h2>
          <p>${page.copy}</p>
          <ul class="check-list">${page.points.map(point => `<li>${icon("check-circle")} ${point}</li>`).join("")}</ul>
        </div>
      </div>
    </section>`;
}

function renderAdminLogin() {
  app.innerHTML = `
    <section class="admin-auth-screen">
      <div class="admin-auth-brand">
        <img src="${state.settings.headerLogo || "assets/logo-transparent.png"}" alt="EE Desi Delights" />
        <span>Admin Control Center</span>
      </div>
      <form class="admin-login checkout-box" onsubmit="adminLogin(event)">
        <span class="eyebrow">Secure Mock Login</span>
        <h2>Admin Panel</h2>
        <p>Use the Supabase admin email and password to manage live products, prices, images, orders, content, and Razorpay settings.</p>
        <div class="form-grid">
          <div class="field"><label>Email</label><input id="adminEmail" type="email" placeholder="Admin email" required /></div>
          <div class="field"><label>Password</label><input id="adminPassword" type="password" placeholder="Admin password" required /></div>
        </div>
        <button class="btn primary" type="submit" style="margin-top:18px">${icon("lock-keyhole")} Login to Admin</button>
        <a class="btn ghost" href="#home" style="margin-top:10px">${icon("arrow-left")} Back to Website</a>
      </form>
    </section>`;
}

function renderAdmin() {
  if (!state.admin) { renderAdminLogin(); return; }
  app.innerHTML = `
    <section class="admin-page">
      <aside class="admin-sidebar">
        <div class="admin-side-brand">
          <img src="${state.settings.footerLogo || "assets/logo-white.png"}" alt="EE Desi Delights" />
          <span>Store Admin</span>
        </div>
        <nav class="admin-nav">
          <button class="active" data-admin-tab="overview" onclick="adminTab('overview', this)">${icon("layout-dashboard")} Overview</button>
          <button data-admin-tab="products" onclick="adminTab('products', this)">${icon("package")} Products</button>
          <button data-admin-tab="orders" onclick="adminTab('orders', this)">${icon("receipt")} Orders</button>
          <button data-admin-tab="users" onclick="adminTab('users', this)">${icon("users")} Users</button>
          <button data-admin-tab="media" onclick="adminTab('media', this)">${icon("image")} Images & Content</button>
          <button data-admin-tab="seo" onclick="adminTab('seo', this)">${icon("search-check")} SEO Reports</button>
          <button data-admin-tab="razorpay" onclick="adminTab('razorpay', this)">${icon("credit-card")} Razorpay</button>
        </nav>
        <div class="admin-side-card">
          <b>${state.admin?.cloud ? "Live Database" : "Local Preview"}</b>
          <span>${state.admin?.cloud ? "Changes sync to Supabase." : "Login with Supabase admin to save live changes."}</span>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar">
          <div>
            <span class="eyebrow">EE Desi Delights Admin</span>
            <h2 id="adminPageTitle">Control Center</h2>
            <p>Manage ghee products, users, orders, images, and Razorpay settings.</p>
          </div>
          <div class="admin-top-actions">
            <a class="btn ghost" href="#home">${icon("external-link")} View Website</a>
            <button class="btn gold" onclick="adminLogout()">${icon("log-out")} Logout</button>
          </div>
        </div>
        <div class="admin-content" id="adminContent">${adminOverview()}</div>
      </div>
    </section>`;
}

function adminOverview() {
  const totals = state.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const latest = state.orders.slice(0, 4);
  return `
    <div class="admin-metrics">
      <div class="admin-metric">${icon("package")}<span>Products</span><b>${products.length}</b><small>Live catalog items</small></div>
      <div class="admin-metric">${icon("users")}<span>Users</span><b>${state.users.length}</b><small>Customer records</small></div>
      <div class="admin-metric">${icon("receipt")}<span>Orders</span><b>${state.orders.length}</b><small>Order history</small></div>
      <div class="admin-metric">${icon("indian-rupee")}<span>Revenue</span><b>${money(totals)}</b><small>Store sales</small></div>
    </div>
    <div class="admin-two-col">
      <section class="admin-panel">
        <div class="admin-panel-head"><div><span class="eyebrow">Quick Health</span><h3>Store Snapshot</h3></div><span class="admin-pill live">${state.admin?.cloud ? "Live DB" : "Preview"}</span></div>
        <div class="admin-health">
          <div><b>Razorpay</b><span>${state.settings.razorpayEnabled ? "Enabled" : "Disabled"}</span></div>
          <div><b>Merchant</b><span>${state.settings.razorpayMerchant}</span></div>
          <div><b>Hero Slides</b><span>${heroSlides.length} active</span></div>
          <div><b>Support</b><span>${state.settings.supportPhone}</span></div>
        </div>
      </section>
      <section class="admin-panel">
        <div class="admin-panel-head"><div><span class="eyebrow">Latest Orders</span><h3>Recent Activity</h3></div><button class="admin-mini-btn" onclick="adminSelectTab('orders')">View All</button></div>
        ${latest.length ? latest.map(order => `<div class="admin-activity"><div><b>${order.id}</b><span>${order.date} &bull; ${order.items.length} items</span></div><strong>${money(order.total)}</strong></div>`).join("") : `<p>No orders yet. Place a demo order from checkout.</p>`}
      </section>
    </div>`;
}

function adminSeo() {
  const keywords = [
    ["pure ghee in Hyderabad", 93, "High intent local keyword"],
    ["A2 cow ghee online", 89, "Strong ecommerce search"],
    ["traditional ghee Hyderabad", 91, "Premium traditional ghee intent"],
    ["best cow ghee in Telangana", 86, "Regional discovery keyword"],
    ["organic ghee online India", 82, "National delivery keyword"],
    ["buffalo ghee near me", 78, "Local product query"]
  ];
  const checks = [
    ["Meta title", "Optimized", "EE Desi Delights | Pure Ghee Store"],
    ["Product content", "Strong", `${products.length} ghee products with keyword-rich descriptions`],
    ["Image alt text", "Good", "Product and brand images include readable alt text"],
    ["Local SEO", "Ready", "Hyderabad, Telangana and PAN India delivery signals included"],
    ["Mobile UX", "Passed", "Responsive layout checked with no horizontal overflow"],
    ["Conversion SEO", "Ready", "Checkout, reviews, FAQ, and policy pages available"]
  ];
  return `
    <section class="admin-panel seo-panel">
      <div class="admin-panel-head">
        <div><span class="eyebrow">Client SEO Report</span><h3>Search Visibility Score</h3><p>Demo SEO health report for EE Desi Delights ghee website.</p></div>
        <span class="admin-pill live">93% Optimized</span>
      </div>
      <div class="seo-hero">
        <div class="seo-score-ring"><b>93%</b><span>SEO Score</span></div>
        <div>
          <h2>Ready to rank for premium ghee searches</h2>
          <p>The website is structured around local buying intent, product-led keywords, trusted policy pages, and conversion content for ghee customers.</p>
          <div class="seo-mini-grid">
            <div><b>18+</b><span>Search Signals</span></div>
            <div><b>6</b><span>Target Keywords</span></div>
            <div><b>100%</b><span>Mobile Ready</span></div>
          </div>
        </div>
      </div>
      <div class="admin-two-col">
        <div>
          <div class="admin-panel-head compact"><div><span class="eyebrow">Target Keywords</span><h3>Keyword Readiness</h3></div></div>
          <div class="keyword-list">
            ${keywords.map(([keyword, score, note]) => `<div class="keyword-row"><div><b>${keyword}</b><span>${note}</span></div><strong>${score}%</strong><div class="keyword-bar"><i style="width:${score}%"></i></div></div>`).join("")}
          </div>
        </div>
        <div>
          <div class="admin-panel-head compact"><div><span class="eyebrow">Technical Checks</span><h3>SEO Audit</h3></div></div>
          <div class="seo-check-list">
            ${checks.map(([label, status, note]) => `<div class="seo-check">${icon("check-circle")}<div><b>${label}</b><span>${note}</span></div><em>${status}</em></div>`).join("")}
          </div>
        </div>
      </div>
      <div class="seo-recommend">
        <h3>Next Growth Suggestions</h3>
        <p>Add monthly blog posts for "how to identify pure ghee", "benefits of traditional ghee", and "best ghee for Indian cooking" to improve organic traffic further.</p>
      </div>
    </section>`;
}

function adminSizeRowHtml(productId, option = {}, index = Date.now(), isDefault = false) {
  return `
    <div class="admin-size-row">
      <label>Size / Label<input class="admin-size-label" value="${escapeAttr(option.label || "")}" placeholder="Example: 500 ml" /></label>
      <label>Selling Price<input class="admin-size-price" type="number" min="1" value="${Number(option.price || "") || ""}" placeholder="Example: 799" /></label>
      <label class="admin-default-size"><input class="admin-size-default" type="radio" name="p-default-size-${escapeAttr(productId)}" ${isDefault ? "checked" : ""} /> Default</label>
      <button class="admin-mini-btn danger" type="button" onclick="removeAdminSizeRow(this)">Remove</button>
    </div>`;
}

function adminProductSizeEditor(product) {
  const options = sizeOptionsFor(product);
  const defaultOption = defaultSizeOption(product);
  return `
    <div class="admin-price-editor">
      <div class="admin-price-editor-head">
        <b>Size & Price Options</b>
        <span>Edit, add, or remove the sizes shown on the product cards.</span>
      </div>
      <div class="admin-size-list" id="p-size-list-${product.id}">
        ${options.map((option, index) => adminSizeRowHtml(product.id, option, index, option.label === defaultOption.label)).join("")}
      </div>
      <button class="admin-mini-btn" type="button" onclick="addAdminSizeRow('${product.id}')">${icon("plus")} Add Size / Price</button>
    </div>`;
}

function adminPricingSettings() {
  return `
    <div class="admin-price-settings">
      <div class="admin-price-editor-head">
        <b>Cart Charges & Coupon</b>
        <span>These values update the cart and checkout totals.</span>
      </div>
      <div class="admin-settings-grid compact-grid">
        <div class="field"><label>Shipping Charge</label><input id="set-shippingCharge" type="number" min="0" value="${Number(state.settings.shippingCharge || 0)}" /></div>
        <div class="field"><label>Packaging Charge</label><input id="set-packagingCharge" type="number" min="0" value="${Number(state.settings.packagingCharge || 0)}" /></div>
        <div class="field"><label>Coupon Code</label><input id="set-couponCode" value="${escapeAttr(state.settings.couponCode || "")}" placeholder="Example: GHEE10" /></div>
        <div class="field"><label>Coupon Discount %</label><input id="set-couponDiscount" type="number" min="0" max="100" value="${Number(state.settings.couponDiscount || 0)}" /></div>
      </div>
      <button class="btn primary" type="button" onclick="savePricingSettings()">${icon("save")} Save Cart Pricing</button>
    </div>`;
}

function adminProducts() {
  return `
    <section class="admin-panel">
      <div class="admin-panel-head"><div><span class="eyebrow">Catalog Manager</span><h3>Product Editor</h3><p>Edit products, badges, images, and every size-wise price from one place.</p></div><button class="btn gold" onclick="addAdminProduct()">${icon("plus")} Add Product</button></div>
      ${adminPricingSettings()}
      <div class="admin-product-grid">
        ${products.map(product => `
          <article class="admin-product-card">
            <div class="admin-product-media">
              <img src="${product.img}" alt="${product.name}" />
              <label>${icon("upload")} Change Image<input type="file" accept="image/*" onchange="adminUploadProductImage('${product.id}', this)" /></label>
            </div>
            <div class="admin-product-form">
              <div class="admin-inline">
                <label class="admin-field">Product Name<input id="p-name-${product.id}" value="${escapeAttr(product.name)}" /></label>
                <label class="admin-field">Badge<input id="p-badge-${product.id}" value="${escapeAttr(product.badge)}" /></label>
              </div>
              <textarea id="p-desc-${product.id}">${product.desc}</textarea>
              <div class="admin-inline">
                <label class="admin-field">Product Type<input id="p-type-${product.id}" value="${escapeAttr(product.type)}" /></label>
                <label class="admin-field">MRP / Old Price<input id="p-old-${product.id}" type="number" value="${product.old || defaultSizeOption(product).price}" /></label>
              </div>
              ${adminProductSizeEditor(product)}
            </div>
            <div class="admin-product-actions">
              <span class="admin-pill">${defaultSizeOption(product).label}<br>${money(defaultSizeOption(product).price)}</span>
              <button class="btn primary" onclick="saveAdminProduct('${product.id}')">${icon("save")} Save Product</button>
              <button class="btn ghost danger" onclick="deleteAdminProduct('${product.id}')">${icon("trash-2")} Delete</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>`;
}

function orderMapLink(order) {
  const address = order.address || {};
  return address.mapLink || mapsLink(address.latitude, address.longitude);
}

function adminOrderAddress(order) {
  const address = order.address || {};
  const customer = order.customer || {};
  const mapLink = orderMapLink(order);
  const addressText = [address.line1, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(", ");
  return `<div class="admin-order-address">
    <span>${icon("user")} ${customer.name || "Customer"} ${customer.phone ? `&bull; ${customer.phone}` : ""}</span>
    <span>${icon("map-pin")} ${addressText || "Address not available"}</span>
    ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noreferrer">${icon("navigation")} Open exact map location</a>` : `<em>No map pin saved</em>`}
  </div>`;
}

function adminOrders() {
  return `<section class="admin-panel"><div class="admin-panel-head"><div><span class="eyebrow">Fulfilment</span><h3>Orders</h3><p>Track orders, delivery address, and exact map pin.</p></div></div>
  <div class="admin-list">${state.orders.length ? state.orders.map(order => `
    <div class="admin-list-row admin-order-row">
      <div><b>${order.id}</b><span>${order.date} &bull; ${order.items.length} items</span>${adminOrderAddress(order)}</div>
      <span class="admin-pill live">${order.status}</span>
      <select onchange="updateOrderStatus('${order.id}', this.value)"><option>${order.status}</option><option>Processing</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select>
      <strong>${money(order.total)}</strong>
    </div>`).join("") : "<p>No orders yet.</p>"}</div></section>`;
}

function adminUsers() {
  return `<section class="admin-panel"><div class="admin-panel-head"><div><span class="eyebrow">Customers</span><h3>Users Data</h3><p>Demo users created from signup, login, and guest checkout.</p></div></div>
    <div class="admin-list">${state.users.map(user => `<div class="admin-list-row user-row"><div class="admin-avatar">${(user.name || "D").slice(0,1)}</div><div><b>${user.name}</b><span>${user.email}</span></div><span>${user.phone || "-"}</span><span>${user.joined || "-"}</span><span class="admin-pill">${user.role || "customer"}</span></div>`).join("") || `<p>No users yet.</p>`}</div>
  </section>`;
}

function adminMedia() {
  return `
    <section class="admin-panel">
      <div class="admin-panel-head"><div><span class="eyebrow">Brand Controls</span><h3>Images & Site Content</h3><p>Upload logos and hero slider images. Changes apply to the public site immediately.</p></div></div>
      <div class="admin-settings-grid">
        ${adminImageField("headerLogo", "Header Logo", state.settings.headerLogo)}
        ${adminImageField("footerLogo", "Footer White Logo", state.settings.footerLogo)}
        <div class="field"><label>Brand Name</label><input id="set-brandName" value="${escapeAttr(state.settings.brandName)}" /></div>
        <div class="field"><label>Support Phone</label><input id="set-supportPhone" value="${escapeAttr(state.settings.supportPhone)}" /></div>
        <div class="field"><label>Support Email</label><input id="set-supportEmail" value="${escapeAttr(state.settings.supportEmail)}" /></div>
        <div class="field field-wide"><label>Store Address</label><input id="set-address" value="${escapeAttr(state.settings.address)}" /></div>
      </div>
      <div class="admin-panel-head hero-editor-head"><div><span class="eyebrow">Homepage Motion</span><h3>Hero Slider</h3></div></div>
      <div class="admin-hero-list">
        ${heroSlides.map((slide, index) => `
          <div class="admin-hero-card">
            <img src="${slide.image}" alt="Hero ${index + 1}" />
            <div class="admin-hero-fields">
              <div class="admin-inline"><input id="h-eyebrow-${index}" value="${escapeAttr(slide.eyebrow)}" /><input id="h-cta-${index}" value="${escapeAttr(slide.cta)}" /></div>
              <input id="h-title-${index}" value="${escapeAttr(slide.title)}" />
              <textarea id="h-copy-${index}">${slide.copy}</textarea>
              <div class="admin-inline"><input id="h-link-${index}" value="${escapeAttr(slide.link)}" /><input type="file" accept="image/*" onchange="adminUploadHero(${index}, this)" /></div>
              <button class="btn primary" onclick="saveHeroSlide(${index})">${icon("save")} Save Slide ${index + 1}</button>
            </div>
          </div>
        `).join("")}
      </div>
      <button class="btn primary" style="margin-top:18px" onclick="saveSiteSettings()">${icon("save")} Save Site Settings</button>
    </section>`;
}

function adminImageField(key, label, value) {
  return `<div class="field"><label>${label}</label><input id="set-${key}" value="${escapeAttr(value)}" /><input type="file" accept="image/*" onchange="adminUploadSettingImage('${key}', this)" /></div>`;
}

function adminRazorpay() {
  return `
    <section class="admin-panel payment-panel">
      <div class="admin-panel-head"><div><span class="eyebrow">Payment Gateway</span><h3>Razorpay Admin Settings</h3><p>Enable/disable Razorpay and set the public Key ID. Secret keys stay only in Vercel environment variables.</p></div><span class="admin-pill live">${state.settings.razorpayEnabled ? "Enabled" : "Disabled"}</span></div>
      <div class="admin-settings-grid">
        <div class="field"><label>Enable Razorpay</label><select id="set-razorpayEnabled"><option value="true" ${state.settings.razorpayEnabled ? "selected" : ""}>Enabled</option><option value="false" ${!state.settings.razorpayEnabled ? "selected" : ""}>Disabled</option></select></div>
        <div class="field"><label>Razorpay Key ID</label><input id="set-razorpayKey" value="${escapeAttr(state.settings.razorpayKey)}" /></div>
        <div class="field"><label>Merchant Name</label><input id="set-razorpayMerchant" value="${escapeAttr(state.settings.razorpayMerchant)}" /></div>
        <div class="field"><label>Currency</label><input id="set-razorpayCurrency" value="${escapeAttr(state.settings.razorpayCurrency)}" /></div>
      </div>
      <button class="btn primary" style="margin-top:18px" onclick="saveRazorpaySettings()">${icon("save")} Save Razorpay Settings</button>
      <button class="btn ghost" style="margin-top:18px" onclick="testRazorpaySettings()">${icon("credit-card")} Test Popup</button>
    </section>`;
}

function adminTab(tab, btn) {
  document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const views = { overview: adminOverview, products: adminProducts, orders: adminOrders, users: adminUsers, media: adminMedia, seo: adminSeo, razorpay: adminRazorpay };
  document.getElementById("adminContent").innerHTML = views[tab]();
  const titles = { overview: "Control Center", products: "Product Studio", orders: "Order Desk", users: "Customer Records", media: "Brand & Media", seo: "SEO Reports", razorpay: "Payment Settings" };
  document.getElementById("adminPageTitle").textContent = titles[tab] || "Control Center";
  refreshIcons();
}

function adminSelectTab(tab) {
  const btn = document.querySelector(`.admin-nav button[data-admin-tab="${tab}"]`);
  if (btn) adminTab(tab, btn);
}

function escapeAttr(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function readImage(fileInput, callback) {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

async function adminLogin(event) {
  event.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (!supabaseClient) {
    showToast("Live database connection is required for admin login");
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    showToast("Invalid admin login");
    return;
  }
  const { data: profile, error: profileError } = await supabaseClient.from("admin_profiles").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!profileError && profile) {
    state.admin = { email, name: "EE Desi Delights Admin", cloud: true, loginAt: new Date().toISOString() };
    save();
    await loadCloudStore();
    await loadCloudOrders();
    showToast("Admin login successful");
    if (location.hash === "#admin") {
      renderAdmin();
      refreshIcons();
      initReveals();
    } else {
      location.hash = "#admin";
    }
    return;
  }
  await supabaseClient.auth.signOut();
  showToast("This Supabase user is not marked as admin");
}

async function adminLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  state.admin = null;
  save();
  showToast("Admin logged out");
  if (location.hash === "#admin-login") {
    renderAdminLogin();
    refreshIcons();
  } else {
    location.hash = "#admin-login";
  }
}

async function addAdminProduct() {
  const id = `ghee-${Date.now()}`;
  const newProduct = {
    id,
    name: "New Ghee Product",
    type: "Premium Ghee",
    price: 499,
    old: 599,
    size: "500 ml",
    sizeOptions: [
      { label: "500 ml", price: 499 },
      { label: "1 Litre", price: 949 }
    ],
    badge: "New",
    img: "assets/cow-ghee-ee.png",
    rating: 4.8,
    reviews: 0,
    desc: "Write product description from admin panel."
  };
  products.unshift(newProduct);
  save();
  await saveCloudProduct(newProduct);
  document.getElementById("adminContent").innerHTML = adminProducts();
  refreshIcons();
}

function addAdminSizeRow(id) {
  const list = document.getElementById(`p-size-list-${id}`);
  if (!list) return;
  const existingRows = list.querySelectorAll(".admin-size-row").length;
  list.insertAdjacentHTML("beforeend", adminSizeRowHtml(id, { label: "", price: "" }, Date.now(), existingRows === 0));
  refreshIcons();
}

function removeAdminSizeRow(button) {
  const row = button.closest(".admin-size-row");
  const list = button.closest(".admin-size-list");
  if (!row || !list) return;
  if (list.querySelectorAll(".admin-size-row").length <= 1) {
    showToast("Keep at least one size and price");
    return;
  }
  const wasDefault = row.querySelector(".admin-size-default")?.checked;
  row.remove();
  if (wasDefault) {
    const nextDefault = list.querySelector(".admin-size-default");
    if (nextDefault) nextDefault.checked = true;
  }
}

function collectAdminSizeOptions(id) {
  const product = products.find(p => p.id === id);
  const list = document.getElementById(`p-size-list-${id}`);
  const rows = [...(list?.querySelectorAll(".admin-size-row") || [])];
  const options = [];
  let defaultIndex = -1;
  rows.forEach(row => {
    const label = row.querySelector(".admin-size-label")?.value.trim();
    const price = Number(row.querySelector(".admin-size-price")?.value || 0);
    if (!label || price <= 0) return;
    if (row.querySelector(".admin-size-default")?.checked) defaultIndex = options.length;
    options.push({ label, price });
  });
  if (!options.length) {
    showToast("Please add at least one valid size and price");
    return null;
  }
  if (defaultIndex < 0) defaultIndex = Math.max(0, options.findIndex(option => option.label === product?.size));
  return { options, defaultOption: options[defaultIndex] || options[0] };
}

async function savePricingSettings() {
  state.settings.shippingCharge = Number(document.getElementById("set-shippingCharge")?.value || 0);
  state.settings.packagingCharge = Number(document.getElementById("set-packagingCharge")?.value || 0);
  state.settings.couponCode = (document.getElementById("set-couponCode")?.value || "").trim().toUpperCase();
  state.settings.couponDiscount = Math.max(0, Math.min(100, Number(document.getElementById("set-couponDiscount")?.value || 0)));
  if (state.checkout.coupon && state.checkout.coupon !== state.settings.couponCode) delete state.checkout.coupon;
  save();
  await saveCloudSettings(["shippingCharge", "packagingCharge", "couponCode", "couponDiscount"]);
  showToast(cloudReady ? "Cart pricing saved to database" : "Cart pricing saved locally");
}

async function saveAdminProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const sizeData = collectAdminSizeOptions(id);
  if (!sizeData) return;
  product.name = document.getElementById(`p-name-${id}`).value;
  product.desc = document.getElementById(`p-desc-${id}`).value;
  product.type = document.getElementById(`p-type-${id}`).value;
  product.badge = document.getElementById(`p-badge-${id}`).value;
  product.sizeOptions = sizeData.options;
  product.size = sizeData.defaultOption.label;
  product.price = sizeData.defaultOption.price;
  product.old = Number(document.getElementById(`p-old-${id}`).value || product.price);
  save();
  await saveCloudProduct(product);
  document.getElementById("adminContent").innerHTML = adminProducts();
  refreshIcons();
  showToast(cloudReady ? "Product saved to database" : "Product saved locally");
}

function adminUploadProductImage(id, input) {
  readImage(input, async dataUrl => {
    const product = products.find(p => p.id === id);
    if (product) product.img = dataUrl;
    save();
    if (product) await saveCloudProduct(product);
    document.getElementById("adminContent").innerHTML = adminProducts();
    refreshIcons();
    showToast(cloudReady ? "Product image saved to database" : "Product image saved locally");
  });
}

async function deleteAdminProduct(id) {
  if (!confirm("Delete this product from the demo store?")) return;
  products = products.filter(p => p.id !== id);
  save();
  await deleteCloudProduct(id);
  document.getElementById("adminContent").innerHTML = adminProducts();
  refreshIcons();
}

async function updateOrderStatus(id, status) {
  const order = state.orders.find(o => o.id === id);
  if (order) order.status = status;
  save();
  await updateCloudOrderStatus(id, status);
  showToast(cloudReady ? "Order status updated in database" : "Order status updated locally");
}

function adminUploadSettingImage(key, input) {
  readImage(input, async dataUrl => {
    state.settings[key] = dataUrl;
    const field = document.getElementById(`set-${key}`);
    if (field) field.value = dataUrl;
    save();
    await saveCloudSettings([key]);
    showToast(cloudReady ? "Image setting saved to database" : "Image setting saved locally");
  });
}

function adminUploadHero(index, input) {
  readImage(input, async dataUrl => {
    heroSlides[index].image = dataUrl;
    save();
    await saveCloudHeroSlide(index);
    document.getElementById("adminContent").innerHTML = adminMedia();
    refreshIcons();
    showToast(cloudReady ? "Hero image saved to database" : "Hero image saved locally");
  });
}

async function saveHeroSlide(index) {
  heroSlides[index].eyebrow = document.getElementById(`h-eyebrow-${index}`).value;
  heroSlides[index].title = document.getElementById(`h-title-${index}`).value;
  heroSlides[index].copy = document.getElementById(`h-copy-${index}`).value;
  heroSlides[index].link = document.getElementById(`h-link-${index}`).value;
  heroSlides[index].cta = document.getElementById(`h-cta-${index}`).value;
  save();
  await saveCloudHeroSlide(index);
  showToast(cloudReady ? "Hero slide saved to database" : "Hero slide saved locally");
}

async function saveSiteSettings() {
  ["headerLogo", "footerLogo", "brandName", "supportPhone", "supportEmail", "address"].forEach(key => {
    const field = document.getElementById(`set-${key}`);
    if (field) state.settings[key] = field.value;
  });
  save();
  await saveCloudSettings(["headerLogo", "footerLogo", "brandName", "supportPhone", "supportEmail", "address"]);
  showToast(cloudReady ? "Site settings saved to database" : "Site settings saved locally");
}

async function saveRazorpaySettings() {
  state.settings.razorpayEnabled = document.getElementById("set-razorpayEnabled").value === "true";
  state.settings.razorpayKey = document.getElementById("set-razorpayKey").value;
  state.settings.razorpayMerchant = document.getElementById("set-razorpayMerchant").value;
  state.settings.razorpayCurrency = document.getElementById("set-razorpayCurrency").value || "INR";
  save();
  await saveCloudSettings(["razorpayEnabled", "razorpayKey", "razorpayMerchant", "razorpayCurrency"]);
  showToast(cloudReady ? "Razorpay settings saved to database" : "Razorpay settings saved locally");
}

function testRazorpaySettings() {
  if (!state.settings.razorpayEnabled || typeof Razorpay === "undefined") {
    showToast("Razorpay disabled or script unavailable");
    return;
  }
  new Razorpay({
    key: state.settings.razorpayKey,
    amount: 100,
    currency: state.settings.razorpayCurrency,
    name: state.settings.razorpayMerchant,
    description: "Admin test payment popup",
    handler: () => showToast("Razorpay test callback received"),
    theme: { color: "#0F3D2E" }
  }).open();
}

function dashboardOverview() {
  return `<div class="dashboard-cards">
    <div class="dashboard-card">${icon("shopping-bag")}<h3>${state.orders.length}</h3><p>Total Orders</p></div>
    <div class="dashboard-card">${icon("heart")}<h3>${state.cart.length}</h3><p>Cart Items</p></div>
    <div class="dashboard-card">${icon("map-pin")}<h3>${state.checkout.city || "Hyderabad"}</h3><p>Delivery City</p></div>
  </div><div class="checkout-box"><h3>Recent Orders</h3>${ordersHtml()}</div>`;
}

function ordersHtml() {
  if (!state.orders.length) return `<p>No orders yet. Place a demo order from checkout.</p><a class="btn primary" href="#shop">Shop Ghee</a>`;
  return state.orders.map(o => `<div class="order-row"><div><b>${o.id}</b><p>${o.items.length} items &bull; ${o.date}</p></div><div><span class="status">${o.status}</span><h3>${money(o.total)}</h3></div></div>`).join("");
}

function dashboardProfile() {
  return `<div class="checkout-box"><h3>Profile</h3><p><b>Name:</b> ${state.user.name}</p><p><b>Email:</b> ${state.user.email}</p><p><b>Saved Address:</b> ${state.checkout.address || "No saved address yet"}</p><button class="btn gold" onclick="showToast('Profile saved in demo mode')">Save Profile</button></div>`;
}

function dashTab(tab, btn) {
  document.querySelectorAll(".dashboard-nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("dashContent").innerHTML = tab === "orders" ? `<div class="checkout-box"><h3>My Orders</h3>${ordersHtml()}</div>` : tab === "profile" ? dashboardProfile() : dashboardOverview();
  refreshIcons();
}

function addToCart(id, qty = 1, selection = {}) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const defaultOption = defaultSizeOption(product);
  const size = selection.size || defaultOption.label;
  const unitPrice = Number(selection.unitPrice) || defaultOption.price;
  const key = `${id}::${size}`;
  const existing = state.cart.find(item => lineKey(item, product) === key);
  if (existing) existing.qty += qty;
  else state.cart.push({ id, key, size, unitPrice, qty });
  save();
  showToast("Added to cart");
}

function updateCardPurchase(purchase) {
  const qty = Math.max(1, Number(purchase.dataset.qty || 1));
  const unitPrice = Number(purchase.dataset.unitPrice || 0);
  purchase.querySelector(".card-qty span").textContent = qty;
  purchase.querySelector(".price").textContent = money(unitPrice * qty);
  purchase.querySelector(".price-quantity").textContent = `for ${qty} ${qty === 1 ? "jar" : "jars"}`;
  purchase.querySelector(".post-add-actions")?.classList.add("hidden");
  const addButton = purchase.querySelector(".card-add");
  if (addButton) addButton.innerHTML = `${icon("shopping-cart")} Add to Cart`;
  refreshIcons();
}

function changeCardSize(select) {
  const purchase = select.closest(".card-purchase");
  const selected = select.options[select.selectedIndex];
  if (!purchase || !selected) return;
  purchase.dataset.size = selected.dataset.size;
  purchase.dataset.unitPrice = selected.value;
  updateCardPurchase(purchase);
}

function changeCardQty(button, delta) {
  const purchase = button.closest(".card-purchase");
  if (!purchase) return;
  const qty = Math.max(1, Number(purchase.dataset.qty || 1) + delta);
  purchase.dataset.qty = qty;
  updateCardPurchase(purchase);
}

function addCardSelection(button, id) {
  const purchase = button.closest(".card-purchase");
  const product = products.find(p => p.id === id);
  if (!purchase || !product) return;
  const defaultOption = defaultSizeOption(product);
  const qty = Math.max(1, Number(purchase.dataset.qty || 1));
  const size = purchase.dataset.size || defaultOption.label;
  const unitPrice = Number(purchase.dataset.unitPrice) || defaultOption.price;
  addToCart(id, qty, { size, unitPrice });
  button.innerHTML = `${icon("check")} Added ${qty}`;
  const actions = purchase.querySelector(".post-add-actions");
  const whatsapp = actions?.querySelector(".product-whatsapp");
  if (whatsapp) whatsapp.href = productWhatsAppLink(product, qty, size, unitPrice);
  actions?.classList.remove("hidden");
  refreshIcons();
}

function detailSelection() {
  const priceNode = document.getElementById("detailPrice");
  return {
    size: document.querySelector(".size-btn.active")?.dataset.size || "500 ml",
    unitPrice: Number(priceNode?.dataset.unitPrice || 0)
  };
}

function addDetailToCart(id) {
  addToCart(id, Number(document.getElementById("detailQty")?.textContent || 1), detailSelection());
}

function buyNow(id) {
  addDetailToCart(id);
  location.hash = "#checkout";
}

function updateQty(key, delta) {
  const item = state.cart.find(x => lineKey(x, products.find(p => p.id === x.id)) === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(x => lineKey(x, products.find(p => p.id === x.id)) !== key);
  save();
  renderCart();
}

function removeFromCart(key) {
  state.cart = state.cart.filter(x => lineKey(x, products.find(p => p.id === x.id)) !== key);
  save();
  renderCart();
}

function setMainImage(src) {
  document.getElementById("mainProductImage").src = src;
}

function selectSize(btn, price) {
  document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("detailPrice").dataset.unitPrice = price;
  updateDetailPrice();
}

function changeDetailQty(delta) {
  const node = document.getElementById("detailQty");
  node.textContent = Math.max(1, Number(node.textContent) + delta);
  updateDetailPrice();
}

function updateDetailPrice() {
  const priceNode = document.getElementById("detailPrice");
  const qty = Number(document.getElementById("detailQty")?.textContent || 1);
  const unitPrice = Number(priceNode?.dataset.unitPrice || 0);
  if (priceNode) priceNode.textContent = money(unitPrice * qty);
}

function switchTab(btn, tab) {
  document.querySelectorAll(".tab-buttons button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const copy = {
    "Description": "EE Desi Delights ghee is crafted for homes that value purity, taste, and traditional Indian cooking.",
    "Benefits": "Rich aroma, naturally grainy texture, smooth cooking performance, and a clean traditional taste.",
    "Ingredients": "Pure milk fat from quality cow or buffalo milk. No preservatives, no artificial flavors, no chemicals.",
    "How It's Made": "Curd is churned, butter is separated, and the butter is slowly simmered until golden and aromatic.",
    "Storage": "Store in a cool, dry place. Always use a clean dry spoon and keep the jar tightly closed.",
    "Shipping & Returns": "Standard delivery takes 3-5 working days. Demo return support is available within 7 days."
  };
  document.getElementById("tabText").innerHTML = `<p>${copy[tab]}</p><ul class="check-list"><li>${icon("check-circle")} 100% natural</li><li>${icon("check-circle")} Packed with care</li><li>${icon("check-circle")} Traditional taste</li></ul>`;
  refreshIcons();
}

function applyCoupon() {
  const input = document.getElementById("couponCode");
  const code = input?.value.trim().toUpperCase() || "";
  const activeCoupon = String(state.settings.couponCode || "").trim().toUpperCase();
  const discountPercent = Math.max(0, Number(state.settings.couponDiscount || 0));
  if (activeCoupon && code === activeCoupon) {
    if (location.hash === "#checkout") collectCheckout();
    state.checkout.coupon = code;
    save();
    showToast(`Coupon applied: ${discountPercent}% off`);
    refreshCouponView();
  } else {
    if (input) input.focus();
    showToast(activeCoupon ? `Invalid coupon. Try ${activeCoupon}` : "Coupon offers are currently off");
  }
}

function removeCoupon() {
  delete state.checkout.coupon;
  save();
  showToast("Coupon removed");
  refreshCouponView();
}

function refreshCouponView() {
  const scrollPosition = window.scrollY;
  if (location.hash === "#cart") renderCart();
  else renderCheckout();
  refreshIcons();
  initReveals();
  requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
}

async function useLocation() {
  if (!navigator.geolocation) { showToast("Location is not supported in this browser"); return; }
  showToast("Requesting location permission...");
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude, accuracy } = pos.coords;
    setCheckoutPin(latitude, longitude, 18, accuracy ? "Current location accuracy " + Math.round(accuracy) + "m" : "Current location");
    await reverseGeocode(latitude, longitude, true);
    showToast("Exact location pinned. You can drag the pin to adjust.");
  }, () => showToast("Location permission was not allowed"), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

function collectCheckout() {
  const ids = ["fullName", "phone", "email", "address", "landmark", "city", "pincode", "note"];
  ids.forEach(id => state.checkout[id] = document.getElementById(id)?.value || "");
  state.checkout.stateName = document.getElementById("stateName")?.value || "Telangana";
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");
  const linkInput = document.getElementById("mapLink");
  state.checkout.latitude = latInput ? latInput.value : state.checkout.latitude || "";
  state.checkout.longitude = lngInput ? lngInput.value : state.checkout.longitude || "";
  state.checkout.mapLink = linkInput ? linkInput.value : mapsLink(state.checkout.latitude, state.checkout.longitude);
  save();
}

async function createRazorpayBackendOrder(totals) {
  const response = await fetch("/api/razorpay-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cart: state.cart.map(item => ({ id: item.id, size: item.size, qty: item.qty })),
      coupon: state.checkout.coupon || "",
      currency: state.settings.razorpayCurrency || "INR",
      receipt: `EE-${Date.now()}`
    })
  });
  if (!response.ok) throw new Error((await response.json()).error || "Unable to create Razorpay order");
  return response.json();
}

async function verifyRazorpayPayment(response) {
  const verify = await fetch("/api/razorpay-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response)
  });
  if (!verify.ok) throw new Error((await verify.json()).error || "Payment verification failed");
  return verify.json();
}

async function placeOrder(e) {
  e.preventDefault();
  collectCheckout();
  if (!state.checkout.latitude || !state.checkout.longitude) {
    showToast("Please pin your exact delivery location on the map");
    document.getElementById("checkoutMap")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const totals = cartTotals();
  if (!state.settings.razorpayEnabled || typeof Razorpay === "undefined") {
    showToast("Online payment is not available right now");
    return;
  }
  let gateway;
  try {
    gateway = await createRazorpayBackendOrder(totals);
  } catch (error) {
    showToast(error.message || "Razorpay backend is not configured yet");
    return;
  }
  const options = {
    key: gateway.keyId || state.settings.razorpayKey || defaultSettings.razorpayKey,
    amount: gateway.order.amount,
    currency: state.settings.razorpayCurrency || "INR",
    name: state.settings.razorpayMerchant || state.settings.brandName || "EE Desi Delights",
    description: "EE Desi Delights order payment",
    image: "assets/logo-wide.png",
    order_id: gateway.order.id,
    handler: async response => {
      try {
        await verifyRazorpayPayment(response);
        await completeOrder("Razorpay Paid", response, gateway.totals);
      } catch (error) {
        showToast(error.message || "Payment verification failed");
      }
    },
    prefill: { name: state.checkout.fullName, email: state.checkout.email, contact: state.checkout.phone },
    theme: { color: "#0F3D2E" },
    modal: { ondismiss: () => showToast("Payment popup closed. Order not placed.") }
  };
  new Razorpay(options).open();
}

async function completeOrder(status, paymentDetails = {}, verifiedTotals = null) {
  const totals = verifiedTotals || cartTotals();
  const orderItems = Array.isArray(verifiedTotals?.lines) && verifiedTotals.lines.length
    ? verifiedTotals.lines.map(item => ({
        id: item.id,
        key: `${item.id}::${item.size}`,
        size: item.size,
        unitPrice: item.unitPrice,
        qty: item.qty
      }))
    : [...state.cart];
  if (!state.user) {
    state.user = {
      name: state.checkout.fullName || "Demo Customer",
      email: state.checkout.email || "guest@desidelights.com",
      phone: state.checkout.phone || ""
    };
  }
  upsertUser({ ...state.user, phone: state.checkout.phone || state.user.phone });
  const order = {
    id: `DD-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    items: orderItems,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    packing: totals.packing,
    discount: totals.discount,
    total: totals.total,
    payment: status,
    razorpay_order_id: paymentDetails.razorpay_order_id || null,
    razorpay_payment_id: paymentDetails.razorpay_payment_id || null,
    razorpay_signature: paymentDetails.razorpay_signature || null,
    status
  };
  await saveCloudOrder(order);
  state.orders.unshift(order);
  state.cart = [];
  save();
  showToast("Order placed successfully");
  location.hash = "#dashboard";
}

function openAuth(tab = "login") {
  document.getElementById("authDialog").showModal();
  setAuthTab(tab);
}

function setAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.authTab === tab));
  document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
  document.getElementById("signupForm").classList.toggle("hidden", tab !== "signup");
}

function logout() {
  state.user = null;
  save();
  showToast("Logged out");
  location.hash = "#home";
}

function route() {
  clearInterval(heroTimer);
  closeMobileMenu();
  const hash = location.hash.replace("#", "") || "home";
  document.body.classList.toggle("admin-shell", hash === "admin" || hash === "admin-login");
  if (hash.startsWith("product/")) renderProduct(hash.split("/")[1]);
  else if (hash === "shop" || hash === "products") renderShop();
  else if (hash === "about") renderAboutPage();
  else if (hash === "bulk") renderBulkPage();
  else if (hash === "contact") renderContactPage();
  else if (hash === "faq") renderFaqPage();
  else if (hash === "admin-login") renderAdminLogin();
  else if (hash === "admin") renderAdmin();
  else if (["shipping-policy", "returns-policy", "privacy-policy", "terms"].includes(hash)) renderPolicyPage(hash);
  else if (hash === "cart") renderCart();
  else if (hash === "checkout") renderCheckout();
  else if (hash === "dashboard") renderDashboard();
  else renderHome();
  window.scrollTo(0, 0);
  refreshIcons();
  initReveals();
}

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function initReveals() {
  document.querySelectorAll(".section, .product-card, .process-card, .review-card, .stat-card, .checkout-box, .summary-box").forEach((el, index) => {
    el.setAttribute("data-reveal", "");
    el.style.transitionDelay = `${Math.min(index % 6, 5) * 45}ms`;
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
}

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

function setMobileMenu(open) {
  mainNav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

function closeMobileMenu() {
  setMobileMenu(false);
}

menuBtn.addEventListener("click", event => {
  event.stopPropagation();
  setMobileMenu(!mainNav.classList.contains("open"));
});
mainNav.addEventListener("click", event => {
  if (event.target.closest("a")) closeMobileMenu();
});
document.addEventListener("click", event => {
  if (mainNav.classList.contains("open") && !mainNav.contains(event.target) && !menuBtn.contains(event.target)) closeMobileMenu();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 1050) closeMobileMenu();
});
document.getElementById("accountBtn").addEventListener("click", () => state.user ? location.hash = "#dashboard" : openAuth("login"));
document.getElementById("searchBtn").addEventListener("click", () => {
  const term = prompt("Search EE Desi Delights ghee products");
  if (!term) return;
  location.hash = "#shop";
  setTimeout(() => {
    const filtered = products.filter(p => `${p.name} ${p.type}`.toLowerCase().includes(term.toLowerCase()));
    const grid = document.getElementById("shopGrid");
    if (grid) grid.innerHTML = (filtered.length ? filtered : products).map(productCard).join("");
    refreshIcons();
  }, 50);
});
document.getElementById("closeAuth").addEventListener("click", () => document.getElementById("authDialog").close());
document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.addEventListener("click", () => setAuthTab(btn.dataset.authTab)));
document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  state.user = { name: "Demo Customer", email: document.getElementById("loginEmail").value };
  upsertUser(state.user);
  save();
  document.getElementById("authDialog").close();
  showToast("Login successful");
  location.hash = "#dashboard";
});
document.getElementById("signupForm").addEventListener("submit", e => {
  e.preventDefault();
  state.user = { name: document.getElementById("signupName").value, email: document.getElementById("signupEmail").value };
  upsertUser(state.user);
  save();
  document.getElementById("authDialog").close();
  showToast("Signup successful");
  location.hash = "#dashboard";
});
document.getElementById("newsletterForm").addEventListener("submit", e => {
  e.preventDefault();
  showToast("Subscribed successfully");
  e.target.reset();
});
window.addEventListener("load", () => {
  setTimeout(() => document.getElementById("preloader")?.classList.add("hide"), 450);
});
window.addEventListener("hashchange", route);

async function bootApp() {
  updateHeader();
  applySiteSettings();
  route();
  showLaunchScreen();
  await initSupabase();
  const loaded = await loadCloudStore();
  if (loaded) {
    applySiteSettings();
    route();
    showToast("Live database connected");
  }
}

bootApp();
