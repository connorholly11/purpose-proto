/**
 * Web stub for expo-device
 * This prevents errors in web environments and keeps the bundle size smaller
 */

// Mock constants
export const DeviceType = {
  UNKNOWN: 0,
  PHONE: 1,
  TABLET: 2,
  DESKTOP: 3,
  TV: 4,
};

export const Brand = {
  UNKNOWN: 'unknown',
};

export const Manufacturer = {
  UNKNOWN: 'unknown',
};

export const ModelName = {
  UNKNOWN: 'unknown',
};

// Mock functions
export async function getDeviceTypeAsync() {
  return DeviceType.DESKTOP;
}

export function getDeviceType() {
  return DeviceType.DESKTOP;
}

export async function getIosModelNameAsync() {
  return ModelName.UNKNOWN;
}

export function getIosModelName() {
  return ModelName.UNKNOWN;
}

export async function getManufacturerAsync() {
  return Manufacturer.UNKNOWN;
}

export function getManufacturer() {
  return Manufacturer.UNKNOWN;
}

export async function getBrandAsync() {
  return Brand.UNKNOWN;
}

export function getBrand() {
  return Brand.UNKNOWN;
}

export async function getModelNameAsync() {
  return ModelName.UNKNOWN;
}

export function getModelName() {
  return ModelName.UNKNOWN;
}

export async function isRootedExperimentalAsync() {
  return false;
}

export async function isDevice() {
  return true;
}

export default {
  DeviceType,
  Brand,
  Manufacturer,
  ModelName,
  getDeviceTypeAsync,
  getDeviceType,
  getIosModelNameAsync,
  getIosModelName,
  getManufacturerAsync,
  getManufacturer,
  getBrandAsync,
  getBrand,
  getModelNameAsync,
  getModelName,
  isRootedExperimentalAsync,
  isDevice,
};