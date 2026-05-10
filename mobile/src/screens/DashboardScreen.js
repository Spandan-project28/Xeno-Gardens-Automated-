import React, { useEffect, useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Switch,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import SensorCard from "../components/SensorCard";
import PumpToggle from "../components/PumpToggle";
import config from "../config/api";
import { colors, spacing, borderRadius, typography, shadows } from "../theme/theme";

const DashboardScreen = () => {
    const { sensorData, refreshSensorData, togglePump, toggleAutoMode, error, connectionStatus } = useAppContext();
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [autoMode, setAutoMode] = useState(false); // default: MANUAL

    // Initial load + auto-refresh every 10s
    useEffect(() => {
        const loadData = async () => {
            await refreshSensorData();
            setInitialLoading(false);
        };
        loadData();

        const interval = setInterval(refreshSensorData, config.DASHBOARD_REFRESH);
        return () => clearInterval(interval);
    }, [refreshSensorData]);

    // Sync autoMode from server data
    useEffect(() => {
        if (sensorData?.autoMode !== undefined) {
            setAutoMode(sensorData.autoMode);
        }
    }, [sensorData?.autoMode]);

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshSensorData();
        setRefreshing(false);
    }, [refreshSensorData]);

    // Full-screen offline state if we have no data at all
    if (!sensorData && connectionStatus === "offline") {
        return (
            <View style={styles.loadingContainer}>
                <View style={[styles.loadingGlow, { backgroundColor: "rgba(255,107,107,0.1)" }]}>
                    <Text style={{ fontSize: 32 }}>📡</Text>
                </View>
                <Text style={styles.loadingText}>Server Unreachable</Text>
                <Text style={styles.loadingSubtext}>{error || "The Xeno Garden backend is offline"}</Text>
                <View style={styles.retryButtonContainer}>
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        style={{ marginTop: spacing.xl }}
                    >
                        <View onTouchEnd={onRefresh} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>TRY AGAIN</Text>
                        </View>
                    </RefreshControl>
                </View>
            </View>
        );
    }

    const data = sensorData;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                        colors={[colors.accent]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Xeno Garden</Text>
                        <Text style={styles.title}>Dashboard</Text>
                    </View>
                    <View style={styles.statusChip}>
                        <View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: data ? colors.online : colors.offline,
                                    shadowColor: data ? colors.online : colors.offline,
                                },
                            ]}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                { color: data ? colors.online : colors.offline },
                            ]}
                        >
                            {data ? "Live" : "Offline"}
                        </Text>
                    </View>
                </View>

                {/* Decorative divider */}
                <View style={styles.divider} />

                {/* Error Banner — only show if we're actually disconnected */}
                {error && connectionStatus === "offline" && (
                    <View style={styles.errorBanner}>
                        <View style={styles.errorIconCircle}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                        </View>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle}>Sensor Readings</Text>
                </View>

                {/* Sensor Cards Grid — 2×2 */}
                <View style={styles.grid}>
                    <View style={styles.gridRow}>
                        <SensorCard
                            label="Soil Moisture"
                            value={data?.soil_moisture != null 
                                ? (data.soil_moisture < 10 ? `0${data.soil_moisture.toFixed(1)}` : data.soil_moisture.toFixed(1))
                                : "00.0"}
                            unit="%"
                            type="soil_moisture"
                        />
                        <SensorCard
                            label="Temperature"
                            value={data?.temperature?.toFixed(1)}
                            unit="°C"
                            type="temperature"
                        />
                    </View>
                    <View style={styles.gridRow}>
                        <SensorCard
                            label="Humidity"
                            value={data?.humidity?.toFixed(1)}
                            unit="%"
                            type="humidity"
                        />
                        <SensorCard
                            label="Rain"
                            value={data?.rain_status}
                            type="rain_status"
                        />
                    </View>
                </View>

                {/* Pump Control Section */}
                <View style={[styles.sectionHeader, { justifyContent: "space-between" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[styles.sectionDot, { backgroundColor: colors.emerald }]} />
                        <Text style={styles.sectionTitle}>Pump Control</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={[
                            { marginRight: 8, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
                            { color: autoMode ? colors.emerald : colors.coral }
                        ]}>
                            {autoMode ? "AUTO" : "MANUAL"}
                        </Text>
                        <Switch
                            value={autoMode}
                            onValueChange={async (val) => {
                                setAutoMode(val); // optimistic — instant UI feedback
                                try {
                                    await toggleAutoMode(val);
                                } catch (e) {
                                    setAutoMode(!val); // revert if API fails
                                }
                            }}
                            trackColor={{ false: "rgba(255,107,107,0.4)", true: colors.emerald }}
                            thumbColor={"#fff"}
                        />
                    </View>
                </View>
                <PumpToggle
                    pumpStatus={data?.pump_status || "OFF"}
                    onToggle={togglePump}
                />

                {/* Last Updated */}
                {data?.createdAt && (
                    <View style={styles.lastUpdatedRow}>
                        <View style={styles.lastUpdatedDot} />
                        <Text style={styles.lastUpdated}>
                            Last updated: {new Date(data.createdAt).toLocaleTimeString()}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    loadingGlow: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(108,99,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    loadingText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "600",
        marginTop: spacing.sm,
    },
    loadingSubtext: {
        color: colors.textMuted,
        fontSize: 13,
        marginTop: spacing.xs,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingTop: 54,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.lg,
    },
    greeting: {
        color: colors.accent,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    title: {
        color: colors.textPrimary,
        ...typography.hero,
    },
    statusChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        marginTop: spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.sm,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginBottom: spacing.xxl,
    },
    errorBanner: {
        backgroundColor: "rgba(255,107,107,0.08)",
        borderColor: "rgba(255,107,107,0.18)",
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        flexDirection: "row",
        alignItems: "center",
    },
    errorIconCircle: {
        marginRight: spacing.sm,
    },
    errorIcon: {
        fontSize: 16,
    },
    errorText: {
        color: colors.coral,
        fontSize: 13,
        flex: 1,
        fontWeight: "500",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    sectionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent,
        marginRight: spacing.sm,
    },
    sectionTitle: {
        color: colors.textSecondary,
        ...typography.caption,
    },
    grid: {
        marginBottom: spacing.sm,
    },
    gridRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    lastUpdatedRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: spacing.lg,
        marginBottom: spacing.xxxl,
    },
    lastUpdatedDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.textMuted,
        marginRight: spacing.sm,
    },
    lastUpdated: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: "500",
    },
    retryButtonContainer: {
        marginTop: spacing.xl,
        alignItems: "center",
    },
    retryButton: {
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        ...shadows.md,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        letterSpacing: 1,
        fontSize: 12,
    },
});

export default DashboardScreen;
