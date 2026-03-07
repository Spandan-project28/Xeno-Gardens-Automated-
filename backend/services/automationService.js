const AlertLog = require("../models/AlertLog");

// ============================================
// Automation Thresholds (from .env)
// ============================================
const MOISTURE_LOW = Number(process.env.MOISTURE_THRESHOLD_LOW) || 30;
const MOISTURE_HIGH = Number(process.env.MOISTURE_THRESHOLD_HIGH) || 40;
const TEMP_THRESHOLD = Number(process.env.TEMPERATURE_THRESHOLD) || 30;

/**
 * Evaluates automation rules based on sensor data.
 *
 * RULE 1 — PUMP ON:
 *   moisture < 30 AND temperature > 30 AND rain_status == false
 *
 * RULE 2 — PUMP OFF:
 *   moisture >= 40
 *
 * RULE 3 — LOW MOISTURE ALERT:
 *   moisture < 30 → generate LOW_MOISTURE alert
 *
 * @param {Object} sensorData - The incoming sensor reading
 * @param {String} deviceObjectId - The MongoDB ObjectId of the device
 * @returns {Object} { pumpCommand: "ON"|"OFF", automationTriggered: boolean }
 */
const evaluateAutomation = async (sensorData, deviceObjectId) => {
    let pumpCommand = "OFF";
    let automationTriggered = false;

    const { soil_moisture, temperature, rain_status } = sensorData;

    // ------------------------------------------
    // RULE 1: Turn pump ON
    // ------------------------------------------
    if (
        soil_moisture < MOISTURE_LOW &&
        temperature > TEMP_THRESHOLD &&
        rain_status === false
    ) {
        pumpCommand = "ON";
        automationTriggered = true;

        console.log(
            `🤖 AUTO: Pump ON → moisture=${soil_moisture}% (< ${MOISTURE_LOW}), temp=${temperature}°C (> ${TEMP_THRESHOLD}), rain=false`
        );
    }

    // ------------------------------------------
    // RULE 2: Turn pump OFF (overrides Rule 1)
    // ------------------------------------------
    if (soil_moisture >= MOISTURE_HIGH) {
        pumpCommand = "OFF";
        automationTriggered = true;

        console.log(
            `🤖 AUTO: Pump OFF → moisture=${soil_moisture}% (>= ${MOISTURE_HIGH})`
        );
    }

    // ------------------------------------------
    // RULE 3: Low Moisture Alert (independent of pump)
    // ------------------------------------------
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

    return { pumpCommand, automationTriggered };
};

module.exports = { evaluateAutomation };
