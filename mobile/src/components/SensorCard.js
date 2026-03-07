import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, cardStyle } from "../theme/theme";

const ICON_MAP = {
    soil_moisture: { name: "water", color: colors.sensorMoisture, glow: "rgba(86,204,242,0.12)" },
    temperature: { name: "thermometer", color: colors.sensorTemp, glow: "rgba(255,123,84,0.12)" },
    humidity: { name: "cloud", color: colors.sensorHumidity, glow: "rgba(107,203,119,0.12)" },
    rain_status: { name: "rainy", color: colors.sensorRain, glow: "rgba(123,104,238,0.12)" },
    ph_level: { name: "flask", color: colors.sensorPH, glow: "rgba(255,217,61,0.12)" },
    pump_status: { name: "power", color: colors.sensorPump, glow: "rgba(255,107,157,0.12)" },
};

const SensorCard = ({ label, value, unit, type }) => {
    const icon = ICON_MAP[type] || { name: "analytics", color: colors.textSecondary, glow: "rgba(255,255,255,0.05)" };
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const displayValue =
        typeof value === "boolean"
            ? value
                ? "Yes"
                : "No"
            : value !== null && value !== undefined
                ? String(value)
                : "--";

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {/* Subtle top accent line */}
            <View style={[styles.accentLine, { backgroundColor: icon.color }]} />

            <View style={[styles.iconContainer, { backgroundColor: icon.glow }]}>
                <Ionicons name={icon.name} size={26} color={icon.color} />
            </View>

            <Text style={styles.label}>{label}</Text>

            <View style={styles.valueRow}>
                <Text style={[styles.value, { color: icon.color }]}>{displayValue}</Text>
                {unit ? <Text style={styles.unit}>{unit}</Text> : null}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        ...cardStyle,
        padding: spacing.lg,
        width: "48%",
        alignItems: "center",
        overflow: "hidden",
    },
    accentLine: {
        position: "absolute",
        top: 0,
        left: spacing.xl,
        right: spacing.xl,
        height: 2,
        borderRadius: 1,
        opacity: 0.6,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
        marginTop: spacing.xs,
    },
    label: {
        color: colors.textSecondary,
        ...typography.caption,
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    valueRow: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    value: {
        ...typography.value,
    },
    unit: {
        color: colors.textSecondary,
        fontSize: 14,
        marginLeft: 3,
        fontWeight: "500",
    },
});

export default SensorCard;
