const AlertLog = require("../models/AlertLog");
const Device = require("../models/Device");

// ============================================
// Automation Thresholds
// ============================================
const MOISTURE_LOW  = Number(process.env.MOISTURE_THRESHOLD_LOW)  || 30;
const MOISTURE_HIGH = Number(process.env.MOISTURE_THRESHOLD_HIGH) || 40;

/**
 * Priority-based pump automation:
 *
 *  PRIORITY 1 — autoMode is OFF  → always respect pumpStatus as-is (manual)
 *  PRIORITY 2 — autoMode is ON + Rain detected → force pump OFF
 *  PRIORITY 3 — autoMode is ON + No rain + moisture threshold → toggle pump
 */
const evaluateAutomation = async (sensorData, device) => {
    const { soil_moisture, rain_status } = sensorData;
    let pumpCommand = device.pumpStatus || "OFF";
    let automationTriggered = false;

    // ── PRIORITY 1: MANUAL MODE ──────────────────────────
    // If autoMode is false, do NOT touch the pump at all.
    if (!device.autoMode) {
        console.log(`🔧 MANUAL MODE | Pump stays: ${pumpCommand}`);
        return { pumpCommand, automationTriggered: false };
    }

    // ── PRIORITY 2: RAIN SAFETY ───────────────────────────
    if (rain_status === true) {
        pumpCommand = "OFF";
        automationTriggered = true;
        console.log(`🌧️  AUTO: Rain detected → Pump OFF`);
    }
    // ── PRIORITY 3: MOISTURE THRESHOLDS ──────────────────
    else if (soil_moisture < MOISTURE_LOW) {
        pumpCommand = "ON";
        automationTriggered = true;
        console.log(`🌵 AUTO: Moisture ${soil_moisture}% < ${MOISTURE_LOW}% → Pump ON`);
    } else if (soil_moisture > MOISTURE_HIGH) {
        pumpCommand = "OFF";
        automationTriggered = true;
        console.log(`💧 AUTO: Moisture ${soil_moisture}% > ${MOISTURE_HIGH}% → Pump OFF`);
    } else {
        console.log(`✅ AUTO: Moisture ${soil_moisture}% normal | Keeping: ${pumpCommand}`);
    }

    // Persist the automation decision to Device document
    if (automationTriggered && pumpCommand !== device.pumpStatus) {
        await Device.findByIdAndUpdate(device._id, { pumpStatus: pumpCommand });
    }

    // Fire alert if moisture is critically low
    if (soil_moisture < MOISTURE_LOW) {
        try {
            await AlertLog.create({
                deviceId: device._id,
                type: "LOW_MOISTURE",
                message: `⚠️ Soil moisture critically low: ${soil_moisture}% (threshold: ${MOISTURE_LOW}%). Irrigation initiated.`,
                severity: soil_moisture < 15 ? "CRITICAL" : "HIGH",
            });
        } catch (err) {
            console.error(`❌ Alert creation failed: ${err.message}`);
        }
    }

    return { pumpCommand, automationTriggered };
};

module.exports = { evaluateAutomation };
