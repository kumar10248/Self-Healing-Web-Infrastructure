const { executeHealing } = require("../services/healing.service");

exports.manualHeal = async (req, res, next) => {
  try {
    const result = await executeHealing(req.body.action);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};
