const { body, query, param } = require("express-validator");

// ============================================
// Sensor Data Validation
// ============================================
const validateSensorData = [
    body("deviceId")
        .notEmpty()
        .withMessage("deviceId is required")
        .isString()
        .trim(),

    body("soil_moisture")
        .exists()
        .withMessage("soil_moisture is required")
        .isFloat({ min: 0, max: 100 })
        .withMessage("soil_moisture must be between 0 and 100"),

    body("temperature")
        .exists()
        .withMessage("temperature is required")
        .isFloat({ min: -40, max: 80 })
        .withMessage("temperature must be between -40 and 80"),

    body("humidity")
        .exists()
        .withMessage("humidity is required")
        .isFloat({ min: 0, max: 100 })
        .withMessage("humidity must be between 0 and 100"),

    body("rain_status")
        .exists()
        .withMessage("rain_status is required")
        .isBoolean()
        .withMessage("rain_status must be a boolean"),
];

// ============================================
// Pump Manual Control Validation
// ============================================
const validatePumpControl = [
    body("deviceId")
        .notEmpty()
        .withMessage("deviceId is required")
        .isString()
        .trim(),

    body("action")
        .notEmpty()
        .withMessage("action is required")
        .isIn(["ON", "OFF"])
        .withMessage("action must be ON or OFF"),
];

// ============================================
// History Query Validation
// ============================================
const validateHistoryQuery = [
    query("deviceId").optional().isString().trim(),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage("limit must be between 1 and 500"),

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("page must be at least 1"),
];

module.exports = {
    validateSensorData,
    validatePumpControl,
    validateHistoryQuery,
};
