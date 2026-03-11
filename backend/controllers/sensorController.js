const { validationResult } = require("express-validator");
const Device = require("../models/Device");
const SensorReading = require("../models/SensorReading");
const { evaluateAutomation } = require("../services/automationService");

// ============================================
// POST /api/sensor-data
// ESP32 sends sensor readings, backend returns pump command
// ============================================
const submitSensorData = async (req, res, next) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const {
            deviceId,
            soil_moisture,
            temperature,
            humidity,
            rain_status,
        } = req.body;

        // 1. Find or create device, update lastSeen ATOMICALLY
        // This is critical: prevents sensor updates from overwriting pumpStatus
        let device = await Device.findOneAndUpdate(
            { deviceId },
            { lastSeen: new Date() },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!device.location) {
            device.location = req.body.location || "Unspecified";
            await device.save();
        }

        // -------------------------------------------
        // 2. Run automation logic BEFORE storing
        // -------------------------------------------
        const { pumpCommand, automationTriggered } = await evaluateAutomation(
            { soil_moisture, temperature, humidity, rain_status },
            device
        );

        // -------------------------------------------
        // 3. Store the sensor reading
        // -------------------------------------------
        const reading = await SensorReading.create({
            deviceId: device._id,
            soil_moisture,
            temperature,
            humidity,
            rain_status,
            pump_status: pumpCommand,
            automation_triggered: automationTriggered,
        });

        console.log(
            `📊 Sensor data stored: device=${deviceId}, pump=${pumpCommand}, auto=${automationTriggered}`
        );

        // -------------------------------------------
        // 4. Return pump command to ESP32
        // -------------------------------------------
        return res.status(201).json({
            success: true,
            pump: pumpCommand,
            automation_triggered: automationTriggered,
            reading_id: reading._id,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET /api/sensor-data/latest
// Returns the latest sensor reading
// ============================================
const getLatestReading = async (req, res, next) => {
    try {
        const { deviceId } = req.query;
        let filter = {};

        if (deviceId) {
            const device = await Device.findOne({ deviceId });
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: `Device '${deviceId}' not found`,
                });
            }
            filter.deviceId = device._id;
        }

        const latest = await SensorReading.findOne(filter)
            .sort({ createdAt: -1 })
            .populate("deviceId", "deviceId location")
            .lean();

        if (!latest) {
            return res.status(404).json({
                success: false,
                message: "No sensor readings found",
            });
        }

        // Get the authoritative pump status from the Device model
        // This prevents the ESP32's stale pump_status from overriding
        // the user's manual command in the mobile app UI
        const deviceDoc = deviceId
            ? await Device.findOne({ deviceId })
            : null;

        return res.status(200).json({
            success: true,
            data: {
                ...latest,
                pump_status: deviceDoc?.pumpStatus ?? latest.pump_status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET /api/sensor-data/history
// Returns paginated historical readings
// ============================================
const getHistory = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { deviceId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        let filter = {};

        if (deviceId) {
            const device = await Device.findOne({ deviceId });
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: `Device '${deviceId}' not found`,
                });
            }
            filter.deviceId = device._id;
        }

        const [readings, total] = await Promise.all([
            SensorReading.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("deviceId", "deviceId location")
                .lean(),
            SensorReading.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: readings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitSensorData,
    getLatestReading,
    getHistory,
};
