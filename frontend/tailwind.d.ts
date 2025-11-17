/**
 * Tailwind CSS Configuration Types
 * Provides TypeScript types for Tailwind utilities
 */

declare namespace tailwindcss {
  interface Config {
    content: string[];
    theme: {
      extend: Record<string, unknown>;
    };
    plugins: unknown[];
    safelist: string[];
  }
}

export {};
