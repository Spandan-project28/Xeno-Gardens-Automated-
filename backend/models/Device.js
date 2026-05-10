const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: [true, "Device ID is required"],
            unique: true,
            trim: true,
            index: true,
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        pumpStatus: {
            type: String,
            enum: ["ON", "OFF"],
            default: "OFF",
        },
        autoMode: {
            type: Boolean,
            default: false,
        },
        manualOverrideUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
    }
);

module.exports = mongoose.model("Device", deviceSchema);
