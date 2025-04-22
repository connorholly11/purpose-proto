/**
 * Interface for the payload sent to register a push token
 */
export interface PushRegisterPayload {
  token: string;
  deviceOS: 'ios' | 'android';
}

/**
 * Interface for a push notification message
 */
export interface PushNotificationMessage {
  to: string;
  sound: 'default' | null;
  title: string;
  body: string;
  data: {
    screen?: string;
    [key: string]: any;
  };
}