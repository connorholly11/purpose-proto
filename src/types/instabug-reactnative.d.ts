declare module 'instabug-reactnative' {
  export enum InvocationEvent {
    shake = 'shake',
    screenshot = 'screenshot',
    floatingButton = 'floatingButton',
    twoFingerSwipeLeft = 'twoFingerSwipeLeft',
    rightEdgePan = 'rightEdgePan',
    none = 'none'
  }

  export enum colorTheme {
    light = 'light',
    dark = 'dark'
  }

  export interface InstabugConfig {
    token: string;
    invocationEvents: InvocationEvent[];
    primaryColor?: string;
  }

  export interface ReportData {
    reportType: string;
    message: string;
    [key: string]: any;
  }

  export default class Instabug {
    static init(config: InstabugConfig): void;
    static setColorTheme(theme: colorTheme): void;
    static onReportSubmitHandler(callback: (report: ReportData) => Promise<void>): void;
    static setUserAttribute(key: string, value: string): void;
    static colorTheme: { light: colorTheme; dark: colorTheme };
  }
}