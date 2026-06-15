const money = value => `₹${value.toLocaleString("en-IN")}`;

const defaultProducts = [
  { id: "a2-cow-ghee", name: "A2 Cow Ghee", type: "Cow Ghee (A2)", price: 799, old: 899, size: "500 ml", badge: "Best Seller", img: "assets/ghee-jar.png", rating: 4.8, reviews: 256, desc: "Made from indigenous cow milk and slow-cooked using the Bilona method for aroma, nutrition, and purity." },
  { id: "buffalo-ghee", name: "Buffalo Ghee", type: "Buffalo Ghee", price: 699, old: 799, size: "500 ml", badge: "Rich Aroma", img: "assets/ghee-lineup.png", rating: 4.7, reviews: 189, desc: "Thick, creamy buffalo ghee with a deep traditional flavor for sweets, rice, and everyday cooking." },
  { id: "bilona-ghee", name: "Bilona Ghee", type: "Hand Churned", price: 999, old: 1199, size: "500 ml", badge: "Traditional", img: "assets/ghee-jar.png", rating: 4.9, reviews: 318, desc: "Curd-churned butter simmered patiently in small batches for a naturally grainy texture." },
  { id: "gir-cow-ghee", name: "Gir Cow Ghee", type: "Premium A2", price: 1199, old: 1399, size: "500 ml", badge: "Premium", img: "assets/ghee-lineup.png", rating: 4.8, reviews: 142, desc: "Premium Gir cow ghee crafted for families who want a pure, golden spoonful every day." },
  { id: "organic-ghee", name: "Organic Cow Ghee", type: "Organic Ghee", price: 899, old: 1049, size: "500 ml", badge: "Organic", img: "assets/ghee-jar.png", rating: 4.6, reviews: 111, desc: "Clean, fragrant ghee made with carefully sourced milk and no additives." },
  { id: "combo-pack", name: "Ghee Combo Pack", type: "A2 + Buffalo", price: 1549, old: 1799, size: "500 ml + 500 ml", badge: "Combo", img: "assets/ghee-lineup.png", rating: 4.9, reviews: 221, desc: "A premium tasting combo with A2 cow ghee and buffalo ghee for every kitchen need." },
  { id: "family-pack", name: "Family Ghee Pack", type: "Value Pack", price: 2799, old: 3199, size: "2 litre", badge: "Value", img: "assets/ghee-jar.png", rating: 4.7, reviews: 96, desc: "Large pack of pure ghee for families, festive cooking, and weekly meal prep." },
  { id: "pooja-ghee", name: "Pooja Ghee", type: "Lamp & Ritual", price: 349, old: 399, size: "250 ml", badge: "Sacred", img: "assets/ghee-lineup.png", rating: 4.8, reviews: 74, desc: "Clean-burning ghee prepared for daily pooja, festivals, and temple offerings." }
];

const defaultHeroSlides = [
  {
    image: "assets/hero-ghee-food.png",
    eyebrow: "Premium Indian Ghee",
    title: "Pure Ghee, Slow-Crafted for Indian Homes",
    copy: "Golden aroma, traditional taste, and everyday nourishment in every spoon of Desi Delights ghee.",
    cta: "Shop Ghee",
    link: "#shop"
  },
  {
    image: "assets/ghee-lineup.png",
    eyebrow: "Cow, Buffalo & Bilona",
    title: "A Complete Ghee Range for Every Kitchen",
    copy: "Choose A2 cow ghee, buffalo ghee, family packs, pooja ghee, and festive combos made for pure flavor.",
    cta: "View Products",
    link: "#products"
  },
  {
    image: "assets/ghee-gift-hamper.png",
    eyebrow: "Festive Bulk Orders",
    title: "Traditional Ghee Gifts with a Premium Finish",
    copy: "Create memorable wedding, corporate, and festive hampers with Desi Delights green-gold packaging.",
    cta: "Bulk Enquiry",
    link: "#bulk"
  }
];

const defaultSettings = {
  headerLogo: "assets/logo-transparent.png",
  footerLogo: "assets/logo-white.png",
  brandName: "Desi Delights",
  razorpayEnabled: true,
  razorpayKey: "rzp_test_1DP5mmOlF5G5ag",
  razorpayMerchant: "Desi Delights",
  razorpayCurrency: "INR",
  supportPhone: "+91 78930 73167",
  supportEmail: "hello@desidelights.com",
  address: "Hyderabad, Telangana, India"
};

let products = JSON.parse(localStorage.getItem("desi_products") || "null") || defaultProducts;
let heroSlides = JSON.parse(localStorage.getItem("desi_hero_slides") || "null") || defaultHeroSlides;

const sizes = [
  { label: "200 ml", price: 399 },
  { label: "500 ml", price: 799 },
  { label: "1 Litre", price: 1499 },
  { label: "2 Litre", price: 2799 },
  { label: "5 Litre", price: 6499 }
];

let state = {
  cart: JSON.parse(localStorage.getItem("desi_cart") || "[]"),
  user: JSON.parse(localStorage.getItem("desi_user") || "null"),
  users: JSON.parse(localStorage.getItem("desi_users") || "[]"),
  admin: JSON.parse(localStorage.getItem("desi_admin") || "null"),
  orders: JSON.parse(localStorage.getItem("desi_orders") || "[]"),
  checkout: JSON.parse(localStorage.getItem("desi_checkout") || "{}"),
  settings: JSON.parse(localStorage.getItem("desi_settings") || "null") || defaultSettings
};

let heroTimer = null;
let activeHero = 0;

const app = document.getElementById("app");
const toast = document.getElementById("toast");

function save() {
  localStorage.setItem("desi_cart", JSON.stringify(state.cart));
  localStorage.setItem("desi_user", JSON.stringify(state.user));
  localStorage.setItem("desi_users", JSON.stringify(state.users));
  localStorage.setItem("desi_admin", JSON.stringify(state.admin));
  localStorage.setItem("desi_orders", JSON.stringify(state.orders));
  localStorage.setItem("desi_checkout", JSON.stringify(state.checkout));
  localStorage.setItem("desi_settings", JSON.stringify(state.settings));
  localStorage.setItem("desi_products", JSON.stringify(products));
  localStorage.setItem("desi_hero_slides", JSON.stringify(heroSlides));
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
  document.title = `${state.settings.brandName || "Desi Delights"} | Pure Ghee Store`;
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

function productCard(product) {
  return `
    <article class="product-card">
      <a class="img-wrap" href="#product/${product.id}">
        <span class="tag">${product.badge}</span>
        <img src="${product.img}" alt="${product.name}" />
      </a>
      <div class="product-body">
        <div class="rating">★★★★★ <span>${product.rating} (${product.reviews})</span></div>
        <a href="#product/${product.id}" class="product-title">${product.name}</a>
        <div class="product-meta">${product.type} • ${product.size}</div>
        <div class="price-row">
          <div><span class="price">${money(product.price)}</span></div>
          <button class="mini-cart" onclick="addToCart('${product.id}')" aria-label="Add ${product.name}">${icon("shopping-cart")}</button>
        </div>
      </div>
    </article>`;
}

function renderHome() {
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
                <a class="btn gold" href="#product/a2-cow-ghee">${icon("sparkles")} View Best Seller</a>
              </div>
              <div class="trust-row">
                <div class="trust-item">${icon("leaf")}<b>100% Natural</b><span>No additives</span></div>
                <div class="trust-item">${icon("milk")}<b>A2 Cow Milk</b><span>Selected sourcing</span></div>
                <div class="trust-item">${icon("package-check")}<b>Secure Packing</b><span>Leak-safe jars</span></div>
                <div class="trust-item">${icon("truck")}<b>PAN India</b><span>3-5 day delivery</span></div>
              </div>
            </div>
            <div class="hero-card"><img src="assets/ghee-jar.png" alt="Desi Delights bottled ghee" /></div>
          </article>
        `).join("")}
        <div class="hero-float"><span>Pure<br>Tradition<br>Every Spoon</span></div>
        <div class="slider-controls">${heroSlides.map((_, index) => `<button class="slider-dot ${index === activeHero ? "active" : ""}" onclick="setHeroSlide(${index})" aria-label="Show slide ${index + 1}"></button>`).join("")}</div>
      </div>
    </section>
    <section class="marquee"><div class="marquee-track">
      <span>100% Natural Ghee</span><span>Bilona Method</span><span>No Preservatives</span><span>Hyderabad Delivery</span><span>Secure Packaging</span>
      <span>100% Natural Ghee</span><span>Bilona Method</span><span>No Preservatives</span><span>Hyderabad Delivery</span><span>Secure Packaging</span>
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
  heroTimer = setInterval(() => setHeroSlide((activeHero + 1) % heroSlides.length), 5200);
}

function pageHero(title, copy) {
  return `<section class="page-hero"><div class="section-inner"><span class="eyebrow">Desi Delights</span><h1>${title}</h1><p>${copy}</p></div></section>`;
}

function storyBand() {
  return `
    <section class="section">
      <div class="section-inner split">
        <div>
          <span class="eyebrow">Why Our Ghee Feels Different</span>
          <h2>Warm aroma, clean ingredients, and a traditional finish</h2>
          <p>Milkzen-inspired movement meets Desi Delights tradition: animated content blocks, visual storytelling, and a premium ecommerce journey built around authentic Indian ghee.</p>
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
        <div class="about-img"><img src="assets/bilona-process.png" alt="Traditional Bilona ghee making" /></div>
        <div>
          <span class="eyebrow">About Desi Delights</span>
          <h2>Ghee made the slow, traditional way</h2>
          <p>Desi Delights is built around one promise: pure tradition in every spoon. Our ghee is prepared through patient heating, careful filtering, and honest packaging so the natural golden aroma stays intact.</p>
          <ul class="check-list">
            <li>${icon("check-circle")} Bilona-inspired traditional preparation</li>
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
          ${["Pure and authentic aroma.", "Perfect grainy texture.", "Packaging was neat and safe.", "Best ghee for dal and rice."].map((r, i) => `<div class="review-card"><div class="rating">★★★★★</div><h3>${r}</h3><p>${["Priyanka R.", "Rajesh M.", "Anitha K.", "Sandeep V."][i]} • Verified Buyer</p></div>`).join("")}
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
          <p>Order Desi Delights ghee for weddings, corporate gifts, pooja needs, restaurants, sweet shops, and family functions. Demo bulk enquiry is included for the local site.</p>
          <div class="button-row"><button class="btn primary" onclick="showToast('Bulk enquiry demo submitted. We will call you shortly.')">${icon("send")} Request Quote</button><a class="btn ghost" href="#shop">Browse Packs</a></div>
        </div>
        <div class="about-img"><img src="assets/ghee-gift-hamper.png" alt="Desi Delights ghee gift hamper" /></div>
      </div>
    </section>`;
}

function faqSection() {
  const faqs = [
    ["Is Desi Delights ghee preservative-free?", "Yes. The demo content presents every ghee product as free from preservatives, artificial colors, and chemicals."],
    ["Do you deliver outside Hyderabad?", "Yes, the checkout demo supports Hyderabad and PAN India delivery."],
    ["Can I pay with Razorpay?", "Yes. This site includes a Razorpay demo flow with a local fallback success order if the test script is unavailable."],
    ["Can the address be detected automatically?", "Yes. Use the location button during checkout. Browser permission is required, and reverse geocoding is attempted for demo autofill."]
  ];
  return `<section class="section cream-band"><div class="section-inner"><span class="eyebrow">FAQ</span><h2>Ghee shopping questions</h2><div style="display:grid;gap:14px;margin-top:24px">${faqs.map(f => `<details class="faq-item"><summary><b>${f[0]}</b></summary><p>${f[1]}</p></details>`).join("")}</div></div></section>`;
}

function renderShop() {
  app.innerHTML = `
    <section class="section">
      <div class="section-inner products-head">
        <div><span class="eyebrow">Shop</span><h2>All Desi Delights Ghee</h2><p>Choose from cow ghee, buffalo ghee, Bilona ghee, family packs, and ritual ghee.</p></div>
        <select id="sortProducts"><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select>
      </div>
      <div class="section-inner products-grid" id="shopGrid">${products.map(productCard).join("")}</div>
    </section>`;
  document.getElementById("sortProducts").addEventListener("change", e => {
    const sorted = [...products].sort((a, b) => e.target.value === "low" ? a.price - b.price : e.target.value === "high" ? b.price - a.price : 0);
    document.getElementById("shopGrid").innerHTML = sorted.map(productCard).join("");
    refreshIcons();
  });
}

function renderProduct(id) {
  const product = products.find(p => p.id === id) || products[0];
  app.innerHTML = `
    <section class="product-detail">
      <div class="breadcrumb">Home › Shop › ${product.type} › ${product.size}</div>
      <div class="detail-grid">
        <div>
          <div class="gallery-main"><span class="tag">${product.badge}</span><img id="mainProductImage" src="${product.img}" alt="${product.name}" /></div>
          <div class="thumbs">
            <img src="assets/ghee-jar.png" onclick="setMainImage(this.src)" alt="Ghee jar" />
            <img src="assets/ghee-lineup.png" onclick="setMainImage(this.src)" alt="Ghee lineup" />
            <img src="assets/brand-kit.png" onclick="setMainImage(this.src)" alt="Brand packaging" />
            <img src="${product.img}" onclick="setMainImage(this.src)" alt="${product.name}" />
          </div>
        </div>
        <div class="detail-info">
          <h1>${product.name}</h1>
          <p class="detail-sub">Made with Bilona Method | 100% Pure & Natural</p>
          <div class="rating">★★★★★ ${product.rating} (${product.reviews} Reviews) | 1200+ Happy Customers</div>
          <div class="detail-price" id="detailPrice">${money(product.price)}</div>
          <small>(Inclusive of all taxes)</small>
          <p>${product.desc}</p>
          <div class="assurance">
            <div>${icon("milk")}<span>A2 cow milk quality</span></div>
            <div>${icon("leaf")}<span>100% natural</span></div>
            <div>${icon("shield-check")}<span>No preservatives</span></div>
          </div>
          <h4>Select Size</h4>
          <div class="size-grid">${sizes.map((s, i) => `<button class="size-btn ${i === 1 ? "active" : ""}" onclick="selectSize(this, ${s.price})">${s.label}<br>${money(s.price)}</button>`).join("")}</div>
          <h4>Quantity</h4>
          <div class="qty-row">
            <div class="qty-control"><button onclick="changeDetailQty(-1)">−</button><span id="detailQty">1</span><button onclick="changeDetailQty(1)">+</button></div>
            <button class="btn primary" onclick="addToCart('${product.id}', Number(document.getElementById('detailQty').textContent))">${icon("shopping-cart")} Add to Cart</button>
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
          <div class="method-card">${icon("cooking-pot")}<div><h3>Bilona Method</h3><p>The traditional process churns curd into butter and slowly cooks it to create pure, aromatic ghee.</p></div></div>
        </div>
      </div>
    </section>
    <section class="section cream-band"><div class="section-inner"><h2>You May Also Like</h2><div class="products-grid" style="margin-top:24px">${products.filter(p => p.id !== product.id).slice(0,4).map(productCard).join("")}</div></div></section>`;
}

function renderCart() {
  const items = state.cart.map(line => ({ ...line, product: products.find(p => p.id === line.id) })).filter(x => x.product);
  const totals = cartTotals();
  app.innerHTML = `
    <section class="cart-page">
      <div class="section-inner"><span class="eyebrow">Cart</span><h2>Your Ghee Cart</h2></div>
      <div class="cart-grid" style="margin-top:24px">
        <div>${items.length ? items.map(item => cartItem(item)).join("") : `<div class="checkout-box"><h3>Your cart is empty</h3><p>Add pure Desi Delights ghee to continue.</p><a class="btn primary" href="#shop">Shop Now</a></div>`}</div>
        <aside class="summary-box">${summaryHtml(totals)}<a class="btn primary" style="width:100%;margin-top:18px" href="#checkout">${icon("lock")} Checkout</a></aside>
      </div>
    </section>`;
}

function cartItem(item) {
  return `<div class="cart-item">
    <img src="${item.product.img}" alt="${item.product.name}" />
    <div><h3>${item.product.name}</h3><p>${item.product.size} • ${money(item.product.price)}</p><div class="line-actions"><div class="qty-control"><button onclick="updateQty('${item.id}', -1)">−</button><span>${item.qty}</span><button onclick="updateQty('${item.id}', 1)">+</button></div><button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button></div></div>
    <strong>${money(item.product.price * item.qty)}</strong>
  </div>`;
}

function cartTotals() {
  const subtotal = state.cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  const shipping = subtotal > 1999 || subtotal === 0 ? 0 : 80;
  const packing = subtotal ? 20 : 0;
  const discount = state.checkout.coupon === "GHEE10" ? Math.round(subtotal * .1) : 0;
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

function renderCheckout() {
  if (!state.cart.length) { location.hash = "#cart"; return; }
  const totals = cartTotals();
  const c = state.checkout;
  app.innerHTML = `
    <section class="checkout-page">
      <div class="section-inner">
        <div class="breadcrumb">Home › Cart › Checkout</div>
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
          <div style="height:22px"></div>
          <h3>Delivery Options</h3>
          <div class="delivery-options">
            <label class="option active"><span><input type="radio" name="delivery" checked /> Standard Delivery<br><small>3-5 Working Days PAN India</small></span><b>₹80</b></label>
            <label class="option"><span><input type="radio" name="delivery" /> Express Delivery<br><small>1-2 Working Days selected locations</small></span><b>₹150</b></label>
          </div>
          <div style="height:22px"></div>
          <h3>Payment Method</h3>
          <div class="payment-options">
            <label class="option active"><span><input type="radio" name="payment" value="razorpay" checked /> UPI / Google Pay / PhonePe / Paytm<br><small>Demo Razorpay checkout</small></span><b>Razorpay</b></label>
            <label class="option"><span><input type="radio" name="payment" value="card" /> Credit / Debit Card<br><small>Visa, Mastercard, RuPay and more</small></span><b>Card</b></label>
            <label class="option"><span><input type="radio" name="payment" value="cod" /> Cash On Delivery<br><small>Pay when your order is delivered</small></span><b>COD</b></label>
          </div>
          <button class="btn primary" style="width:100%;margin-top:24px" type="submit">${icon("lock")} Proceed to Payment</button>
        </form>
        <aside>
          <div class="summary-box">
            <h3>${icon("shopping-bag")} Order Summary</h3>
            ${state.cart.map(line => {
              const p = products.find(x => x.id === line.id);
              return `<div class="summary-product"><img src="${p.img}" alt="${p.name}" /><div><b>${p.name}</b><br><small>${p.size}<br>Qty: ${line.qty}</small></div><b>${money(p.price * line.qty)}</b></div>`;
            }).join("")}
            ${summaryHtml(totals)}
          </div>
          <div class="summary-box" style="margin-top:14px">
            <h3>Apply Coupon</h3>
            <div class="coupon"><input id="couponCode" placeholder="Try GHEE10" value="${state.checkout.coupon || ""}" /><button onclick="applyCoupon()" type="button">Apply</button></div>
          </div>
          <div class="summary-box" style="margin-top:14px"><h3>Why Shop With Us?</h3><p>Pure ghee, secure packaging, fast delivery, easy returns, and trusted demo checkout.</p></div>
        </aside>
      </div>
    </section>`;
  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
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
    ${pageHero("About Desi Delights", "A premium Indian ghee brand built on purity, traditional methods, and honest packaging.")}
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
    ${pageHero("Bulk Ghee Orders", "Wedding gifts, festive hampers, restaurants, pooja supplies, and corporate gifting with Desi Delights.")}
    ${bulkSection()}
    <section class="section cream-band">
      <div class="section-inner split">
        <div class="about-img"><img src="assets/ghee-gift-hamper.png" alt="Premium ghee gifting hamper" /></div>
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
          <span class="eyebrow">Reach Desi Delights</span><h2>Hyderabad based, PAN India ready</h2>
          <p><b>Phone:</b> +91 78930 73167</p>
          <p><b>Email:</b> hello@desidelights.com</p>
          <p><b>Address:</b> Hyderabad, Telangana, India</p>
          <p><b>Hours:</b> Mon - Sun, 9:00 AM - 9:00 PM</p>
          <div class="button-row"><a class="btn gold" href="https://wa.me/917893073167" target="_blank">${icon("message-circle")} WhatsApp</a><a class="btn ghost" href="#shop">Shop Now</a></div>
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
      copy: "Demo shipping rules for Desi Delights ghee orders across Hyderabad and PAN India.",
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
        "No real payment or private data is sent to a Desi Delights backend in this static demo.",
        "Razorpay is loaded only for the demo payment popup experience."
      ]
    },
    terms: {
      title: "Terms & Conditions",
      copy: "Demo ecommerce terms for using the Desi Delights local website.",
      points: [
        "Product prices, stock, delivery timelines, and offers are demo content.",
        "The Razorpay key is a test/demo integration and not a live merchant setup.",
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
        <img src="${state.settings.headerLogo || "assets/logo-transparent.png"}" alt="Desi Delights" />
        <span>Admin Control Center</span>
      </div>
      <form class="admin-login checkout-box" onsubmit="adminLogin(event)">
        <span class="eyebrow">Secure Mock Login</span>
        <h2>Admin Panel</h2>
        <p>Use demo credentials to manage products, images, orders, users, content, and Razorpay settings.</p>
        <div class="admin-demo-box">
          <b>Email:</b> admin@desidelights.com<br>
          <b>Password:</b> admin123
        </div>
        <div class="form-grid">
          <div class="field"><label>Email</label><input id="adminEmail" type="email" value="admin@desidelights.com" required /></div>
          <div class="field"><label>Password</label><input id="adminPassword" type="password" value="admin123" required /></div>
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
          <img src="${state.settings.footerLogo || "assets/logo-white.png"}" alt="Desi Delights" />
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
          <b>Demo Mode</b>
          <span>Data is saved in browser storage for presentation.</span>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar">
          <div>
            <span class="eyebrow">Desi Delights Admin</span>
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
      <div class="admin-metric">${icon("receipt")}<span>Orders</span><b>${state.orders.length}</b><small>Demo order history</small></div>
      <div class="admin-metric">${icon("indian-rupee")}<span>Revenue</span><b>${money(totals)}</b><small>Local demo sales</small></div>
    </div>
    <div class="admin-two-col">
      <section class="admin-panel">
        <div class="admin-panel-head"><div><span class="eyebrow">Quick Health</span><h3>Store Snapshot</h3></div><span class="admin-pill live">Live Demo</span></div>
        <div class="admin-health">
          <div><b>Razorpay</b><span>${state.settings.razorpayEnabled ? "Enabled" : "Disabled"}</span></div>
          <div><b>Merchant</b><span>${state.settings.razorpayMerchant}</span></div>
          <div><b>Hero Slides</b><span>${heroSlides.length} active</span></div>
          <div><b>Support</b><span>${state.settings.supportPhone}</span></div>
        </div>
      </section>
      <section class="admin-panel">
        <div class="admin-panel-head"><div><span class="eyebrow">Latest Orders</span><h3>Recent Activity</h3></div><button class="admin-mini-btn" onclick="adminSelectTab('orders')">View All</button></div>
        ${latest.length ? latest.map(order => `<div class="admin-activity"><div><b>${order.id}</b><span>${order.date} • ${order.items.length} items</span></div><strong>${money(order.total)}</strong></div>`).join("") : `<p>No orders yet. Place a demo order from checkout.</p>`}
      </section>
    </div>`;
}

function adminSeo() {
  const keywords = [
    ["pure ghee in Hyderabad", 93, "High intent local keyword"],
    ["A2 cow ghee online", 89, "Strong ecommerce search"],
    ["bilona ghee Hyderabad", 91, "Premium traditional ghee intent"],
    ["best cow ghee in Telangana", 86, "Regional discovery keyword"],
    ["organic ghee online India", 82, "National delivery keyword"],
    ["buffalo ghee near me", 78, "Local product query"]
  ];
  const checks = [
    ["Meta title", "Optimized", "Desi Delights | Pure Ghee Store"],
    ["Product content", "Strong", `${products.length} ghee products with keyword-rich descriptions`],
    ["Image alt text", "Good", "Product and brand images include readable alt text"],
    ["Local SEO", "Ready", "Hyderabad, Telangana and PAN India delivery signals included"],
    ["Mobile UX", "Passed", "Responsive layout checked with no horizontal overflow"],
    ["Conversion SEO", "Ready", "Checkout, reviews, FAQ, and policy pages available"]
  ];
  return `
    <section class="admin-panel seo-panel">
      <div class="admin-panel-head">
        <div><span class="eyebrow">Client SEO Report</span><h3>Search Visibility Score</h3><p>Demo SEO health report for Desi Delights ghee website.</p></div>
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
        <p>Add monthly blog posts for “how to identify pure ghee,” “benefits of bilona ghee,” and “best ghee for Indian cooking” to improve organic traffic further.</p>
      </div>
    </section>`;
}

function adminProducts() {
  return `
    <section class="admin-panel">
      <div class="admin-panel-head"><div><span class="eyebrow">Catalog Manager</span><h3>Product Editor</h3><p>Edit products, prices, badges, and images from one place.</p></div><button class="btn gold" onclick="addAdminProduct()">${icon("plus")} Add Product</button></div>
      <div class="admin-product-grid">
        ${products.map(product => `
          <article class="admin-product-card">
            <div class="admin-product-media">
              <img src="${product.img}" alt="${product.name}" />
              <label>${icon("upload")} Change Image<input type="file" accept="image/*" onchange="adminUploadProductImage('${product.id}', this)" /></label>
            </div>
            <div class="admin-product-form">
              <div class="admin-inline">
                <input id="p-name-${product.id}" value="${escapeAttr(product.name)}" />
                <input id="p-badge-${product.id}" value="${escapeAttr(product.badge)}" />
              </div>
              <textarea id="p-desc-${product.id}">${product.desc}</textarea>
              <div class="admin-inline">
              <input id="p-price-${product.id}" type="number" value="${product.price}" />
              <input id="p-old-${product.id}" type="number" value="${product.old || product.price}" />
              </div>
              <div class="admin-inline">
              <input id="p-type-${product.id}" value="${escapeAttr(product.type)}" />
              <input id="p-size-${product.id}" value="${escapeAttr(product.size)}" />
              </div>
            </div>
            <div class="admin-product-actions">
              <span class="admin-pill">${money(product.price)}</span>
              <button class="btn primary" onclick="saveAdminProduct('${product.id}')">${icon("save")} Save Product</button>
              <button class="btn ghost danger" onclick="deleteAdminProduct('${product.id}')">${icon("trash-2")} Delete</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>`;
}

function adminOrders() {
  return `<section class="admin-panel"><div class="admin-panel-head"><div><span class="eyebrow">Fulfilment</span><h3>Orders</h3><p>Track demo orders and update delivery status.</p></div></div>
  <div class="admin-list">${state.orders.length ? state.orders.map(order => `
    <div class="admin-list-row">
      <div><b>${order.id}</b><span>${order.date} • ${order.items.length} items</span></div>
      <span class="admin-pill live">${order.status}</span>
      <select onchange="updateOrderStatus('${order.id}', this.value)"><option>${order.status}</option><option>Processing</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select>
      <strong>${money(order.total)}</strong>
    </div>`).join("") : "<p>No demo orders yet.</p>"}</div></section>`;
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
      <div class="admin-panel-head"><div><span class="eyebrow">Payment Gateway</span><h3>Razorpay Admin Settings</h3><p>Use test keys for demo. Checkout reads these fields directly.</p></div><span class="admin-pill live">${state.settings.razorpayEnabled ? "Enabled" : "Disabled"}</span></div>
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

function adminLogin(event) {
  event.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (email === "admin@desidelights.com" && password === "admin123") {
    state.admin = { email, name: "Desi Delights Admin", loginAt: new Date().toISOString() };
    save();
    showToast("Admin login successful");
    if (location.hash === "#admin") {
      renderAdmin();
      refreshIcons();
      initReveals();
    } else {
      location.hash = "#admin";
    }
  } else showToast("Invalid admin demo login");
}

function adminLogout() {
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

function addAdminProduct() {
  const id = `ghee-${Date.now()}`;
  products.unshift({ id, name: "New Ghee Product", type: "Premium Ghee", price: 499, old: 599, size: "500 ml", badge: "New", img: "assets/ghee-jar.png", rating: 4.8, reviews: 0, desc: "Write product description from admin panel." });
  save();
  document.getElementById("adminContent").innerHTML = adminProducts();
  refreshIcons();
}

function saveAdminProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  product.name = document.getElementById(`p-name-${id}`).value;
  product.desc = document.getElementById(`p-desc-${id}`).value;
  product.price = Number(document.getElementById(`p-price-${id}`).value || 0);
  product.old = Number(document.getElementById(`p-old-${id}`).value || product.price);
  product.type = document.getElementById(`p-type-${id}`).value;
  product.size = document.getElementById(`p-size-${id}`).value;
  product.badge = document.getElementById(`p-badge-${id}`).value;
  save();
  showToast("Product saved");
}

function adminUploadProductImage(id, input) {
  readImage(input, dataUrl => {
    const product = products.find(p => p.id === id);
    if (product) product.img = dataUrl;
    save();
    document.getElementById("adminContent").innerHTML = adminProducts();
    refreshIcons();
    showToast("Product image updated");
  });
}

function deleteAdminProduct(id) {
  if (!confirm("Delete this product from the demo store?")) return;
  products = products.filter(p => p.id !== id);
  save();
  document.getElementById("adminContent").innerHTML = adminProducts();
  refreshIcons();
}

function updateOrderStatus(id, status) {
  const order = state.orders.find(o => o.id === id);
  if (order) order.status = status;
  save();
  showToast("Order status updated");
}

function adminUploadSettingImage(key, input) {
  readImage(input, dataUrl => {
    state.settings[key] = dataUrl;
    const field = document.getElementById(`set-${key}`);
    if (field) field.value = dataUrl;
    save();
    showToast("Image setting updated");
  });
}

function adminUploadHero(index, input) {
  readImage(input, dataUrl => {
    heroSlides[index].image = dataUrl;
    save();
    document.getElementById("adminContent").innerHTML = adminMedia();
    refreshIcons();
    showToast("Hero image updated");
  });
}

function saveHeroSlide(index) {
  heroSlides[index].eyebrow = document.getElementById(`h-eyebrow-${index}`).value;
  heroSlides[index].title = document.getElementById(`h-title-${index}`).value;
  heroSlides[index].copy = document.getElementById(`h-copy-${index}`).value;
  heroSlides[index].link = document.getElementById(`h-link-${index}`).value;
  heroSlides[index].cta = document.getElementById(`h-cta-${index}`).value;
  save();
  showToast("Hero slide saved");
}

function saveSiteSettings() {
  ["headerLogo", "footerLogo", "brandName", "supportPhone", "supportEmail", "address"].forEach(key => {
    const field = document.getElementById(`set-${key}`);
    if (field) state.settings[key] = field.value;
  });
  save();
  showToast("Site settings saved");
}

function saveRazorpaySettings() {
  state.settings.razorpayEnabled = document.getElementById("set-razorpayEnabled").value === "true";
  state.settings.razorpayKey = document.getElementById("set-razorpayKey").value;
  state.settings.razorpayMerchant = document.getElementById("set-razorpayMerchant").value;
  state.settings.razorpayCurrency = document.getElementById("set-razorpayCurrency").value || "INR";
  save();
  showToast("Razorpay settings saved");
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
  return state.orders.map(o => `<div class="order-row"><div><b>${o.id}</b><p>${o.items.length} items • ${o.date}</p></div><div><span class="status">${o.status}</span><h3>${money(o.total)}</h3></div></div>`).join("");
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

function addToCart(id, qty = 1) {
  const existing = state.cart.find(item => item.id === id);
  if (existing) existing.qty += qty;
  else state.cart.push({ id, qty });
  save();
  showToast("Added to cart");
}

function buyNow(id) {
  addToCart(id, Number(document.getElementById("detailQty")?.textContent || 1));
  location.hash = "#checkout";
}

function updateQty(id, delta) {
  const item = state.cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(x => x.id !== id);
  save();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(x => x.id !== id);
  save();
  renderCart();
}

function setMainImage(src) {
  document.getElementById("mainProductImage").src = src;
}

function selectSize(btn, price) {
  document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("detailPrice").textContent = money(price);
}

function changeDetailQty(delta) {
  const node = document.getElementById("detailQty");
  node.textContent = Math.max(1, Number(node.textContent) + delta);
}

function switchTab(btn, tab) {
  document.querySelectorAll(".tab-buttons button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const copy = {
    "Description": "Desi Delights ghee is crafted for homes that value purity, taste, and traditional Indian cooking.",
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
  const code = document.getElementById("couponCode").value.trim().toUpperCase();
  if (code === "GHEE10") {
    state.checkout.coupon = code;
    save();
    showToast("Coupon applied: 10% off");
    renderCheckout();
  } else showToast("Use demo coupon GHEE10");
}

async function useLocation() {
  if (!navigator.geolocation) { showToast("Location is not supported in this browser"); return; }
  showToast("Requesting location permission...");
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      const a = data.address || {};
      document.getElementById("address").value = data.display_name || `${latitude}, ${longitude}`;
      document.getElementById("city").value = a.city || a.town || a.village || "";
      document.getElementById("pincode").value = a.postcode || "";
      document.getElementById("stateName").innerHTML = `<option>${a.state || "Telangana"}</option><option>Telangana</option><option>Andhra Pradesh</option><option>Karnataka</option>`;
      showToast("Address auto-filled from your location");
    } catch {
      document.getElementById("address").value = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      showToast("GPS captured. Reverse address service unavailable.");
    }
  }, () => showToast("Location permission was not allowed"));
}

function collectCheckout() {
  const ids = ["fullName", "phone", "email", "address", "landmark", "city", "pincode", "note"];
  ids.forEach(id => state.checkout[id] = document.getElementById(id)?.value || "");
  state.checkout.stateName = document.getElementById("stateName")?.value || "Telangana";
  save();
}

function placeOrder(e) {
  e.preventDefault();
  collectCheckout();
  const totals = cartTotals();
  const payment = document.querySelector("input[name='payment']:checked")?.value || "razorpay";
  if (payment === "cod" || !state.settings.razorpayEnabled || typeof Razorpay === "undefined") {
    completeOrder(payment === "cod" ? "Cash on Delivery" : "Demo Payment");
    return;
  }
  const options = {
    key: state.settings.razorpayKey || defaultSettings.razorpayKey,
    amount: totals.total * 100,
    currency: state.settings.razorpayCurrency || "INR",
    name: state.settings.razorpayMerchant || state.settings.brandName || "Desi Delights",
    description: "Demo ghee order payment",
    image: "assets/logo-wide.png",
    handler: () => completeOrder("Razorpay Demo Paid"),
    prefill: { name: state.checkout.fullName, email: state.checkout.email, contact: state.checkout.phone },
    theme: { color: "#0F3D2E" },
    modal: { ondismiss: () => showToast("Payment popup closed. Demo order not placed.") }
  };
  new Razorpay(options).open();
}

function completeOrder(status) {
  const totals = cartTotals();
  if (!state.user) {
    state.user = {
      name: state.checkout.fullName || "Demo Customer",
      email: state.checkout.email || "guest@desidelights.com",
      phone: state.checkout.phone || ""
    };
  }
  upsertUser({ ...state.user, phone: state.checkout.phone || state.user.phone });
  state.orders.unshift({
    id: `DD-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    items: state.cart,
    total: totals.total,
    status
  });
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

document.getElementById("menuBtn").addEventListener("click", () => document.getElementById("mainNav").classList.toggle("open"));
document.getElementById("accountBtn").addEventListener("click", () => state.user ? location.hash = "#dashboard" : openAuth("login"));
document.getElementById("searchBtn").addEventListener("click", () => {
  const term = prompt("Search Desi Delights ghee products");
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
updateHeader();
applySiteSettings();
route();
