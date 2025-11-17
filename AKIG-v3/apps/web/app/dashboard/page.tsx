import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Home, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardStats {
    totalTenants: number;
    totalProperties: number;
    activeContracts: number;
    monthlyRevenue: number;
    occupancyRate: number;
    pendingPayments: number;
}

async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/stats/dashboard`, {
            cache: 'no-store', // Always fetch fresh data
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        return res.json();
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Return mock data for development
        return {
            totalTenants: 0,
            totalProperties: 0,
            activeContracts: 0,
            monthlyRevenue: 0,
            occupancyRate: 0,
            pendingPayments: 0,
        };
    }
}

function StatsCard({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
                title="Total Locataires"
                value={stats.totalTenants}
                icon={Users}
                trend="+12% depuis le mois dernier"
            />
            <StatsCard
                title="Propriétés"
                value={stats.totalProperties}
                icon={Home}
                trend="+3 nouvelles"
            />
            <StatsCard
                title="Contrats Actifs"
                value={stats.activeContracts}
                icon={FileText}
                trend={`${stats.occupancyRate}% d'occupation`}
            />
            <StatsCard
                title="Revenus Mensuels"
                value={`${stats.monthlyRevenue.toLocaleString('fr-GN')} GNF`}
                icon={DollarSign}
                trend="+8% vs mois précédent"
            />
            <StatsCard
                title="Taux d'Occupation"
                value={`${stats.occupancyRate}%`}
                icon={TrendingUp}
            />
            <StatsCard
                title="Paiements En Attente"
                value={stats.pendingPayments}
                icon={AlertCircle}
            />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-24 mb-1" />
                        <Skeleton className="h-3 w-40" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
                <div className="flex items-center space-x-2">
                    {/* Add filters/actions here */}
                </div>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardStatsGrid stats={stats} />
            </Suspense>

            {/* Recent Activity Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Activité Récente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Les dernières transactions et événements apparaîtront ici.
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Alertes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Les notifications importantes seront affichées ici.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export const metadata = {
    title: 'Tableau de Bord - AKIG',
    description: 'Vue d\'ensemble de votre gestion immobilière',
};
