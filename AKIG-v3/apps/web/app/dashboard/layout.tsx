import { ReactNode } from 'react';
import Link from 'next/link';
import { Home, Users, FileText, DollarSign, Settings, BarChart3 } from 'lucide-react';

const sidebarItems = [
    { icon: Home, label: 'Tableau de Bord', href: '/dashboard' },
    { icon: Users, label: 'Locataires', href: '/dashboard/tenants' },
    { icon: Home, label: 'Propriétés', href: '/dashboard/properties' },
    { icon: FileText, label: 'Contrats', href: '/dashboard/contracts' },
    { icon: DollarSign, label: 'Paiements', href: '/dashboard/payments' },
    { icon: BarChart3, label: 'Rapports', href: '/dashboard/reports' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden w-64 overflow-y-auto border-r bg-gray-50 dark:bg-gray-900 md:block">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-6">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-primary" />
                            <span className="text-xl font-bold">AKIG</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t p-4">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-300" />
                            <div className="ml-3">
                                <p className="text-sm font-medium">Admin User</p>
                                <p className="text-xs text-gray-500">admin@akig.gn</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center border-b px-6">
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold">AKIG v3.0</h1>
                        <div className="flex items-center space-x-4">
                            {/* Add notifications, user menu, etc. */}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
