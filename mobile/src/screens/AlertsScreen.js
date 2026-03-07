import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import AlertItem from "../components/AlertItem";
import { colors, spacing, borderRadius, typography } from "../theme/theme";

const AlertsScreen = () => {
    const { alerts, refreshAlerts, loading, error } = useAppContext();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        refreshAlerts();
    }, [refreshAlerts]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshAlerts();
        setRefreshing(false);
    }, [refreshAlerts]);

    const renderItem = ({ item }) => <AlertItem alert={item} />;

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name="checkmark-circle" size={40} color={colors.emerald} />
            </View>
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySubtitle}>
                No active alerts — everything is running smoothly
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>Notifications</Text>
                    <Text style={styles.title}>Alerts</Text>
                </View>
                {alerts.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{alerts.length}</Text>
                    </View>
                )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

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
            ) : (
                <FlatList
                    data={alerts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.accent}
                            colors={[colors.accent]}
                        />
                    }
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
        paddingTop: 54,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: spacing.lg,
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
    },
    countBadge: {
        backgroundColor: colors.coral,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.coral,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: spacing.sm,
    },
    countText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "800",
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginBottom: spacing.lg,
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
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    list: {
        paddingBottom: 30,
    },
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(0,217,166,0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: "700",
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        color: colors.textSecondary,
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
});

export default AlertsScreen;
