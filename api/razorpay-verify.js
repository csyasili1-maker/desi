const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ error: "Razorpay secret is not configured" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay verification fields" });
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(razorpay_signature);
    const verified = expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    if (!verified) return res.status(400).json({ verified: false, error: "Payment signature verification failed" });

    return res.status(200).json({ verified: true });
  } catch (error) {
    return res.status(500).json({ verified: false, error: error.message || "Payment verification failed" });
  }
};
