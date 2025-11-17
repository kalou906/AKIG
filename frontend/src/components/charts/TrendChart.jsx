import React from 'react';

// Tiny inline trend chart using SVG; accepts data=[numbers], color, and height
export default function TrendChart({ data = [], color = '#2563eb', height = 28, strokeWidth = 2 }) {
    if (!data || data.length === 0) {
        return <div className="text-xs text-gray-400">No data</div>;
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const width = data.length - 1 || 1;
    const norm = (v) => (max - min === 0 ? 0.5 : (v - min) / (max - min));
    const points = data
        .map((v, i) => {
            const x = (i / width) * 100;
            const y = (1 - norm(v)) * 100; // invert for SVG
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full">
            <polyline fill="none" stroke={color} strokeWidth={strokeWidth} points={points} />
        </svg>
    );
}