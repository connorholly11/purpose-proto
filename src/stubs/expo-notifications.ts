/**
 * Web stub for expo-notifications
 * This prevents errors in web environments and keeps the bundle size smaller
 */

// Mock constants
export const AndroidImportance = {
  DEFAULT: 3,
  MAX: 5,
  HIGH: 4,
  LOW: 2,
  MIN: 1,
  NONE: 0,
};

export const AndroidNotificationVisibility = {
  PRIVATE: 0,
  PUBLIC: 1,
  SECRET: -1,
};

export const NotificationPriority = {
  MAX: 'max',
  HIGH: 'high',
  DEFAULT: 'default',
  LOW: 'low',
  MIN: 'min',
};

// Mock functions
export async function getExpoPushTokenAsync() {
  console.warn('Push notifications are not supported in web environment');
  return { data: 'EXPO_PUSH_TOKEN_NOT_AVAILABLE_ON_WEB' };
}

export async function getDevicePushTokenAsync() {
  console.warn('Push notifications are not supported in web environment');
  return { data: null, type: 'unknown' };
}

export async function requestPermissionsAsync() {
  console.warn('Push notifications are not supported in web environment');
  return { status: 'denied' };
}

export function addNotificationReceivedListener() {
  return { remove: () => {} };
}

export function addNotificationResponseReceivedListener() {
  return { remove: () => {} };
}

export function removeNotificationSubscription() {
  // No-op
}

export async function scheduleNotificationAsync() {
  console.warn('Push notifications are not supported in web environment');
  return 'notification-id-not-available-on-web';
}

export async function dismissNotificationAsync() {
  console.warn('Push notifications are not supported in web environment');
}

export async function dismissAllNotificationsAsync() {
  console.warn('Push notifications are not supported in web environment');
}

export async function getNotificationChannelsAsync() {
  console.warn('Push notifications are not supported in web environment');
  return [];
}

export async function setNotificationChannelAsync() {
  console.warn('Push notifications are not supported in web environment');
  return false;
}

export async function getNotificationCategoriesAsync() {
  console.warn('Push notifications are not supported in web environment');
  return [];
}

export async function setNotificationCategoryAsync() {
  console.warn('Push notifications are not supported in web environment');
  return false;
}

export async function getPermissionsAsync() {
  console.warn('Push notifications are not supported in web environment');
  return { status: 'denied' };
}

export default {
  AndroidImportance,
  AndroidNotificationVisibility,
  NotificationPriority,
  getExpoPushTokenAsync,
  getDevicePushTokenAsync,
  requestPermissionsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
  scheduleNotificationAsync,
  dismissNotificationAsync,
  dismissAllNotificationsAsync,
  getNotificationChannelsAsync,
  setNotificationChannelAsync,
  getNotificationCategoriesAsync,
  setNotificationCategoryAsync,
  getPermissionsAsync,
};