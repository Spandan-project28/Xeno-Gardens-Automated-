import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import DashboardScreen from "../screens/DashboardScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AlertsScreen from "../screens/AlertsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { colors } from "../theme/theme";

const Tab = createBottomTabNavigator();

const TABS = [
    {
        name: "Dashboard",
        component: DashboardScreen,
        icon: "grid",
        iconOutline: "grid-outline",
    },
    {
        name: "History",
        component: HistoryScreen,
        icon: "stats-chart",
        iconOutline: "stats-chart-outline",
    },
    {
        name: "Alerts",
        component: AlertsScreen,
        icon: "notifications",
        iconOutline: "notifications-outline",
    },
    {
        name: "Settings",
        component: SettingsScreen,
        icon: "settings",
        iconOutline: "settings-outline",
    },
];

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: "#0D0D18",
                        borderTopColor: "rgba(255, 255, 255, 0.04)",
                        borderTopWidth: 1,
                        height: 70,
                        paddingBottom: 10,
                        paddingTop: 10,
                        elevation: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                    },
                    tabBarActiveTintColor: colors.accent,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: "700",
                        letterSpacing: 0.3,
                        marginTop: 2,
                    },
                }}
            >
                {TABS.map((tab) => (
                    <Tab.Screen
                        key={tab.name}
                        name={tab.name}
                        component={tab.component}
                        options={{
                            tabBarIcon: ({ focused, color, size }) => (
                                <View
                                    style={[
                                        styles.iconWrapper,
                                        focused && styles.iconWrapperActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={focused ? tab.icon : tab.iconOutline}
                                        size={20}
                                        color={color}
                                    />
                                </View>
                            ),
                        }}
                    />
                ))}
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    iconWrapperActive: {
        backgroundColor: "rgba(108, 99, 255, 0.12)",
    },
});

export default AppNavigator;
