import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useAppContext } from "../context/AppContext";
import { colors, spacing, borderRadius, typography, cardStyle } from "../theme/theme";

const screenWidth = Dimensions.get("window").width - 32;

const FILTERS = [
    { label: "24H", value: 48 },
    { label: "7 Days", value: 200 },
];

const HistoryScreen = () => {
    const { history, refreshHistory, loading, error } = useAppContext();
    const [activeFilter, setActiveFilter] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        refreshHistory(FILTERS[activeFilter].value);
    }, [activeFilter, refreshHistory]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshHistory(FILTERS[activeFilter].value);
        setRefreshing(false);
    }, [activeFilter, refreshHistory]);

    const handleFilterChange = (index) => {
        setActiveFilter(index);
    };

    // Prepare chart data from history
    const chartData = [...history].reverse().slice(-20);

    const moistureData = {
        labels: chartData.map((_, i) => (i % 5 === 0 ? `${i + 1}` : "")),
        datasets: [
            {
                data: chartData.length > 0 ? chartData.map((r) => r.soil_moisture || 0) : [0],
                color: (opacity = 1) => `rgba(86, 204, 242, ${opacity})`,
                strokeWidth: 2,
            },
        ],
        legend: ["Soil Moisture (%)"],
    };

    const tempData = {
        labels: chartData.map((_, i) => (i % 5 === 0 ? `${i + 1}` : "")),
        datasets: [
            {
                data: chartData.length > 0 ? chartData.map((r) => r.temperature || 0) : [0],
                color: (opacity = 1) => `rgba(255, 123, 84, ${opacity})`,
                strokeWidth: 2,
            },
        ],
        legend: ["Temperature (°C)"],
    };

    const chartConfig = {
        backgroundColor: colors.surface,
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: "#181830",
        decimalCount: 1,
        color: (opacity = 1) => `rgba(240, 240, 245, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(122, 122, 142, ${opacity})`,
        style: { borderRadius: borderRadius.lg },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
        },
        propsForBackgroundLines: {
            stroke: "rgba(255, 255, 255, 0.04)",
        },
    };

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerLabel}>Analytics</Text>
                <Text style={styles.title}>History</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Filter Tabs */}
                <View style={styles.filterRow}>
                    {FILTERS.map((filter, index) => (
                        <TouchableOpacity
                            key={filter.label}
                            style={[
                                styles.filterTab,
                                activeFilter === index && styles.activeTab,
                            ]}
                            onPress={() => handleFilterChange(index)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    activeFilter === index && styles.activeText,
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Error */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                )}

                {/* Loading */}
                {loading && !refreshing ? (
                    <View style={styles.loadingWrapper}>
                        <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                ) : chartData.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No historical data yet</Text>
                    </View>
                ) : (
                    <>
                        {/* Soil Moisture Chart */}
                        <View style={styles.chartHeader}>
                            <View style={[styles.chartDot, { backgroundColor: colors.sensorMoisture }]} />
                            <Text style={styles.chartLabel}>Soil Moisture</Text>
                        </View>
                        <View style={styles.chartCard}>
                            <LineChart
                                data={moistureData}
                                width={screenWidth - 16}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    propsForDots: {
                                        ...chartConfig.propsForDots,
                                        stroke: colors.sensorMoisture,
                                    },
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>

                        {/* Temperature Chart */}
                        <View style={styles.chartHeader}>
                            <View style={[styles.chartDot, { backgroundColor: colors.sensorTemp }]} />
                            <Text style={styles.chartLabel}>Temperature</Text>
                        </View>
                        <View style={styles.chartCard}>
                            <LineChart
                                data={tempData}
                                width={screenWidth - 16}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    propsForDots: {
                                        ...chartConfig.propsForDots,
                                        stroke: colors.sensorTemp,
                                    },
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>

                        {/* Data Count */}
                        <View style={styles.dataCountRow}>
                            <View style={styles.dataCountDot} />
                            <Text style={styles.dataCount}>
                                Showing {chartData.length} of {history.length} readings
                            </Text>
                        </View>
                    </>
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
    scrollContent: {
        padding: spacing.lg,
        paddingTop: 54,
    },
    headerLabel: {
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
        marginBottom: spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginBottom: spacing.xl,
    },
    filterRow: {
        flexDirection: "row",
        marginBottom: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: borderRadius.sm,
    },
    activeTab: {
        backgroundColor: colors.accent,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    filterText: {
        color: colors.textSecondary,
        fontWeight: "700",
        fontSize: 13,
        letterSpacing: 0.5,
    },
    activeText: {
        color: "#FFF",
    },
    errorBanner: {
        backgroundColor: "rgba(255,107,107,0.08)",
        borderColor: "rgba(255,107,107,0.18)",
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.coral,
        fontSize: 13,
        fontWeight: "500",
    },
    loadingWrapper: {
        paddingTop: 60,
        alignItems: "center",
    },
    emptyState: {
        alignItems: "center",
        paddingTop: 60,
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: "500",
    },
    chartHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    chartDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: spacing.sm,
    },
    chartLabel: {
        color: colors.textSecondary,
        ...typography.caption,
    },
    chartCard: {
        ...cardStyle,
        padding: spacing.sm,
        marginBottom: spacing.xl,
        alignItems: "center",
    },
    chart: {
        borderRadius: borderRadius.lg,
    },
    dataCountRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xxxl,
    },
    dataCountDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.textMuted,
        marginRight: spacing.sm,
    },
    dataCount: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: "500",
    },
});

export default HistoryScreen;
