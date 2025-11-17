import React from 'react';

export default function Alert({ children, type = 'info', className, ...props }) {
    const typeClasses = {
        info: 'bg-blue-100 text-blue-800 border border-blue-300',
        success: 'bg-green-100 text-green-800 border border-green-300',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        error: 'bg-red-100 text-red-800 border border-red-300',
    };

    return (
        <div
            className={`p-4 rounded ${typeClasses[type] || typeClasses.info} ${className || ''}`}
            {...props}
        >
            {children}
        </div>
    );
}
