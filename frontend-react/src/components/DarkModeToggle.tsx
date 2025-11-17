// frontend-react/src/components/DarkModeToggle.tsx
/**
 * Composant Toggle pour Dark Mode
 * Utilise Ant Design Switch avec icônes
 */
import React from 'react';
import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useDarkMode } from '../hooks/useDarkMode';

export const DarkModeToggle: React.FC = () => {
    const { isDark, toggle } = useDarkMode();

    return (
        <Switch
            checked={isDark}
            onChange={toggle}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            style={{ marginLeft: 8 }}
            title={isDark ? 'Mode clair' : 'Mode sombre'}
        />
    );
};

export default DarkModeToggle;
