const AlertLog = require("../models/AlertLog");
const SensorReading = require("../models/SensorReading");

// ============================================
// Automation Thresholds (from .env)
// ============================================
const MOISTURE_LOW = Number(process.env.MOISTURE_THRESHOLD_LOW) || 30;
const MOISTURE_HIGH = Number(process.env.MOISTURE_THRESHOLD_HIGH) || 40;
const TEMP_THRESHOLD = Number(process.env.TEMPERATURE_THRESHOLD) || 30;

// How long manual overrides last (5 minutes)
const MANUAL_OVERRIDE_DURATION = 5 * 60 * 1000;

/**
 * Evaluates automation rules based on sensor data.
 * NOW: Strictly follows the manual pump status from the app.
 *
 * @param {Object} sensorData - The incoming sensor reading
 * @param {Object} device - The Device document
 * @returns {Object} { pumpCommand: "ON"|"OFF", automationTriggered: boolean }
 */
const evaluateAutomation = async (sensorData, device) => {
    // 1. Strictly follow what the user set in the app
    const pumpCommand = device.pumpStatus || "OFF";
    const automationTriggered = false;

    const { soil_moisture } = sensorData;

    // 2. Log status for debugging
    if (pumpCommand === "ON") {
        console.log(`🚰 PUMP: Running (Manual Mode)`);
    } else {
        console.log(`🚰 PUMP: Stopped (Manual Mode)`);
    }

    // 3. Still generate alerts for low moisture so the user knows to turn it on!
    await generateAlerts(soil_moisture, device._id);

    return { pumpCommand, automationTriggered };
};

/**
 * Generate alerts for low moisture
 */
const generateAlerts = async (soil_moisture, deviceObjectId) => {
    if (soil_moisture < MOISTURE_LOW) {
        try {
            await AlertLog.create({
                deviceId: deviceObjectId,
                type: "LOW_MOISTURE",
                message: `⚠️ Soil moisture critically low: ${soil_moisture}% (threshold: ${MOISTURE_LOW}%). Irrigation initiated.`,
                severity: soil_moisture < 15 ? "CRITICAL" : "HIGH",
            });

            console.log(
                `🚨 ALERT: Moisture ${soil_moisture}% < ${MOISTURE_LOW}% → LOW_MOISTURE alert created`
            );
        } catch (err) {
            console.error(`❌ Failed to create moisture alert: ${err.message}`);
        }
    }
};

module.exports = { evaluateAutomation };


