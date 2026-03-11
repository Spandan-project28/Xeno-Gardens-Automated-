const { validationResult } = require("express-validator");
const Device = require("../models/Device");
const SensorReading = require("../models/SensorReading");

// ============================================
// POST /api/pump/manual
// Manual override: Turn pump ON or OFF
// ============================================
const manualPumpControl = async (req, res, next) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { deviceId, action } = req.body;

        // Update pump status ATOMICALLY — prevents race condition with sensor updates
        const device = await Device.findOneAndUpdate(
            { deviceId },
            { pumpStatus: action },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: `Device '${deviceId}' not found`,
            });
        }

        // Get the latest reading to create a manual-override entry
        const latestReading = await SensorReading.findOne({ deviceId: device._id })
            .sort({ createdAt: -1 })
            .lean();

        // Create a manual override sensor reading record
        const overrideRecord = await SensorReading.create({
            deviceId: device._id,
            soil_moisture: latestReading?.soil_moisture || 0,
            temperature: latestReading?.temperature || 0,
            humidity: latestReading?.humidity || 0,
            rain_status: latestReading?.rain_status || false,
            pump_status: action,
            automation_triggered: false, // manual override
        });

        console.log(
            `🔧 MANUAL: Pump ${action} → device=${deviceId} by user override`
        );

        return res.status(200).json({
            success: true,
            message: `Pump manually turned ${action}`,
            pump: action,
            override_id: overrideRecord._id,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET /api/pump/status
// Returns current pump status for a device
// ============================================
const getPumpStatus = async (req, res, next) => {
    try {
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: "deviceId query parameter is required",
            });
        }

        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({
                success: false,
                message: `Device '${deviceId}' not found`,
            });
        }

        const latest = await SensorReading.findOne({ deviceId: device._id })
            .sort({ createdAt: -1 })
            .select("pump_status automation_triggered createdAt")
            .lean();

        if (!latest) {
            return res.status(200).json({
                success: true,
                data: {
                    pump_status: "OFF",
                    automation_triggered: false,
                    last_updated: null,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                pump_status: device.pumpStatus || "OFF",
                automation_triggered: latest.automation_triggered,
                last_updated: latest.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    manualPumpControl,
    getPumpStatus,
};
