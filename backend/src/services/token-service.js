const { getDatabase } = require("../infrastructure/user-repository");
const AppError = require("../errors/app-error");
function validateToken(body) {
  const { landArea, quantity, requestId } = body;
  if (
    typeof landArea !== "number" ||
    !Number.isFinite(landArea) ||
    landArea <= 0 ||
    landArea > 100000 ||
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > landArea * 2100
  ) {
    throw new AppError(
      400,
      "Enter a positive land area and quantity, up to 21 quintals (2100 kg) per acre.",
    );
  }
  if (typeof requestId !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId))
    throw new AppError(400, "A valid requestId is required.");
  return { landArea, quantity, requestId };
}
function dateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
async function issueToken(user, body) {
  const { landArea, quantity, requestId } = validateToken(body);
  const db = await getDatabase();
  const collection = db.collection("produceTokens");
  const id = `${user._id}:${requestId}`;
  const previous = await collection.findOne({ _id: id });
  if (previous) {
    if (previous.landArea !== landArea || previous.quantity !== quantity)
      throw new AppError(
        409,
        "This request was already used for a different token.",
      );
    return previous;
  }
  const date = dateKey();
  const counter = await db
    .collection("tokenCounters")
    .findOneAndUpdate(
      { _id: date },
      { $inc: { sequence: 1 } },
      { upsert: true, returnDocument: "after" },
    );
  const token = {
    _id: id,
    userId: user._id,
    number: `AG-${date.replaceAll("-", "")}-${String(counter.sequence).padStart(3, "0")}`,
    date,
    farmerName: user.name,
    address: user.district || "Address not available",
    landArea,
    quantity,
    createdAt: new Date(),
  };
  try {
    await collection.insertOne(token);
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await collection.findOne({ _id: id });
    if (existing.landArea !== landArea || existing.quantity !== quantity)
      throw new AppError(
        409,
        "This request was already used for a different token.",
      );
    return existing;
  }
  return token;
}
module.exports = { validateToken, dateKey, issueToken };
