// Stub for Instabug on web environment
export const InvocationEvent = {
  shake: 'shake',
  screenshot: 'screenshot',
  floatingButton: 'floatingButton'
};

const Instabug = {
  init: () => console.log('Instabug.init called in web stub'),
  setColorTheme: () => console.log('Instabug.setColorTheme called in web stub'),
  onReportSubmitHandler: () => console.log('Instabug.onReportSubmitHandler called in web stub'),
  setUserAttribute: () => console.log('Instabug.setUserAttribute called in web stub'),
  colorTheme: {
    dark: 'dark',
    light: 'light'
  }
};

export default Instabug;