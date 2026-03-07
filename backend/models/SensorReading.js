const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
    {
        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: [true, "Device reference is required"],
            index: true,
        },
        soil_moisture: {
            type: Number,
            required: [true, "Soil moisture is required"],
            min: [0, "Soil moisture cannot be negative"],
            max: [100, "Soil moisture cannot exceed 100"],
        },
        temperature: {
            type: Number,
            required: [true, "Temperature is required"],
            min: [-40, "Temperature out of range"],
            max: [80, "Temperature out of range"],
        },
        humidity: {
            type: Number,
            required: [true, "Humidity is required"],
            min: [0, "Humidity cannot be negative"],
            max: [100, "Humidity cannot exceed 100"],
        },
        rain_status: {
            type: Boolean,
            required: [true, "Rain status is required"],
            default: false,
        },
        ph_level: {
            type: Number,
            min: [0, "pH level cannot be negative"],
            max: [14, "pH level cannot exceed 14"],
            default: 7.0,
        },
        pump_status: {
            type: String,
            enum: ["ON", "OFF"],
            default: "OFF",
        },
        automation_triggered: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
    }
);

// Index for efficient time-range queries
sensorReadingSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model("SensorReading", sensorReadingSchema);
