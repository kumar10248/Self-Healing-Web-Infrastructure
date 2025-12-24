const { processMetrics } = require("../services/monitoring.service");

exports.receiveMetrics = async (req, res, next) => {
  try {
    const result = await processMetrics(req.body);
    res.json({
      success: true,
      message: "Metrics received and processed",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
