'use client';

import { useState, useEffect, useRef } from 'react';
import { METRICS_CONFIG, TOOLS } from './constants';

const STORAGE_KEY = 'sre_simulator_state';

const getRandomValue = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const useSimulator = () => {
  const [metrics, setMetrics] = useState({});
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [remediations, setRemediations] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
    const [stats, setStats] = useState({
        incidentsResolved: 0,
        uptime: '99.99%',
        lastFixTime: null,
        timeSaved: 0 // in minutes
      });
      const [lastPostmortem, setLastPostmortem] = useState(null);
      const [isAutoPilot, setIsAutoPilot] = useState(false);
      const [isSystemActive, setIsSystemActive] = useState(true);
      const activeScenario = useRef(null);
      const remediationIntervalRef = useRef(null);


  const addLog = (message, type = 'info') => {
    setLogs((prev) => [
      { id: Date.now() + Math.random(), message, type, timestamp: new Date().toISOString() },
      ...(prev || []).slice(0, 49)
    ]);
  };

  const triggerIncident = (metricId, scenario = null) => {
    const config = Object.values(METRICS_CONFIG).find(c => c.id === metricId);
    if (!config) return;

    activeScenario.current = scenario;
    
    // Create the metric spike
    setMetrics(prev => ({
      ...prev,
      [metricId]: config.max
    }));

    // Manually push an alert to speed up the auto-remediation discovery
    const alertId = `alert-${Date.now()}-${metricId}`;
    const initialVal = config.max;
    
    setAlerts((prev) => {
      // Don't add if already alerting for this metric
      if (prev.find(a => a.metricId === metricId && a.status === 'active')) return prev;
      
      return [
        {
          id: alertId,
          metricId: metricId,
          label: config.label,
          value: initialVal,
          threshold: config.threshold,
          status: 'active',
          timestamp: Date.now(),
        },
        ...prev
      ].slice(0, 100);
    });

    addLog(`INCIDENT_TRIGGERED: ${scenario?.name || config.label} failure simulation started.`, 'error');
    setLastPostmortem(null);
  };

  // Initialize state from LocalStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setMetrics(parsed.metrics || {});
        setHistory(parsed.history || []);
        setAlerts(parsed.alerts || []);
        setRemediations(parsed.remediations || []);
        setLogs(parsed.logs || []);
        setStats(parsed.stats || { incidentsResolved: 0, uptime: '99.99%', lastFixTime: null, timeSaved: 0 });
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    } else {
      const initialMetrics = {};
      Object.keys(METRICS_CONFIG).forEach((key) => {
        const config = METRICS_CONFIG[key];
        initialMetrics[config.id] = getRandomValue(config.min, config.threshold - 10);
      });
      setMetrics(initialMetrics);
      addLog('Auto SRE Emulator Kernel initialized. Nodes standing by.', 'success');
    }
    setIsMounted(true);
  }, []);

  // Save state to LocalStorage
  useEffect(() => {
    if (!isMounted) return;
    const state = { metrics, history, alerts, remediations, logs, stats };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [metrics, history, alerts, remediations, logs, stats, isMounted]);

  // Simulation Loop
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setMetrics((prev) => {
        const next = { ...prev };
        Object.keys(METRICS_CONFIG).forEach((key) => {
          const config = METRICS_CONFIG[key];
          const current = next[config.id] || config.min;
          
          const isBeingFixed = activeTool && activeTool.metricId === config.id;
          
            if (isBeingFixed) {
              const target = config.min + 5;
              const diff = current - target;
              const reduction = diff > 0 ? Math.ceil(diff * 0.25) + 3 : 0;
              next[config.id] = Math.max(config.min, current - reduction);
            } else if (!isAutoPilot) {
              // Manual mode: subtle noise but no spikes or drifts that cause failures
              const noise = (Math.random() * 4) - 2;
              const currentVal = next[config.id] || config.min;
              // If we are currently in an error state but NOT being fixed, don't auto-recover
              // unless we are in AutoPilot mode. But we want manual mode to be stable.
              // Actually, if we're in manual mode, let's keep it steady.
              if (currentVal >= config.threshold) {
                // If it's already high (from a simulated issue), don't fluctuate randomly
                next[config.id] = currentVal + (Math.random() * 2 - 1);
              } else {
                next[config.id] = Math.max(config.min, Math.min(config.threshold - 5, currentVal + noise));
              }
            } else {
              const isHigh = current > config.threshold * 0.7;
              const trend = isHigh ? 2 : 0;
              const volatility = isHigh ? 15 : 6;
              const spikeChance = isHigh ? 0.90 : 0.97;
              
              const spike = Math.random() > spikeChance ? 30 : 0;
              const drift = Math.random() > 0.55 ? 3 : -2;
              const fluctuation = (Math.random() * volatility) - (volatility / 2);
              
              next[config.id] = Math.max(
                config.min, 
                Math.min(config.max, Math.round(current + fluctuation + drift + spike + trend))
              );
            }
        });
        
        setHistory((h) => [...h.slice(-29), { timestamp: Date.now(), ...next }]);
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isMounted, activeTool, isAutoPilot]);

  // Alert Engine
  useEffect(() => {
    if (!isMounted) return;

    Object.keys(METRICS_CONFIG).forEach((key) => {
      const config = METRICS_CONFIG[key];
      const val = metrics[config.id];
      const isAlerting = val >= config.threshold;
      
      setAlerts((prev) => {
        const existingAlert = prev.find((a) => a.metricId === config.id && a.status === 'active');
        
        if (isAlerting && !existingAlert) {
          addLog(`ALERT: ${config.label} critical at ${val}${config.unit}`, 'error');
          return [
            {
              id: `alert-${Date.now()}-${config.id}`,
              metricId: config.id,
              label: config.label,
              value: val,
              threshold: config.threshold,
              status: 'active',
              timestamp: Date.now(),
            },
            ...prev,
          ].slice(0, 100);
        } else if (!isAlerting && existingAlert) {
          addLog(`NORMAL: ${config.label} recovered to ${val}${config.unit}`, 'success');
          return prev.map((a) =>
            a.id === existingAlert.id ? { ...a, status: 'resolved', resolvedAt: Date.now() } : a
          );
        }
        return prev;
      });
    });
  }, [metrics, isMounted]);

  // Auto-Remediation System
  useEffect(() => {
    if (!isMounted || activeTool) return;

    const pendingAlert = alerts.find((a) => a.status === 'active' && !remediations.some(r => r.alertId === a.id && r.status === 'in_progress'));
    
    if (pendingAlert) {
      const config = Object.values(METRICS_CONFIG).find((c) => c.id === pendingAlert.metricId);
      const toolName = config.remediation;
      const toolConfig = TOOLS[toolName];
      const remediationId = `rem-${Date.now()}`;
      
      addLog(`REMEDIATING: Triggering ${toolName}...`, 'warning');
      
      setActiveTool({
        id: remediationId,
        name: toolName,
        description: toolConfig.description,
        metricId: pendingAlert.metricId,
        alertId: pendingAlert.id,
        progress: 0,
      });

      setRemediations((prev) => [
        {
          id: remediationId,
          alertId: pendingAlert.id,
          toolName,
          status: 'in_progress',
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 50));

      let progress = 0;
      const duration = toolConfig.duration;
      const step = 50; 
      const progressInterval = setInterval(() => {
        progress += (step / duration) * 100;
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          addLog(`SUCCESS: ${toolName} execution finished.`, 'success');
          setActiveTool(null);
          
          const postmortem = {
            id: `pm-${Date.now()}`,
            incidentId: pendingAlert.id,
            metricLabel: config.label,
            impact: `${pendingAlert.value}${config.unit}`,
            rca: activeScenario.current?.rca || `Threshold breach detected. Likely cause: ${config.id === 'cpu' ? 'runaway compute task' : config.id === 'memory' ? 'uncollected garbage' : 'resource exhaustion'}.`,
            remediation: toolName,
            duration: `${Math.round((Date.now() - pendingAlert.timestamp)/1000)}s`
          };
          setLastPostmortem(postmortem);
          activeScenario.current = null;


          setRemediations((prev) =>
            prev.map((r) =>
              r.id === remediationId ? { ...r, status: 'completed', completedAt: Date.now() } : r
            )
          );
          setStats(s => ({
            ...s,
            incidentsResolved: s.incidentsResolved + 1,
            lastFixTime: new Date().toLocaleTimeString(),
            timeSaved: s.timeSaved + getRandomValue(15, 45) // assume 15-45 mins saved per automation
          }));
        } else {
          setActiveTool((prev) => (prev ? { ...prev, progress } : null));
        }
      }, step);
    }
  }, [alerts, activeTool, isMounted, remediations]);

  return {
    metrics,
    history,
    alerts,
    remediations,
    activeTool,
    logs,
    stats,
    isMounted,
    lastPostmortem,
    isAutoPilot,
    setIsAutoPilot,
    triggerIncident,
    clearAll: () => {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    },
  };
};
