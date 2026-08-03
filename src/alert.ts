import { Alert, Platform } from 'react-native';

/** Alert.alert es no-op en react-native-web; en web usamos window.alert. */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    (globalThis as { alert?: (msg: string) => void }).alert?.(
      `${title}\n\n${message}`
    );
  } else {
    Alert.alert(title, message);
  }
}
