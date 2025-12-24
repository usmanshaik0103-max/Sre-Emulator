export const METRICS_CONFIG = {
  CPU: {
    id: 'cpu',
    label: 'CPU Usage',
    unit: '%',
    min: 10,
    max: 100,
    threshold: 80,
    remediation: 'Service Restarter',
    color: '#3b82f6',
  },
  MEMORY: {
    id: 'memory',
    label: 'Memory Usage',
    unit: '%',
    min: 20,
    max: 100,
    threshold: 75,
    remediation: 'Cache Cleaner',
    color: '#a855f7',
  },
  DISK: {
    id: 'disk',
    label: 'Disk Usage',
    unit: '%',
    min: 30,
    max: 100,
    threshold: 90,
    remediation: 'Log Rotator',
    color: '#eab308',
  },
  LATENCY: {
    id: 'latency',
    label: 'API Latency',
    unit: 'ms',
    min: 50,
    max: 1000,
    threshold: 500,
    remediation: 'Load Balancer',
    color: '#10b981',
  },
  ERROR_RATE: {
    id: 'error_rate',
    label: 'Error Rate',
    unit: '%',
    min: 0,
    max: 20,
    threshold: 5,
    remediation: 'Deployment Rollback',
    color: '#ef4444',
  },
  TRAFFIC: {
    id: 'traffic',
    label: 'Traffic Load',
    unit: 'req/s',
    min: 100,
    max: 5000,
    threshold: 4000,
    remediation: 'Auto-Scaler',
    color: '#f97316',
  },
};

export const TOOLS = {
  'Service Restarter': {
    description: 'Restarting system services to clear CPU hang...',
    duration: 3000,
  },
  'Cache Cleaner': {
    description: 'Purging transient caches and heap memory...',
    duration: 2500,
  },
  'Log Rotator': {
    description: 'Compressing and archiving old system logs...',
    duration: 4000,
  },
  'Load Balancer': {
    description: 'Re-routing traffic to healthy nodes...',
    duration: 3500,
  },
  'Deployment Rollback': {
    description: 'Reverting to the last stable production build...',
    duration: 5000,
  },
  'Auto-Scaler': {
    description: 'Provisioning new instances for high load...',
    duration: 6000,
  },
};
