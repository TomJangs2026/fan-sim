import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts as useGaeguFonts, Gaegu_400Regular } from '@expo-google-fonts/gaegu';
import { useFonts as useJuaFonts, Jua_400Regular } from '@expo-google-fonts/jua';
import { useFonts as useGamjaFonts, GamjaFlower_400Regular } from '@expo-google-fonts/gamja-flower';
import { useFonts as useNanumPenFonts, NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [gaeguLoaded] = useGaeguFonts({ Gaegu_400Regular });
  const [juaLoaded] = useJuaFonts({ Jua_400Regular });
  const [gamjaLoaded] = useGamjaFonts({ GamjaFlower_400Regular });
  const [nanumPenLoaded] = useNanumPenFonts({ NanumPenScript_400Regular });

  const fontsReady = gaeguLoaded && juaLoaded && gamjaLoaded && nanumPenLoaded;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </SafeAreaProvider>
  );
}
