import React from 'react';

export default function Footer() {
    return (
        <footer className="mt-8 border-t pt-4 text-sm text-gray-500 flex items-center justify-between">
            <span>© {new Date().getFullYear()} AKIG • Premium UI</span>
            <a href="/docs" className="hover:text-akig-primary">Docs</a>
        </footer>
    );
}