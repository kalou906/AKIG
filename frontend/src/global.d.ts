/**
 * Global type declarations
 * Ignores implicit any types for legacy JSX/JS files
 */

declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '*.js' {
  import type { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

// Allow imports from pages and components
declare module './pages/*';
declare module './components/*';
declare module './components/layout/*';
