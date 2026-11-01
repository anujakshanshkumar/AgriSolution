const crypto = require("crypto");
const {
  getDatabase,
  getUsersCollection,
} = require("../infrastructure/user-repository");
const AppError = require("../errors/app-error");
const digest = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
let ready;
async function sessions() {
  const db = await getDatabase();
  if (!ready)
    ready = db
      .collection("sessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .catch((error) => {
        ready = null;
        throw error;
      });
  await ready;
  return db.collection("sessions");
}
async function createSession(userId) {
  const accessToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await (
    await sessions()
  ).insertOne({ _id: digest(accessToken), userId, expiresAt });
  return { accessToken, expiresAt };
}
async function requireSession(request, response, next) {
  try {
    const token = (request.headers.authorization || "").match(
      /^Bearer ([a-f0-9]{64})$/i,
    )?.[1];
    if (!token) throw new AppError(401, "Please log in again.");
    const session = await (
      await sessions()
    ).findOne({ _id: digest(token), expiresAt: { $gt: new Date() } });
    if (!session)
      throw new AppError(401, "Your session has expired. Please log in again.");
    const user = await (
      await getUsersCollection()
    ).findOne({ _id: session.userId });
    if (!user) throw new AppError(401, "Please log in again.");
    request.user = user;
    request.sessionId = session._id;
    response.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    next(error);
  }
}
const profile = (user) => ({
  userId: user._id,
  name: user.name,
  mobile: user.mobile,
  district: user.district,
});
module.exports = { createSession, requireSession, sessions, profile };
