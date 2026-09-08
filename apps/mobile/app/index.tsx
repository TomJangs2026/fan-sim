import { Redirect } from 'expo-router';
import { useAppStore } from '@fan-sim/core';

export default function Index() {
  const session = useAppStore((s) => s.session);
  return <Redirect href={session ? '/(main)/home' : '/(auth)/login'} />;
}
