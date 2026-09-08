import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const ICON: Record<string, string> = {
  home: '🏠',
  news: '📰',
  preferences: '⭐',
  settings: '⚙️',
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1D4ED8' }}>
      <Tabs.Screen
        name="home"
        options={{ title: '홈', tabBarIcon: () => <Text>{ICON.home}</Text> }}
      />
      <Tabs.Screen
        name="news"
        options={{ title: '뉴스', tabBarIcon: () => <Text>{ICON.news}</Text> }}
      />
      <Tabs.Screen
        name="preferences"
        options={{ title: '선호설정', tabBarIcon: () => <Text>{ICON.preferences}</Text> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '일반설정', tabBarIcon: () => <Text>{ICON.settings}</Text> }}
      />
    </Tabs>
  );
}
