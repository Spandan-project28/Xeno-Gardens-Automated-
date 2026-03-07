/**
 * Xeno Garden — Premium Design System
 * Luxe dark theme with violet/emerald accents
 */

export const colors = {
    // Backgrounds
    background: '#0A0A12',
    backgroundAlt: '#0F0F1A',
    surface: '#141422',
    surfaceElevated: '#1C1C30',
    surfaceBorder: 'rgba(255, 255, 255, 0.06)',

    // Accent palette
    accent: '#6C63FF',          // Violet — primary accent
    accentLight: '#8B83FF',     // Lighter violet
    accentDark: '#5A52E0',      // Deeper violet
    emerald: '#00D9A6',         // Secondary — success / positive
    emeraldDark: '#00B88C',     // Deeper emerald
    coral: '#FF6B6B',           // Danger / alerts
    coralDark: '#E05555',       // Deeper coral
    gold: '#F0C850',            // Premium highlights
    amber: '#FF9F43',           // Warnings

    // Sensor-specific
    sensorMoisture: '#56CCF2',  // Cool blue
    sensorTemp: '#FF7B54',      // Warm orange
    sensorHumidity: '#6BCB77',  // Fresh green
    sensorRain: '#7B68EE',      // Medium slate blue
    sensorPH: '#FFD93D',        // Warm yellow
    sensorPump: '#FF6B9D',      // Pink-coral

    // Text
    textPrimary: '#F0F0F5',
    textSecondary: '#7A7A8E',
    textMuted: '#52526A',
    textOnAccent: '#FFFFFF',

    // Status
    online: '#00D9A6',
    offline: '#FF6B6B',

    // Utility
    overlay: 'rgba(0, 0, 0, 0.5)',
    divider: 'rgba(255, 255, 255, 0.04)',
    inputBackground: '#0D0D18',
    inputBorder: 'rgba(108, 99, 255, 0.15)',
    inputBorderFocused: 'rgba(108, 99, 255, 0.4)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 999,
};

export const typography = {
    hero: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    body: {
        fontSize: 15,
        fontWeight: '500',
    },
    caption: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 26,
        fontWeight: '800',
    },
    small: {
        fontSize: 11,
        fontWeight: '500',
    },
};

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    elevated: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    glow: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
};

// Common card style — glassmorphism effect
export const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
};

export default {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    cardStyle,
};
