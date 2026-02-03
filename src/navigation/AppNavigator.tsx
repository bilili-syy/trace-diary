import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  HomeScreen, 
  CalendarScreen, 
  SettingsScreen, 
  EditorScreen, 
  DiaryDetailScreen 
} from '../screens';
import { Layout } from '../constants';
import { useTheme } from '../context/ThemeProvider';
import { RootStackParamList, MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const stackNavigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const handleCreatePress = () => {
    stackNavigation.navigate('Editor', {});
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.tabBarBackground }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Feather.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Settings') iconName = 'settings';

          if (index === 1) {
            return (
              <React.Fragment key={route.key}>
                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={iconName}
                    size={22}
                    color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={handleCreatePress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.createButton, { backgroundColor: colors.primary }]}>
                    <Feather name="plus" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Feather
                name={iconName}
                size={22}
                color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen 
        name="Editor" 
        component={EditorScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="DiaryDetail" 
        component={DiaryDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Layout.tabBar.marginHorizontal,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: Layout.borderRadius.xl,
    height: Layout.tabBar.height,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
