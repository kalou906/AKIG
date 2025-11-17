import React from 'react';

export default function ButtonSimple({ children, className, ...props }) {
    return (
        <button
            className={`px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 ${className || ''}`}
            {...props}
        >
            {children}
        </button>
    );
}
