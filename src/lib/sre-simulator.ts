
export const METRIC_TYPES = {
  CPU: 'CPU Usage',
  MEMORY: 'Memory Usage',
  DISK: 'Disk Usage',
  LATENCY: 'API Latency',
  ERROR_RATE: 'Error Rate',
  TRAFFIC: 'Traffic Load',
};

export const ALERTS = {
  HIGH_CPU: {
    id: 'HIGH_CPU',
    metric: METRIC_TYPES.CPU,
    threshold: 80,
    message: 'High CPU Alert',
    remediation: 'Restart service',
    tool: 'Service Restarter',
  },
  MEMORY_LEAK: {
    id: 'MEMORY_LEAK',
    metric: METRIC_TYPES.MEMORY,
    threshold: 75,
    message: 'Memory Leak Alert',
    remediation: 'Clear cache',
    tool: 'Cache Cleaner',
  },
  PERFORMANCE: {
    id: 'PERFORMANCE',
    metric: METRIC_TYPES.LATENCY,
    threshold: 500,
    message: 'Performance Alert',
    remediation: 'Route traffic',
    tool: 'Load Balancer',
  },
  SERVICE_FAILURE: {
    id: 'SERVICE_FAILURE',
    metric: METRIC_TYPES.ERROR_RATE,
    threshold: 5,
    message: 'Service Failure',
    remediation: 'Rollback deployment',
    tool: 'Deployment Rollback',
  },
  AUTO_SCALE: {
    id: 'AUTO_SCALE',
    metric: METRIC_TYPES.TRAFFIC,
    threshold: 90,
    message: 'Auto-scale Alert',
    remediation: 'Auto-scale instances',
    tool: 'Auto-Scaler',
  },
};

export const INITIAL_METRICS = {
  [METRIC_TYPES.CPU]: 45,
  [METRIC_TYPES.MEMORY]: 55,
  [METRIC_TYPES.DISK]: 30,
  [METRIC_TYPES.LATENCY]: 120,
  [METRIC_TYPES.ERROR_RATE]: 0.5,
  [METRIC_TYPES.TRAFFIC]: 60,
};

export const getMetricUnit = (type) => {
  switch (type) {
    case METRIC_TYPES.CPU:
    case METRIC_TYPES.MEMORY:
    case METRIC_TYPES.DISK:
    case METRIC_TYPES.TRAFFIC:
      return '%';
    case METRIC_TYPES.LATENCY:
      return 'ms';
    case METRIC_TYPES.ERROR_RATE:
      return '%';
    default:
      return '';
  }
};
