'use client';

import React, { useRef, useEffect } from 'react';
import { useSimulator } from '@/lib/sre/useSimulator';
import { METRICS_CONFIG } from '@/lib/sre/constants';
import { 
  LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip as ChartTooltip, AreaChart, Area 
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, Cpu, HardDrive, 
  Layers, Terminal, Zap, RefreshCcw, ShieldAlert, Wifi,
  BarChart3, Clock, Database, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './simulator.css';

const MetricCard = ({ metric, value, history }) => {
  const isAlerting = value >= metric.threshold;
  const chartData = history.map(h => ({ value: h[metric.id] }));

  return (
    <motion.div 
      layout
      className={`terminal-card p-4 relative overflow-hidden group transition-all duration-500 ${isAlerting ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'hover:border-blue-500/30'}`}
    >
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded bg-gray-900 border ${isAlerting ? 'border-red-500/50 text-red-400' : 'border-gray-800 text-gray-400'}`}>
            {metric.id === 'cpu' && <Cpu size={16} />}
            {metric.id === 'memory' && <Layers size={16} />}
            {metric.id === 'disk' && <HardDrive size={16} />}
            {metric.id === 'latency' && <Wifi size={16} />}
            {metric.id === 'error_rate' && <ShieldAlert size={16} />}
            {metric.id === 'traffic' && <Activity size={16} />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block leading-tight">{metric.label}</span>
            <span className="text-[9px] font-mono text-gray-600 block">ID: {metric.id.toUpperCase()}</span>
          </div>
        </div>
        <div className={`text-2xl font-mono leading-none tracking-tighter ${isAlerting ? 'text-red-500' : 'text-blue-400'}`}>
          {value}<span className="text-xs opacity-50 ml-0.5">{metric.unit}</span>
        </div>
      </div>

      <div className="h-20 w-full mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={metric.color} 
              fillOpacity={1} 
              fill={`url(#gradient-${metric.id})`}
              strokeWidth={2} 
              isAnimationActive={false}
            />
            <YAxis hide domain={[0, metric.max]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex justify-between items-center text-[9px] font-mono relative z-10">
        <div className="flex gap-2 text-gray-500">
          <span>MIN: {metric.min}</span>
          <span>MAX: {metric.max}</span>
        </div>
        {isAlerting ? (
          <span className="text-red-500 flex items-center gap-1 animate-pulse font-bold">
            <AlertTriangle size={10} /> CRITICAL_{metric.threshold}
          </span>
        ) : (
          <span className="text-emerald-500/50 uppercase tracking-tighter">NOMINAL_OP</span>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 p-1 opacity-10">
        <div className="w-16 h-16 border-t border-r border-gray-400 rounded-tr-lg" />
      </div>
    </motion.div>
  );
};

const ToolConsole = ({ tool }) => {
  if (!tool) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[100] px-4"
    >
      <div className="terminal-card bg-black shadow-[0_0_50px_rgba(59,130,246,0.3)] border-blue-500 p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
          <motion.div 
            className="h-full bg-blue-500" 
            initial={{ width: 0 }}
            animate={{ width: `${tool.progress}%` }}
          />
        </div>

        <div className="flex items-start gap-5">
          <div className="bg-blue-500/10 p-4 rounded border border-blue-500/30">
            <RefreshCcw className="text-blue-500 animate-spin" size={32} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-blue-400 font-black uppercase tracking-[0.2em] text-lg">Remediation Active</h3>
              <span className="text-blue-500 font-mono text-sm">{Math.round(tool.progress)}%</span>
            </div>
            <p className="text-gray-300 font-bold mb-4 font-mono text-sm uppercase">&gt; EXECUTING: {tool.name}</p>
            
            <div className="bg-gray-900/50 rounded p-3 border border-gray-800 font-mono text-xs text-blue-300">
              <p className="mb-2 italic disabled text-gray-500">// {tool.description}</p>
              <div className="flex gap-2">
                <span className="text-emerald-500">TASK_ID:</span>
                <span>{tool.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500">NODE_REF:</span>
                <span>SYSTEM_MAIN_CLUSTER_01</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-1 h-1.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-full ${i/20 < tool.progress/100 ? 'bg-blue-500' : 'bg-gray-800'}`} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const SystemLogs = ({ logs }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="terminal-card h-64 bg-black/80 flex flex-col border-gray-800">
      <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tailing_System_Logs</span>
        </div>
        <span className="text-[9px] font-mono text-gray-600">STDOUT / VAR/LOG</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3">
            <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className={
              log.type === 'error' ? 'text-red-500' : 
              log.type === 'warning' ? 'text-yellow-500' : 
              log.type === 'success' ? 'text-emerald-500' : 'text-blue-400'
            }>
              {log.type === 'error' && '!!'} {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AlertHistory = ({ alerts }) => {
  return (
    <div className="terminal-card flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Terminal size={14} /> Incident_Repo
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">{alerts.length} ENTRIES</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {alerts.length === 0 && (
            <p className="text-gray-600 text-[10px] font-mono italic">Cluster state check: Healthy. No logs.</p>
          )}
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-sm border ${
                alert.status === 'active' 
                ? 'bg-red-500/5 border-red-500/30 text-red-500' 
                : 'bg-gray-800/50 border-gray-800 text-gray-500'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-black tracking-tighter ${alert.status === 'active' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {alert.status === 'active' ? '● CRITICAL' : '○ RESOLVED'}
                </span>
                <span className="text-[9px] font-mono">ID_{alert.id.split('-').pop()}</span>
              </div>
              <p className="text-xs font-bold text-gray-300">{alert.label}</p>
              <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-600">
                <span>VALUE: {alert.value}</span>
                <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
              {alert.resolvedAt && (
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-2 text-[9px] text-emerald-500/60 font-mono">
                  <CheckCircle size={10} /> Auto-fixed +{Math.round((alert.resolvedAt - alert.timestamp)/1000)}s
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Postmortem = ({ data }) => {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="terminal-card bg-emerald-500/5 border-emerald-500/30 p-5 mt-8 overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-emerald-500 font-black uppercase tracking-[0.2em] text-sm flex items-center gap-2">
            <CheckCircle size={16} /> POST_MORTEM_REPORT
          </h3>
          <p className="text-[10px] text-emerald-500/60 font-mono">ID: {data.id}</p>
        </div>
        <span className="text-[10px] font-mono text-emerald-500/40">{data.duration} TO RECOVERY</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div>
          <p className="text-gray-500 uppercase font-bold mb-1 tracking-widest text-[10px]">Root Cause Analysis (RCA)</p>
          <p className="text-gray-300 leading-relaxed italic">{data.rca}</p>
        </div>
        <div>
          <p className="text-gray-500 uppercase font-bold mb-1 tracking-widest text-[10px]">Mitigation Steps</p>
          <div className="flex items-center gap-2 text-emerald-400">
            <Zap size={10} />
            <span>Automated {data.remediation} successful</span>
          </div>
          <div className="mt-2 text-gray-400">
            Impact: {data.metricLabel} reached {data.impact}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function SimulatorPage() {
  const { 
    metrics, history, alerts, activeTool, logs, stats, 
    clearAll, isMounted, lastPostmortem, triggerIncident,
    isAutoPilot, setIsAutoPilot 
  } = useSimulator();

  if (!isMounted) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  const SCENARIOS = [
    { 
      name: 'CPU_SPIKE', 
      metric: 'cpu', 
      rca: 'Runaway background process found in container cluster_A. Process was consuming 98% of assigned cycles due to infinite loop in legacy middleware.' 
    },
    { 
      name: 'MEM_LEAK', 
      metric: 'memory', 
      rca: 'Memory leak detected in API gateway. Buffer was not being released after large payload processing in the networking layer.' 
    },
    { 
      name: 'NET_STORM', 
      metric: 'latency', 
      rca: 'Recursive DNS lookup loop discovered. A misconfigured route caused infinite retries, flooding the internal network bridge.' 
    }
  ];

  return (
    <div className="sre-container relative min-h-screen bg-[#050505] text-gray-300 font-mono overflow-x-hidden selection:bg-blue-500/30">
      <div className="scanline" />
      
      {/* HUD HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-8 gap-6 border-b border-gray-800 pb-8 pt-4">
        <div className="relative">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-black tracking-tighter text-white flex items-center gap-3 italic"
          >
            <Zap className="text-blue-500 fill-blue-500" size={32} />
            Auto SRE Emulator <span className="text-blue-500 not-italic"></span>
          </motion.h1>
            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={() => setIsAutoPilot(!isAutoPilot)}
                className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-widest transition-all ${
                  isAutoPilot 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                  : 'bg-gray-800/10 border-gray-700 text-gray-500'
                }`}
              >
                {isAutoPilot ? 'AUTONOMOUS_MODE: ON' : 'AUTONOMOUS_MODE: OFF'}
              </button>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                made by Usman Shaik
              </div>
            </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-2xl">
          {[
            { label: 'Incidents Fixed', value: stats.incidentsResolved, icon: ShieldAlert, color: 'text-emerald-500' },
            { label: 'SLA Uptime', value: stats.uptime, icon: Activity, color: 'text-blue-400' },
            { label: 'Time Saved', value: `${stats.timeSaved}m`, icon: Clock, color: 'text-purple-400' },
            { label: 'Active Alerts', value: alerts.filter(a => a.status === 'active').length, icon: AlertTriangle, color: alerts.some(a => a.status === 'active') ? 'text-red-500' : 'text-gray-500' },
            { label: 'System Health', value: activeTool ? '92%' : '100%', icon: CheckCircle, color: activeTool ? 'text-yellow-500' : 'text-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="terminal-card p-3 border-gray-800 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={12} className={stat.color} />
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-tighter">{stat.label}</span>
              </div>
              <div className={`text-xl font-bold font-mono tracking-tighter ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button 
                onClick={clearAll}
                className="shrink-0 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest px-4 py-3 border border-gray-800 hover:border-red-500 hover:text-red-500 transition-all hover:bg-red-500/5"
              >
                <RefreshCcw size={14} /> REBOOT
              </button>

              <button 
                onClick={() => {
                  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
                  triggerIncident(scenario.metric, scenario);
                }}
                disabled={activeTool || alerts.some(a => a.status === 'active')}
                className={`flex-1 flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest px-6 py-3 border transition-all ${
                  activeTool || alerts.some(a => a.status === 'active')
                  ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                  : 'border-blue-500 text-blue-500 hover:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                }`}
              >
                <Zap size={14} /> SIMULATE_ISSUE
              </button>
            </div>
            
            <div className="flex gap-1 justify-end">
              {SCENARIOS.map(s => (
                <button
                  key={s.name}
                  onClick={() => triggerIncident(s.metric, s)}
                  disabled={activeTool || alerts.some(a => a.status === 'active')}
                  className="text-[8px] font-mono border border-gray-800 px-2 py-1 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +{s.name}
                </button>
              ))}
            </div>
          </div>

      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Metrics & Monitoring (Center Stage) */}
        <div className="xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(METRICS_CONFIG).map((key) => {
              const config = METRICS_CONFIG[key];
              return (
                <MetricCard 
                  key={config.id} 
                  metric={config} 
                  value={metrics[config.id] || 0} 
                  history={history} 
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="terminal-card p-6 border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BarChart3 size={120} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2 border-l-2 border-blue-500 pl-3">
                <Activity size={14} className="text-blue-500" /> Multi-Stream Analysis
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    {Object.values(METRICS_CONFIG).map(config => (
                      <Line 
                        key={config.id}
                        type="monotone" 
                        dataKey={config.id} 
                        stroke={config.color} 
                        strokeWidth={1.5} 
                        dot={false} 
                        isAnimationActive={false}
                        opacity={0.8}
                      />
                    ))}
                    <XAxis hide />
                    <YAxis hide />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px', borderRadius: '4px' }}
                      itemStyle={{ padding: '2px 0' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <SystemLogs logs={logs} />
          </div>

          <AnimatePresence>
            {lastPostmortem && <Postmortem data={lastPostmortem} />}
          </AnimatePresence>
        </div>

        {/* Right Column: Alerts & Side Panel */}
        <div className="xl:col-span-4 flex flex-col gap-8 h-full min-h-[600px]">
          <AlertHistory alerts={alerts} />
          
          <div className="terminal-card p-5 border-gray-800 bg-gradient-to-br from-gray-900/50 to-transparent">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Autonomous_Node_Status</h4>
            <div className="space-y-3">
              {[
                { name: 'US-EAST-1', status: 'online' },
                { name: 'EU-WEST-2', status: 'online' },
                { name: 'AP-SOUTH-1', status: 'maintenance' },
                { name: 'SA-EAST-1', status: 'online' },
              ].map((node, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-mono border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    <span className="text-gray-400">{node.name}</span>
                  </div>
                  <span className={node.status === 'online' ? 'text-emerald-500/80' : 'text-yellow-500/80'}>
                    {node.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/20 rounded">
              <p className="text-[9px] text-blue-400/80 leading-relaxed italic">
                * Autonomous mode currently active. All threshold breaches will be handled by the Auto SRE Emulator Remediation Core without further confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Execution Overlay */}
      <AnimatePresence>
        {activeTool && <ToolConsole tool={activeTool} />}
      </AnimatePresence>

      {/* Background decoration */}
      {isMounted && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.02] z-[-1] overflow-hidden whitespace-pre font-mono text-[9px] leading-none text-blue-500">
          {Array.from({ length: 150 }).map((_, i) => (
            <div key={i}>{Math.random().toString(36).substring(2, 15).repeat(20)}</div>
          ))}
        </div>
      )}
      
      {/* Corner Deco */}
      <div className="fixed bottom-4 right-4 pointer-events-none opacity-20 hidden md:block">
        <div className="text-[8px] font-mono text-gray-400 flex flex-col items-end">
          {/* <span>LAT_X: 40.7128° N</span>
          <span>LOT_Y: 74.0060° W</span>
          <span>AUTH_KEY: ************3921</span> */}
        </div>
      </div>
    </div>
  );
}
