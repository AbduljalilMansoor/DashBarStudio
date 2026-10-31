import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { Radio, Play, Square, Filter, Download, Trash2, ArrowRight } from 'lucide-react';

interface SignalChangeLog {
  id: string;
  time: string;
  name: string;
  oldVal: string | number;
  newVal: string | number;
  isNoisy?: boolean;
}

interface SignalSummaryItem {
  name: string;
  firstVal: string | number;
  currentVal: string | number;
  count: number;
  isNoisy?: boolean;
}

export const SignalMonitorFull: React.FC = () => {
  const { telemetry, updateTelemetry, t, isArabic } = useVehicle();

  const [filterQuery, setFilterQuery] = useState('*');
  const [autoStopSeconds, setAutoStopSeconds] = useState(60);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [logs, setLogs] = useState<SignalChangeLog[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [filterNoisy, setFilterNoisy] = useState(true);

  const prevTelemetryRef = useRef<typeof telemetry>(telemetry);
  const changeCountMapRef = useRef<Record<string, number>>({});

  // Capture telemetry changes and register signals
  useEffect(() => {
    if (!isMonitoring) return;

    const prev = prevTelemetryRef.current;
    const now = telemetry;
    const timeStr =
      new Date().toLocaleTimeString('en-US', { hour12: false }) +
      '.' +
      String(Date.now() % 1000).padStart(3, '0');

    const newLogs: SignalChangeLog[] = [];

    // Helper to log a named car signal
    const checkSignal = (name: string, oldV: any, newV: any) => {
      if (oldV !== newV) {
        changeCountMapRef.current[name] = (changeCountMapRef.current[name] || 0) + 1;
        const count = changeCountMapRef.current[name];
        const isNoisy = count > 15;

        newLogs.push({
          id: 'sig_' + Date.now() + Math.random(),
          time: timeStr,
          name,
          oldVal: oldV,
          newVal: newV,
          isNoisy
        });
      }
    };

    checkSignal('LHFDOORSTS', prev.doors.fl ? 1 : 0, now.doors.fl ? 1 : 0);
    checkSignal('RHFDOORSTS', prev.doors.fr ? 1 : 0, now.doors.fr ? 1 : 0);
    checkSignal('LHRDOORSTS', prev.doors.rl ? 1 : 0, now.doors.rl ? 1 : 0);
    checkSignal('RHRDOORSTS', prev.doors.rr ? 1 : 0, now.doors.rr ? 1 : 0);
    checkSignal('PLG_LATCHSTS', prev.doors.trunk ? 0 : 2, now.doors.trunk ? 0 : 2);
    checkSignal('LHFSEATBELTSW', prev.seatbelts.driver ? 1 : 0, now.seatbelts.driver ? 1 : 0);
    checkSignal('ACU_1_PSNGRSEATBELTWARNING', prev.seatbelts.passenger ? 0 : 2, now.seatbelts.passenger ? 0 : 2);
    checkSignal('VCU_1_G_PRNDGEARACT', prev.gear, now.gear);
    checkSignal('VEHICLESPEEDVSOSIG', Math.round(prev.speedKmh), Math.round(now.speedKmh));
    checkSignal('ENGINERPM_ACT', Math.round(prev.rpm / 50) * 50, Math.round(now.rpm / 50) * 50);
    checkSignal('FLZCU_9_POWERMODE', prev.powerMode, now.powerMode);
    checkSignal('ICC_HAZARDLIGHTREQ', prev.hazardLights ? 1 : 0, now.hazardLights ? 1 : 0);

    if (newLogs.length > 0) {
      setLogs(existing => [...newLogs, ...existing].slice(0, 500));
    }

    prevTelemetryRef.current = now;
  }, [telemetry, isMonitoring]);

  // Pattern matching for wildcard query (*DOOR*, LHF*, etc.)
  const matchesPattern = (signalName: string, query: string): boolean => {
    if (!query || query.trim() === '*' || query.trim() === '') return true;
    const cleanQ = query.trim().toUpperCase();
    if (!cleanQ.includes('*') && !cleanQ.includes('?')) {
      return signalName.toUpperCase().includes(cleanQ);
    }
    const regexStr = '^' + cleanQ.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
    try {
      const reg = new RegExp(regexStr);
      return reg.test(signalName.toUpperCase());
    } catch {
      return true;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      if (filterNoisy && item.isNoisy) return false;
      return matchesPattern(item.name, filterQuery);
    });
  }, [logs, filterQuery, filterNoisy]);

  // Signal summary list
  const summaryList = useMemo<SignalSummaryItem[]>(() => {
    const map: Record<string, SignalSummaryItem> = {};
    for (let i = logs.length - 1; i >= 0; i--) {
      const item = logs[i];
      if (!map[item.name]) {
        map[item.name] = {
          name: item.name,
          firstVal: item.oldVal,
          currentVal: item.newVal,
          count: 1,
          isNoisy: item.isNoisy
        };
      } else {
        map[item.name].currentVal = item.newVal;
        map[item.name].count += 1;
        if (item.isNoisy) map[item.name].isNoisy = true;
      }
    }
    return Object.values(map);
  }, [logs]);

  const handleExportCsv = () => {
    let csv = 'timestamp,signal_name,old_value,new_value\n';
    filteredLogs.forEach(l => {
      csv += `${l.time},${l.name},${l.oldVal},${l.newVal}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Signal_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111722] rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Full Signal Monitor & Hunter
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  isMonitoring
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isMonitoring ? 'LISTENING ON CAN BUS' : 'PAUSED'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                'Reverse-engineering and hunting tool: watches what changes in vehicle property getters.',
                'أداة كشف وتتبع الإشارات: ترصد التغيرات اللحظية في مخرجات نظام السيارة.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isMonitoring ? (
            <button
              onClick={() => setIsMonitoring(false)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              {t('Stop Listening', 'إيقاف')}
            </button>
          ) : (
            <button
              onClick={() => setIsMonitoring(true)}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {t('Start Listening', 'بدء')}
            </button>
          )}

          <button
            onClick={() => {
              setLogs([]);
              changeCountMapRef.current = {};
            }}
            className="p-2 rounded-xl bg-[#17202d] hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Clear Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-3 py-2 rounded-xl bg-[#17202d] hover:bg-[#222e3e] text-teal-300 border border-white/10 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Wildcard Filter & Options Bar */}
      <div className="p-4 bg-[#111722] rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Filter className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-slate-400">{t('Filter Query:', 'فلتر الإشارة:')}</span>
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="e.g. *DOOR*, LHF*, *STS, *"
            className="flex-1 bg-[#17202d] border border-white/10 rounded-xl px-3 py-1.5 font-mono text-white placeholder-slate-500"
          />
        </div>

        {/* Quick query chips */}
        <div className="flex items-center gap-1.5">
          {['*', '*DOOR*', 'LHF*', '*STS', '*BELT*'].map(chip => (
            <button
              key={chip}
              onClick={() => setFilterQuery(chip)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
                filterQuery === chip
                  ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                  : 'bg-[#17202d] text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filterNoisy}
            onChange={e => setFilterNoisy(e.target.checked)}
            className="rounded accent-teal-400 w-4 h-4"
          />
          <span>{t('Hide NOISY signals (>15 events)', 'إخفاء الإشارات المزعجة المتكررة')}</span>
        </label>
      </div>

      {/* Main Signal Display: Left is Log Stream, Right is Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Changed Signals Real-Time Stream */}
        <div className="lg:col-span-2 p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
            <span className="font-bold text-white uppercase tracking-wider font-mono">
              REAL-TIME SIGNAL EVENT LOG ({filteredLogs.length})
            </span>
            <span className="font-mono text-[11px] text-teal-400">
              {isMonitoring ? '● STREAM ACTIVE' : '○ STREAM PAUSED'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {filteredLogs.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#161d29] border border-white/5 hover:border-teal-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">{item.time}</span>
                  <span className="font-bold text-white text-xs">{item.name}</span>
                  {item.isNoisy && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950/40 text-amber-400 border border-amber-500/30">
                      NOISY
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{String(item.oldVal)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-teal-300 font-bold">{String(item.newVal)}</span>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="p-12 text-center text-xs text-slate-500">
                {t(
                  'No signal changes captured yet. Toggle vehicle doors or speed in the HUD or Cockpit above to watch values change live!',
                  'لم يتم تسجيل تغيرات بعد. قم بفتح باب أو تغيير السرعة في لوحة التحكم لمشاهدة تغير الإشارات مباشرة!'
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signals Summary Inspector */}
        <div className="p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
            <span className="font-bold text-white uppercase tracking-wider font-mono">
              CAPTURED SIGNALS ({summaryList.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {summaryList.map(item => (
              <div
                key={item.name}
                className="p-3 rounded-xl bg-[#161d29] border border-white/5 space-y-1.5 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{item.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300">
                    {item.count} changes
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Initial: {String(item.firstVal)}</span>
                  <span className="text-teal-400 font-bold">Now: {String(item.currentVal)}</span>
                </div>
              </div>
            ))}

            {summaryList.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No signals registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
