import axios from "axios";
import config from "../config/api";

// ============================================
// Axios Instance
// ============================================
const api = axios.create({
    baseURL: config.BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ============================================
// Sensor Data APIs
// ============================================
export const getLatestSensorData = async (deviceId) => {
    try {
        const params = deviceId ? { deviceId } : {};
        const response = await api.get(config.ENDPOINTS.SENSOR_LATEST, { params });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getSensorHistory = async (deviceId, limit = 50, page = 1) => {
    try {
        const params = { limit, page };
        if (deviceId) params.deviceId = deviceId;
        const response = await api.get(config.ENDPOINTS.SENSOR_HISTORY, { params });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

// ============================================
// Pump APIs
// ============================================
export const manualPumpControl = async (deviceId, action) => {
    try {
        const response = await api.post(config.ENDPOINTS.PUMP_MANUAL, {
            deviceId,
            action,
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

export const getPumpStatus = async (deviceId) => {
    try {
        const response = await api.get(config.ENDPOINTS.PUMP_STATUS, {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

export const toggleAutoMode = async (deviceId, autoMode) => {
    try {
        const response = await api.post(config.ENDPOINTS.PUMP_AUTO, {
            deviceId,
            autoMode,
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

// ============================================
// Alert APIs
// ============================================
export const getAlerts = async (page = 1, limit = 50) => {
    try {
        const response = await api.get(config.ENDPOINTS.ALERTS, {
            params: { page, limit },
        });
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

// ============================================
// Health Check
// ============================================
export const checkHealth = async () => {
    try {
        const response = await api.get(config.ENDPOINTS.HEALTH);
        return response.data;
    } catch (error) {
        throw handleError(error);
    }
};

// ============================================
// Error Handler
// ============================================
const handleError = (error) => {
    if (error.response) {
        return {
            message: error.response.data?.error || "Server error",
            status: error.response.status,
        };
    } else if (error.request) {
        return {
            message: "Cannot reach server. Check your network connection.",
            status: 0,
        };
    } else {
        return {
            message: error.message || "Unknown error",
            status: -1,
        };
    }
};

export default api;
