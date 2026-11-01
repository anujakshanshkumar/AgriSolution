const router = require("express").Router();
const wrap = require("../middleware/async-handler");
const {
  requireSession,
  sessions,
  profile,
} = require("../services/session-service");
const {
  getDatabase,
  getUsersCollection,
} = require("../infrastructure/user-repository");
const {
  hashPassword,
  verifyPassword,
  validatePassword,
} = require("../services/auth-service");
const { issueToken, dateKey } = require("../services/token-service");
const AppError = require("../errors/app-error");
router.get(
  "/content",
  wrap(async (req, res) =>
    res.json(await require("../services/content-service").getContent()),
  ),
);
router.get(
  "/district-map",
  wrap(async (req, res) =>
    res.json(await require("../services/content-service").getDistrictMap()),
  ),
);
router.get("/me", requireSession, (req, res) => res.json(profile(req.user)));
router.post(
  "/logout",
  requireSession,
  wrap(async (req, res) => {
    await (await sessions()).deleteOne({ _id: req.sessionId });
    res.json({ success: true });
  }),
);
router.post(
  "/password",
  requireSession,
  require("../middleware/auth-rate-limit"),
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    validatePassword(currentPassword);
    validatePassword(newPassword);
    if (!(await verifyPassword(currentPassword, req.user.passwordHash)))
      throw new AppError(401, "Current password is incorrect.");
    await (
      await getUsersCollection()
    ).updateOne(
      { _id: req.user._id },
      { $set: { passwordHash: await hashPassword(newPassword) } },
    );
    await (await sessions()).deleteMany({ userId: req.user._id });
    res.json({
      success: true,
      message: "Password changed. Please log in again on all devices.",
    });
  }),
);
router.get(
  "/tokens",
  requireSession,
  wrap(async (req, res) => {
    const db = await getDatabase();
    const tokens = await db
      .collection("produceTokens")
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    const today = await db
      .collection("tokenCounters")
      .findOne({ _id: dateKey() });
    res.json({ tokens, issuedCount: today?.sequence || 0, maxKgPerAcre: 2100 });
  }),
);
router.post(
  "/tokens",
  requireSession,
  wrap(async (req, res) =>
    res.status(201).json(await issueToken(req.user, req.body || {})),
  ),
);
module.exports = router;
