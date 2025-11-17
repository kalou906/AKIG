/**
 * Tabs.jsx - Composant Tabs réutilisable
 * Navigation par onglets avec contenu dynamique
 */

import React, { useState } from 'react';
import './Tabs.css';

export default function Tabs({ tabs, defaultActive = 0, onChange = null }) {
    const [active, setActive] = useState(defaultActive);

    const handleChange = (index) => {
        setActive(index);
        if (onChange) onChange(index, tabs[index]);
    };

    return (
        <div className="tabs-container">
            <div className="tabs-nav">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        className={`tab-button ${active === index ? 'tab-active' : ''}`}
                        onClick={() => handleChange(index)}
                    >
                        {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tabs-content">
                {tabs[active]?.content}
            </div>
        </div>
    );
}
