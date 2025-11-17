import React from 'react';

export default function Card({ children, className, title, ...props }) {
    return (
        <div
            className={`bg-white rounded-lg shadow p-6 ${className || ''}`}
            {...props}
        >
            {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
            {children}
        </div>
    );
}
