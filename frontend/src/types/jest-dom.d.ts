import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(className: string): R;
      toHaveFocus(): R;
      toHaveStyle(css: string): R;
      toHaveValue(value: string | string[] | number): R;
    }
  }
}

// This is an empty export to make TypeScript treat this file as a module
export {};
