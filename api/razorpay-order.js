function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
}

function cleanId(value) {
  return String(value || "").trim().replace(/[^\w-]/g, "").slice(0, 80);
}

function cleanSize(value) {
  return String(value || "").trim().slice(0, 60);
}

async function supabaseRest(path) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) throw new Error("Supabase server keys are not configured");

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    headers: {
      apikey: supabaseSecret,
      Authorization: `Bearer ${supabaseSecret}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Unable to read live pricing");
  return data;
}

function settingMap(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

async function calculateLiveTotals(cart = [], coupon = "") {
  const cleanCart = cart
    .map(item => ({
      id: cleanId(item.id),
      size: cleanSize(item.size),
      qty: Math.max(1, Math.min(99, Number.parseInt(item.qty || 1, 10) || 1))
    }))
    .filter(item => item.id);

  if (!cleanCart.length) throw new Error("Cart is empty");

  const ids = [...new Set(cleanCart.map(item => item.id))];
  const idFilter = `(${ids.join(",")})`;
  const [products, sizes, settingsRows] = await Promise.all([
    supabaseRest(`products?select=id,name,price,size&active=eq.true&id=in.${idFilter}`),
    supabaseRest(`product_sizes?select=product_id,label,price,is_default&product_id=in.${idFilter}`),
    supabaseRest("site_settings?select=key,value&key=in.(shippingCharge,packagingCharge,couponCode,couponDiscount)")
  ]);

  const settings = settingMap(settingsRows);
  const lines = cleanCart.map(item => {
    const product = products.find(row => row.id === item.id);
    if (!product) throw new Error("A product in the cart is no longer available");
    const productSizes = sizes.filter(row => row.product_id === item.id);
    const selectedSize =
      productSizes.find(row => row.label === item.size) ||
      productSizes.find(row => row.is_default) ||
      productSizes[0] ||
      { label: product.size || "500 ml", price: product.price };
    const unitPrice = Number(selectedSize.price || product.price || 0);
    return {
      id: item.id,
      name: product.name,
      size: selectedSize.label,
      qty: item.qty,
      unitPrice,
      lineTotal: unitPrice * item.qty
    };
  });

  const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal ? Number(settings.shippingCharge || 0) : 0;
  const packing = subtotal ? Number(settings.packagingCharge || 0) : 0;
  const activeCoupon = String(settings.couponCode || "").trim().toUpperCase();
  const requestedCoupon = String(coupon || "").trim().toUpperCase();
  const discountPercent = Math.max(0, Math.min(100, Number(settings.couponDiscount || 0)));
  const discount = activeCoupon && requestedCoupon === activeCoupon ? Math.round(subtotal * (discountPercent / 100)) : 0;

  return {
    lines,
    subtotal,
    shipping,
    packing,
    discount,
    total: subtotal + shipping + packing - discount,
    coupon: discount ? requestedCoupon : ""
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return res.status(500).json({ error: "Razorpay keys are not configured" });

    const body = parseBody(req);
    const { cart = [], coupon = "", currency = "INR", receipt } = body;
    const totals = await calculateLiveTotals(cart, coupon);
    const orderAmount = Number(totals.total || 0) * 100;
    if (!orderAmount || orderAmount < 100) return res.status(400).json({ error: "Invalid amount" });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: orderAmount,
        currency,
        receipt: receipt || `EE-${Date.now()}`,
        payment_capture: 1
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.description || "Unable to create Razorpay order" });

    return res.status(200).json({ order: data, keyId, totals });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Razorpay order failed" });
  }
};
