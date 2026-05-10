import React, { createContext, useContext, useState, useCallback } from "react";
import {
    getLatestSensorData,
    getSensorHistory,
    getAlerts as fetchAlerts,
    manualPumpControl,
    toggleAutoMode as apiToggleAutoMode,
} from "../services/apiService";

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within AppProvider");
    }
    return context;
};

export const AppProvider = ({ children }) => {
    // ---- State ----
    const [sensorData, setSensorData] = useState({
        soil_moisture: 0.0,
        temperature: 0.0,
        humidity: 0.0,
        rain_status: false,
        pump_status: "OFF",
    });
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deviceId, setDeviceId] = useState("esp32-field-01");
    const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting, online, offline

    // ---- Thresholds (configurable from Settings) ----
    const [thresholds, setThresholds] = useState({
        moistureLow: 30,
        moistureHigh: 40,
        temperatureHigh: 30,
    });

    // ---- Fetch Latest Sensor Data ----
    const refreshSensorData = useCallback(async () => {
        try {
            const result = await getLatestSensorData(deviceId);
            if (result.success) {
                setSensorData(result.data);
                setConnectionStatus("online");
                setError(null);
            }
        } catch (err) {
            setConnectionStatus("offline");
            setError(err.message || "Failed to fetch sensor data");
        }
    }, [deviceId]);

    // ---- Fetch History ----
    const refreshHistory = useCallback(
        async (limit = 50) => {
            try {
                setLoading(true);
                setError(null);
                const result = await getSensorHistory(deviceId, limit);
                if (result.success) {
                    setHistory(result.data);
                }
            } catch (err) {
                setError(err.message || "Failed to fetch history");
            } finally {
                setLoading(false);
            }
        },
        [deviceId]
    );

    // ---- Fetch Alerts ----
    const refreshAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchAlerts();
            if (result.success) {
                setAlerts(result.data);
            }
        } catch (err) {
            setError(err.message || "Failed to fetch alerts");
        } finally {
            setLoading(false);
        }
    }, []);

    // ---- Toggle Pump ----
    const togglePump = useCallback(
        async (action) => {
            try {
                setError(null);
                const result = await manualPumpControl(deviceId, action);
                if (result.success) {
                    // Refresh sensor data to get updated pump status
                    await refreshSensorData();
                }
                return result;
            } catch (err) {
                setError(err.message || "Failed to control pump");
                throw err;
            }
        },
        [deviceId, refreshSensorData]
    );

    // ---- Toggle Auto Mode ----
    const toggleAutoModeContext = useCallback(
        async (autoMode) => {
            try {
                setError(null);
                const result = await apiToggleAutoMode(deviceId, autoMode);
                if (result.success) {
                    await refreshSensorData();
                }
                return result;
            } catch (err) {
                setError(err.message || "Failed to toggle auto mode");
                throw err;
            }
        },
        [deviceId, refreshSensorData]
    );

    const value = {
        sensorData,
        history,
        alerts,
        loading,
        error,
        deviceId,
        thresholds,
        connectionStatus,
        setDeviceId,
        setThresholds,
        setError,
        setConnectionStatus,
        refreshSensorData,
        refreshHistory,
        refreshAlerts,
        togglePump,
        toggleAutoMode: toggleAutoModeContext,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
