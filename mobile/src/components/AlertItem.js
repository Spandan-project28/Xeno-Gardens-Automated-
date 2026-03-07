import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../theme/theme";

const ALERT_CONFIG = {
    PH_ALERT: {
        icon: "warning",
        color: colors.coral,
        bgColor: "rgba(255,107,107,0.08)",
        borderColor: "rgba(255,107,107,0.18)",
        accentColor: colors.coral,
    },
    LOW_MOISTURE: {
        icon: "water-outline",
        color: colors.amber,
        bgColor: "rgba(255,159,67,0.08)",
        borderColor: "rgba(255,159,67,0.18)",
        accentColor: colors.amber,
    },
    SYSTEM: {
        icon: "settings",
        color: colors.accent,
        bgColor: "rgba(108,99,255,0.08)",
        borderColor: "rgba(108,99,255,0.18)",
        accentColor: colors.accent,
    },
};

const AlertItem = ({ alert }) => {
    const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.SYSTEM;
    const timestamp = new Date(alert.createdAt).toLocaleString();

    return (
        <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.typeRow}>
                        <View style={[styles.iconCircle, { backgroundColor: config.accentColor + "18" }]}>
                            <Ionicons name={config.icon} size={16} color={config.color} />
                        </View>
                        <Text style={[styles.type, { color: config.color }]}>
                            {alert.type.replace("_", " ")}
                        </Text>
                    </View>
                    {alert.severity && (
                        <View style={[styles.severityBadge, { backgroundColor: config.accentColor + "20" }]}>
                            <Text style={[styles.severityText, { color: config.color }]}>
                                {alert.severity}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.message}>{alert.message}</Text>

                <View style={styles.footer}>
                    <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.timestamp}>{timestamp}</Text>
                    {alert.isResolved && (
                        <View style={styles.resolvedBadge}>
                            <Ionicons name="checkmark-circle" size={13} color={colors.emerald} />
                            <Text style={styles.resolvedText}>Resolved</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        flexDirection: "row",
        overflow: "hidden",
    },
    accentBar: {
        width: 3,
        borderTopLeftRadius: borderRadius.lg,
        borderBottomLeftRadius: borderRadius.lg,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    typeRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    type: {
        fontSize: 13,
        fontWeight: "700",
        marginLeft: spacing.sm,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    severityBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
    },
    severityText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    message: {
        color: colors.textPrimary,
        fontSize: 14,
        lineHeight: 21,
        marginBottom: spacing.md,
        opacity: 0.85,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
    },
    timestamp: {
        color: colors.textMuted,
        fontSize: 11,
        marginLeft: 4,
        fontWeight: "500",
    },
    resolvedBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: "auto",
        backgroundColor: "rgba(0,217,166,0.1)",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.round,
    },
    resolvedText: {
        color: colors.emerald,
        fontSize: 11,
        fontWeight: "700",
        marginLeft: 4,
    },
});

export default AlertItem;
