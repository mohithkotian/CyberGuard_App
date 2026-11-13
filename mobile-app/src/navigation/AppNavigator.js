import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import useAuthStore from '../hooks/useAuthStore';
import { colors } from '../utils/theme';
import IconGlyph from '../components/IconGlyph';

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

const LINKING_CONFIG = {
  prefixes: ['cyberguard://', 'https://cyberguard.app', 'http://localhost:3000', 'http://127.0.0.1:3000', 'exp://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      Main: {
        screens: {
          Home: 'home',
          Submit: 'submit',
          ScamSearch: 'radar',
          Comms: 'comms',
          Admin: 'triage',
          Profile: 'profile',
        },
      },
      ComplaintDetail: 'complaint/:complaintId',
      Track: 'track/:complaintId',
      ThreatRadar: 'threat-radar',
      Forensics: 'forensics',
    },
  },
};

const SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'slide_from_right',
  gestureEnabled: true,
};

function UserTabs() {
  const { isAuthorizedPersonnel } = useAuthStore();
  const showAdminTab = isAuthorizedPersonnel ? isAuthorizedPersonnel() : false;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
        tabBarIcon: ({ focused }) => {
          let icon = 'home';
          if (route.name === 'Submit') icon = 'report';
          else if (route.name === 'ScamSearch') icon = 'radar';
          else if (route.name === 'Comms') icon = 'chat';
          else if (route.name === 'Profile') icon = 'user';
          else if (route.name === 'Admin') icon = 'shield';

          return (
            <View style={styles.tabIconWrap}>
              <IconGlyph
                name={icon}
                size={21}
                color={focused ? colors.accent : colors.textSecondary}
                strokeWidth={focused ? 2.2 : 1.8}
                label={`${route.name} tab`}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Submit" component={SubmitComplaintScreen} options={{ tabBarLabel: 'Report' }} />
      <Tab.Screen name="ScamSearch" component={ScamSearchScreen} options={{ tabBarLabel: 'Radar' }} />
      <Tab.Screen name="Comms" component={GlobalChatScreen} options={{ tabBarLabel: 'Comms' }} />
      {showAdminTab && <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarLabel: 'Triage' }} />}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
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
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.splashText}>Initializing CyberGuard...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer linking={LINKING_CONFIG}>
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
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  splashText: {
    color: colors.textSecondary,
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
});
