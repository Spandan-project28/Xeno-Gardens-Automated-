const express = require("express");
const router = express.Router();
const {
    manualPumpControl,
    getPumpStatus,
    toggleAutoMode,
} = require("../controllers/pumpController");
const { validatePumpControl } = require("../utils/validators");

// POST /api/pump/manual — Manual override ON/OFF
router.post("/manual", validatePumpControl, manualPumpControl);

// GET /api/pump/status — Current pump status
router.get("/status", getPumpStatus);

// POST /api/pump/auto — Toggle Auto Mode
router.post("/auto", toggleAutoMode);

module.exports = router;
