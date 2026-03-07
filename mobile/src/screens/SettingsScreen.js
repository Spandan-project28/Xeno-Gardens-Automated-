import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { colors, spacing, borderRadius, typography, cardStyle } from "../theme/theme";

const SettingsScreen = () => {
    const { thresholds, setThresholds, deviceId, setDeviceId } = useAppContext();

    const [localThresholds, setLocalThresholds] = useState({
        moistureLow: String(thresholds.moistureLow),
        moistureHigh: String(thresholds.moistureHigh),
        temperatureHigh: String(thresholds.temperatureHigh),
    });
    const [localDeviceId, setLocalDeviceId] = useState(deviceId);

    const handleSave = () => {
        const parsed = {
            moistureLow: parseFloat(localThresholds.moistureLow),
            moistureHigh: parseFloat(localThresholds.moistureHigh),
            temperatureHigh: parseFloat(localThresholds.temperatureHigh),
        };

        // Validate
        for (const [key, value] of Object.entries(parsed)) {
            if (isNaN(value) || value < 0) {
                Alert.alert("Invalid Input", `Please enter a valid value for ${key}`);
                return;
            }
        }

        if (parsed.moistureLow >= parsed.moistureHigh) {
            Alert.alert(
                "Invalid Range",
                "Moisture Low must be less than Moisture High"
            );
            return;
        }

        setThresholds(parsed);
        setDeviceId(localDeviceId.trim());

        Alert.alert("✅ Settings Saved", "Thresholds have been updated successfully.", [
            { text: "OK" },
        ]);
    };

    const renderInput = (label, value, key, icon, unit) => (
        <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
                <View style={styles.labelIconCircle}>
                    <Ionicons name={icon} size={14} color={colors.accent} />
                </View>
                <Text style={styles.label}>{label}</Text>
                {unit && <Text style={styles.unit}>({unit})</Text>}
            </View>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={(text) =>
                    setLocalThresholds((prev) => ({ ...prev, [key]: text }))
                }
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                placeholder="Enter value"
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <Text style={styles.headerLabel}>Configuration</Text>
                <Text style={styles.title}>Settings</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Device Config */}
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: colors.accent }]} />
                    <Text style={styles.sectionTitle}>Device</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <View style={styles.labelIconCircle}>
                                <Ionicons name="hardware-chip" size={14} color={colors.accent} />
                            </View>
                            <Text style={styles.label}>Device ID</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={localDeviceId}
                            onChangeText={setLocalDeviceId}
                            placeholderTextColor={colors.textMuted}
                            placeholder="e.g., esp32-field-01"
                        />
                    </View>
                </View>

                {/* Threshold Config */}
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: colors.emerald }]} />
                    <Text style={styles.sectionTitle}>Automation Thresholds</Text>
                </View>
                <View style={styles.card}>
                    {renderInput(
                        "Moisture Low (Pump ON)",
                        localThresholds.moistureLow,
                        "moistureLow",
                        "water",
                        "%"
                    )}
                    {renderInput(
                        "Moisture High (Pump OFF)",
                        localThresholds.moistureHigh,
                        "moistureHigh",
                        "water",
                        "%"
                    )}
                    {renderInput(
                        "Temperature High",
                        localThresholds.temperatureHigh,
                        "temperatureHigh",
                        "thermometer",
                        "°C"
                    )}
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <View style={styles.infoIconCircle}>
                        <Ionicons name="information-circle" size={16} color={colors.accent} />
                    </View>
                    <Text style={styles.infoText}>
                        Pump turns ON when moisture {"<"} low threshold AND temp {">"} high
                        threshold AND no rain. Pump turns OFF when moisture {"≥"} high
                        threshold.
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.saveText}>Save Settings</Text>
                </TouchableOpacity>

                {/* Bottom spacer */}
                <View style={{ height: spacing.xxxl }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
        marginBottom: spacing.xxl,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    sectionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: spacing.sm,
    },
    sectionTitle: {
        color: colors.textSecondary,
        ...typography.caption,
    },
    card: {
        ...cardStyle,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    labelIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "rgba(108,99,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    label: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "600",
        marginLeft: spacing.sm,
        opacity: 0.85,
    },
    unit: {
        color: colors.textSecondary,
        fontSize: 12,
        marginLeft: spacing.xs,
    },
    input: {
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "500",
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "rgba(108,99,255,0.06)",
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        alignItems: "flex-start",
        borderWidth: 1,
        borderColor: "rgba(108,99,255,0.1)",
    },
    infoIconCircle: {
        marginTop: 2,
    },
    infoText: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        marginLeft: spacing.md,
        flex: 1,
    },
    saveButton: {
        backgroundColor: colors.emerald,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        shadowColor: colors.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    saveText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: spacing.sm,
        letterSpacing: 0.3,
    },
});

export default SettingsScreen;
