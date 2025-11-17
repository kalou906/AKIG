import React from 'react';

const variants = {
    info: 'bg-akig-primary/10 text-akig-primary border-akig-primary/30',
    success: 'bg-akig-success/10 text-akig-success border-akig-success/30',
    danger: 'bg-akig-danger/10 text-akig-danger border-akig-danger/30',
    warn: 'bg-akig-warn/10 text-akig-warn border-akig-warn/30',
};

export function Badge({ variant = 'info', children }) {
    const cls = variants[variant] || variants.info;
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
            {children}
        </span>
    );
}

export default Badge;