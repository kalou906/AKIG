// ============================================================
// 🧭 App.tsx (TypeScript bridge)
// Keeps CRA/TypeScript happy while the real AKIG router lives in App.jsx
// ============================================================

import type { FC } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - we intentionally load the JSX file to render the original dashboard
import App from './App.jsx';

const AppBridge: FC = () => <App />;

export default AppBridge;
