// ============================================
// API Configuration
// ============================================

// Change this to your backend server IP/URL
// For Expo on physical device: use your PC's local IP (e.g., 192.168.x.x)
// For Expo on emulator: use localhost or 10.0.2.2 (Android emulator)
const API_BASE_URL = "http://192.168.0.104:5000";

export default {
    BASE_URL: API_BASE_URL,
    ENDPOINTS: {
        SENSOR_DATA: "/api/sensor-data",
        SENSOR_LATEST: "/api/sensor-data/latest",
        SENSOR_HISTORY: "/api/sensor-data/history",
        PUMP_MANUAL: "/api/pump/manual",
        PUMP_STATUS: "/api/pump/status",
        ALERTS: "/api/alerts",
        HEALTH: "/api/health",
    },
    // Refresh intervals (ms)
    DASHBOARD_REFRESH: 1000, // 1 second
};
