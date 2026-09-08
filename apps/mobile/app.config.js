module.exports = {
  expo: {
    name: 'fan-sim',
    slug: 'fan-sim',
    scheme: 'fansim',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    plugins: ['expo-router'],
    web: {
      bundler: 'metro',
    },
    android: {
      package: 'com.fansim.mobile',
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    },
  },
};
