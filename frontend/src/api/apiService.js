// API service layer for fetching real-time metrics
import { buildEndpointUrl } from './endpoints';

export async function fetchMetrics(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const [contracts, payments, properties, tenants, alerts] = await Promise.all([
      fetch(buildEndpointUrl('/api/contracts'), { headers }).then(r => r.ok ? r.json() : []),
      fetch(buildEndpointUrl('/api/payments'), { headers }).then(r => r.ok ? r.json() : []),
      fetch(buildEndpointUrl('/api/properties'), { headers }).then(r => r.ok ? r.json() : []),
      fetch(buildEndpointUrl('/api/tenants'), { headers }).then(r => r.ok ? r.json() : []),
      fetch(buildEndpointUrl('/api/alerts'), { headers }).then(r => r.ok ? r.json() : []),
    ]);

    const overduePayments = Array.isArray(payments) 
      ? payments.filter(p => p.status === 'OVERDUE' || p.status === 'PENDING').length 
      : 0;
    
    const activeContracts = Array.isArray(contracts) 
      ? contracts.filter(c => c.status === 'ACTIVE').length 
      : 0;

    const totalRevenue = Array.isArray(properties)
      ? properties.reduce((sum, p) => sum + (parseFloat(p.rent_amount) || 0), 0)
      : 0;

    const criticalAlerts = Array.isArray(alerts)
      ? alerts.filter(a => a.severity === 'critical' || a.priority === 'high').length
      : 0;

    return {
      contracts: { total: Array.isArray(contracts) ? contracts.length : 0, active: activeContracts },
      payments: { total: Array.isArray(payments) ? payments.length : 0, overdue: overduePayments },
      properties: { total: Array.isArray(properties) ? properties.length : 0, revenue: totalRevenue },
      tenants: { total: Array.isArray(tenants) ? tenants.length : 0 },
      alerts: { total: Array.isArray(alerts) ? alerts.length : 0, critical: criticalAlerts },
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return {
      contracts: { total: 0, active: 0 },
      payments: { total: 0, overdue: 0 },
      properties: { total: 0, revenue: 0 },
      tenants: { total: 0 },
      alerts: { total: 0, critical: 0 },
    };
  }
}

export async function fetchRecentActivity(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await fetch(buildEndpointUrl('/api/dashboard'), { headers });
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.recentActivities || [];
  } catch (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
}

export async function fetchNotifications(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await fetch(buildEndpointUrl('/api/notifications'), { headers });
    if (!response.ok) return [];
    
    const data = await response.json();
    return Array.isArray(data) ? data.slice(0, 10) : [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function searchGlobal(query, token) {
  if (!query || query.length < 2) return [];
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await fetch(buildEndpointUrl(`/api/search?q=${encodeURIComponent(query)}`), { headers });
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching:', error);
    return [];
  }
}
