const express = require("express");
const router = express.Router();
const { receiveMetrics } = require("../controllers/metrics.controller");

router.post("/", receiveMetrics);

module.exports = router;
