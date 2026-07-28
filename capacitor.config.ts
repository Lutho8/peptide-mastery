import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // NOTE: appId is the Android Java package (app.peptidesa).
  // Rebranding the Java package requires a full native rebuild + Play Store re-publish.
  // Keep appId stable for OTA continuity; only user-visible appName changes for now.
  appId: 'app.peptidesa',
  appName: 'Peptide South Africa',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3B82F6',
      sound: 'default'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
