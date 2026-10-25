import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import useAuthStore from '../hooks/useAuthStore';
import { colors } from '../utils/theme';

// Screens
import LoginScreen           from '../screens/LoginScreen';
import RegisterScreen        from '../screens/RegisterScreen';
import HomeScreen            from '../screens/HomeScreen';
import SubmitComplaintScreen from '../screens/SubmitComplaintScreen';
import TrackScreen           from '../screens/TrackScreen';
import AdminScreen           from '../screens/AdminScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import ScamSearchScreen      from '../screens/ScamSearchScreen';
import ForensicScannerScreen from '../screens/ForensicScannerScreen';
import ThreatRadarScreen     from '../screens/ThreatRadarScreen';
import GlobalChatScreen      from '../screens/GlobalChatScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: '#070C18' },
};

function UserTabs() {
  const { isAdmin, isOfficer } = useAuthStore();
  const showAdminTab = isAdmin?.() || isOfficer?.();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#5A6E8C',
        tabBarStyle: {
          backgroundColor: 'rgba(8, 14, 28, 0.96)',
          borderTopColor: 'rgba(0, 180, 255, 0.2)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ focused, color }) => {
          let icon = '📡';
          if (route.name === 'Home') icon = '📡';
          else if (route.name === 'Submit') icon = '📝';
          else if (route.name === 'ScamSearch') icon = '🛡️';
          else if (route.name === 'Comms') icon = '💬';
          else if (route.name === 'Profile') icon = '⚙️';
          else if (route.name === 'Admin') icon = '⚡';

          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'DASHBOARD' }} />
      <Tab.Screen name="Submit" component={SubmitComplaintScreen} options={{ tabBarLabel: 'REPORT' }} />
      <Tab.Screen name="ScamSearch" component={ScamSearchScreen} options={{ tabBarLabel: 'RADAR' }} />
      <Tab.Screen name="Comms" component={GlobalChatScreen} options={{ tabBarLabel: 'COMMS' }} />
      {showAdminTab && <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarLabel: 'TRIAGE' }} />}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'SECURITY' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070C18' }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.muted, marginTop: 14, fontSize: 12, letterSpacing: 1.5, fontWeight: '800' }}>
          INITIALIZING CYBER DEFENSE PROTOCOLS...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={UserTabs} />
            <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
            <Stack.Screen name="Forensics" component={ForensicScannerScreen} />
            <Stack.Screen name="ThreatRadar" component={ThreatRadarScreen} />
            <Stack.Screen name="Track" component={TrackScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(0, 255, 209, 0.12)',
  }
});
