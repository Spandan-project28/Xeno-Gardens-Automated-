import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions,
} from "react-native";
import { colors, spacing, borderRadius, cardStyle } from "../theme/theme";

const BUTTON_SIZE = Dimensions.get("window").width * 0.52;
const RING_SIZE = BUTTON_SIZE + 28;
const OUTER_RING_SIZE = RING_SIZE + 24;

const PumpToggle = ({ pumpStatus, onToggle }) => {
    const [toggling, setToggling] = useState(false);
    const isOn = pumpStatus === "ON";
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    // Subtle pulse animation when pump is ON
    useEffect(() => {
        if (isOn) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.03,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            );
            const glow = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 0.6,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.3,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            glow.start();
            return () => {
                pulse.stop();
                glow.stop();
            };
        } else {
            pulseAnim.setValue(1);
            glowAnim.setValue(0.3);
        }
    }, [isOn]);

    const handleToggle = async () => {
        try {
            setToggling(true);
            await onToggle(isOn ? "OFF" : "ON");
        } catch (err) {
            // Error handled by context
        } finally {
            setToggling(false);
        }
    };

    const activeColor = isOn ? colors.emerald : colors.coral;
    const ringColor = isOn ? colors.emerald : "rgba(255,107,107,0.4)";
    const outerRingColor = isOn ? "rgba(0,217,166,0.15)" : "rgba(255,107,107,0.1)";

    return (
        <View style={styles.container}>
            {/* Status label */}
            <View style={styles.statusRow}>
                <View
                    style={[
                        styles.statusDot,
                        {
                            backgroundColor: activeColor,
                            shadowColor: activeColor,
                        },
                    ]}
                />
                <Text style={[styles.statusLabel, { color: activeColor }]}>
                    {isOn ? "Pump Active" : "Pump Inactive"}
                </Text>
            </View>

            {/* Circular Button */}
            <View style={styles.buttonArea}>
                {/* Outer faint ring */}
                <Animated.View
                    style={[
                        styles.outerRing,
                        {
                            borderColor: outerRingColor,
                            opacity: glowAnim,
                        },
                    ]}
                />

                {/* Main ring */}
                <Animated.View
                    style={[
                        styles.mainRing,
                        {
                            borderColor: ringColor,
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                >
                    {/* Inner button */}
                    <TouchableOpacity
                        style={styles.innerButton}
                        onPress={handleToggle}
                        disabled={toggling}
                        activeOpacity={0.7}
                    >
                        {toggling ? (
                            <ActivityIndicator color={activeColor} size="large" />
                        ) : (
                            <>
                                <Text style={[styles.buttonLabel, { color: activeColor }]}>
                                    PUMP
                                </Text>
                                <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                                    {isOn ? "OFF" : "ON"}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Hint text */}
            <Text style={styles.hintText}>
                {isOn ? "Tap to turn off" : "Tap to turn on"}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        alignItems: "center",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xxl,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.sm,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    buttonArea: {
        width: OUTER_RING_SIZE,
        height: OUTER_RING_SIZE,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xl,
    },
    outerRing: {
        position: "absolute",
        width: OUTER_RING_SIZE,
        height: OUTER_RING_SIZE,
        borderRadius: OUTER_RING_SIZE / 2,
        borderWidth: 1.5,
    },
    mainRing: {
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        borderWidth: 2.5,
        alignItems: "center",
        justifyContent: "center",
    },
    innerButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 3,
        marginBottom: 2,
    },
    buttonText: {
        fontSize: 38,
        fontWeight: "800",
        letterSpacing: -1,
    },
    hintText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: "500",
    },
});

export default PumpToggle;
