import React from 'react';

interface HealthStatusProps {
  apiUrl?: string;
  pollingInterval?: number;
  showDetails?: boolean;
}

declare const HealthStatus: React.ComponentType<HealthStatusProps>;

export default HealthStatus;
