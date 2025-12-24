'use client';

import { useState, useEffect, useRef } from 'react';
import { METRIC_TYPES, ALERTS, INITIAL_METRICS } from '@/lib/sre-simulator';

export function useSreSimulator() {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [remediating, setRemediating] = useState(null);
  const [logs, setLogs] = useState([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedMetrics = localStorage.getItem('sre_metrics');
    const savedHistory = localStorage.getItem('sre_history');
    const savedLogs = localStorage.getItem('sre_logs');

    if (savedMetrics) setMetrics(JSON.parse(savedMetrics));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('sre_metrics', JSON.stringify(metrics));
    localStorage.setItem('sre_history', JSON.stringify(history));
    localStorage.setItem('sre_logs', JSON.stringify(logs));
  }, [metrics, history, logs]);

  const addLog = (message, type = 'info') => {
    const newLog = { id: Date.now(), message, type, timestamp: new Date().toLocaleTimeString() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const triggerRemediation = (alert) => {
    if (remediating) return;

    setRemediating({ ...alert, progress: 0 });
    addLog(`Auto-remediation triggered: ${alert.remediation} via ${alert.tool}`, 'warning');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setRemediating(prev => prev ? { ...prev, progress } : null);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Resolve remediation
          setRemediating(null);
          setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
          
          // Stabilize the metric that caused the alert
          setMetrics(prev => ({
            ...prev,
            [alert.metric]: INITIAL_METRICS[alert.metric] * 0.8 // Set to safe level
          }));

          setHistory(prev => [{
            id: Date.now(),
            alert: alert.message,
            action: alert.remediation,
            tool: alert.tool,
            timestamp: new Date().toLocaleString()
          }, ...prev].slice(0, 20));

          addLog(`Remediation successful: ${alert.remediation} completed.`, 'success');
        }, 500);
      }
    }, 300);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Don't update metrics drastically if remediating
      if (remediating) return;

      setMetrics(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          // Random fluctuation
          const change = (Math.random() - 0.45) * 5; 
          next[key] = Math.max(0, Math.min(100, next[key] + change));
          
          // Latency and Error rate have different scales
          if (key === METRIC_TYPES.LATENCY) {
            next[key] = Math.max(50, Math.min(2000, next[key] + (Math.random() - 0.4) * 50));
          }
          if (key === METRIC_TYPES.ERROR_RATE) {
            next[key] = Math.max(0, Math.min(20, next[key] + (Math.random() - 0.48) * 1));
          }
        });
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [remediating]);

  // Alert detection engine
  useEffect(() => {
    const newAlerts = [];
    Object.values(ALERTS).forEach(rule => {
      if (metrics[rule.metric] >= rule.threshold) {
        if (!activeAlerts.find(a => a.id === rule.id)) {
          newAlerts.push(rule);
        }
      }
    });

    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...prev, ...newAlerts]);
      newAlerts.forEach(alert => {
        addLog(`Alert detected: ${alert.message} (${metrics[alert.metric].toFixed(1)}${alert.metric === METRIC_TYPES.LATENCY ? 'ms' : '%'})`, 'error');
      });
    }
  }, [metrics]);

  // Auto-remediation trigger logic
  useEffect(() => {
    if (activeAlerts.length > 0 && !remediating) {
      // Pick the first alert to fix
      triggerRemediation(activeAlerts[0]);
    }
  }, [activeAlerts, remediating]);

  return {
    metrics,
    activeAlerts,
    history,
    remediating,
    logs,
    resetSystem: () => {
      setMetrics(INITIAL_METRICS);
      setActiveAlerts([]);
      setHistory([]);
      setLogs([]);
      localStorage.clear();
    }
  };
}
