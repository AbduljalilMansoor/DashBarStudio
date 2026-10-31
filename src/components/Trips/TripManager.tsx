import React, { useState, useMemo } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { RecordedTrip, DriveMode } from '../../types';
import {
  Play,
  Square,
  Download,
  FileText,
  TrendingUp,
  Share2,
  Calendar,
  Clock,
  Gauge,
  Fuel,
  Zap,
  Leaf,
  Filter,
  BarChart3,
  Cloud,
  ChevronRight,
  Trash2,
  Info
} from 'lucide-react';

export const TripManager: React.FC = () => {
  const {
    telemetry,
    updateTelemetry,
    recordedTrips,
    isRecordingTrip,
    activeTrip,
    startTrip,
    stopTrip,
    deleteTrip,
    tripMode,
    setTripMode,
    tripStorageLimitMb,
    fuelLedger,
    t,
    isArabic
  } = useVehicle();

  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'analysis' | 'forecast' | 'cloud'>('live');
  const [distanceFilter, setDistanceFilter] = useState<'all' | 'under10' | '10to30' | '30to60' | '60plus'>('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(recordedTrips[0]?.id || null);

  // Explorer chart curve toggle
  const [showSocCurve, setShowSocCurve] = useState(true);
  const [showFuelCurve, setShowFuelCurve] = useState(true);
  const [showSpeedCurve, setShowSpeedCurve] = useState(true);

  // Forecast state
  const [forecastDistKm, setForecastDistKm] = useState(50);
  const [forecastStartSoc, setForecastStartSoc] = useState(85);
  const [forecastRouteType, setForecastRouteType] = useState<'average' | 'city' | 'mixed' | 'highway'>('mixed');
  const [forecastHoldSoc, setForecastHoldSoc] = useState(25);

  const selectedTrip = recordedTrips.find(t => t.id === selectedTripId) || recordedTrips[0];

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return recordedTrips.filter(tr => {
      if (distanceFilter === 'under10') return tr.distKm < 10;
      if (distanceFilter === '10to30') return tr.distKm >= 10 && tr.distKm < 30;
      if (distanceFilter === '30to60') return tr.distKm >= 30 && tr.distKm < 60;
      if (distanceFilter === '60plus') return tr.distKm >= 60;
      return true;
    });
  }, [recordedTrips, distanceFilter]);

  // Aggregate stats
  const totalKmDriven = recordedTrips.reduce((acc, curr) => acc + curr.distKm, 0);
  const totalFuelUsed = recordedTrips.reduce((acc, curr) => acc + curr.fuelUsedL, 0);
  const totalSavedBd = recordedTrips.reduce((acc, curr) => acc + curr.savingsBd, 0);

  // Speed Tiers calculation for selected trip (or average of all)
  const speedTiers = useMemo(() => {
    return [
      { range: '< 30 km/h (City / Stop & Go)', pct: 28, distanceKm: (totalKmDriven * 0.28).toFixed(1) },
      { range: '30 - 60 km/h (Urban)', pct: 34, distanceKm: (totalKmDriven * 0.34).toFixed(1) },
      { range: '60 - 90 km/h (Arterial)', pct: 22, distanceKm: (totalKmDriven * 0.22).toFixed(1) },
      { range: '90 - 120 km/h (Highway)', pct: 13, distanceKm: (totalKmDriven * 0.13).toFixed(1) },
      { range: '> 120 km/h (High Speed)', pct: 3, distanceKm: (totalKmDriven * 0.03).toFixed(1) }
    ];
  }, [totalKmDriven]);

  // Forecast calculation with aerodynamic drag law
  const forecastResult = useMemo(() => {
    // Jetour G700: ~3.5 km per kWh electric, ~7.5 L/100km engine cruise
    // Speed drag multiplier
    const speedMult =
      forecastRouteType === 'city' ? 0.85 : forecastRouteType === 'mixed' ? 1.0 : 1.25;
    const electricAvailableKwh = Math.max(0, ((forecastStartSoc - forecastHoldSoc) / 100) * 19.5); // 19.5 kWh usable pack
    const electricKm = Math.min(forecastDistKm, electricAvailableKwh * (3.8 / speedMult));
    const engineKm = Math.max(0, forecastDistKm - electricKm);

    const baseFuelRate = forecastRouteType === 'city' ? 6.8 : forecastRouteType === 'highway' ? 8.2 : 7.4;
    const fuelL = (engineKm * (baseFuelRate * speedMult)) / 100;
    const standardFuelL = (forecastDistKm * fuelLedger.standardL100km) / 100;
    const currentPrice = fuelLedger.rates[fuelLedger.rates.length - 1]?.pricePerLitre || 0.200;
    const estSavings = Math.max(0, (standardFuelL - fuelL) * currentPrice);
    const endSoc = Math.max(forecastHoldSoc, forecastStartSoc - (electricKm / (3.8 / speedMult) / 19.5) * 100);

    return {
      electricKm: Math.round(electricKm * 10) / 10,
      engineKm: Math.round(engineKm * 10) / 10,
      fuelUsedL: Math.round(fuelL * 10) / 10,
      estSavingsBd: Math.round(estSavings * 100) / 100,
      endSoc: Math.round(endSoc)
    };
  }, [forecastDistKm, forecastStartSoc, forecastRouteType, forecastHoldSoc, fuelLedger]);

  // Export CSV handler
  const handleExportCsv = () => {
    let csv =
      'start_time,end_time,duration_min,moving_min,distance_km,avg_kmh,max_kmh,soc_start,soc_end,fuel_start,fuel_end,fuel_used_l,savings_bd\n';
    recordedTrips.forEach(tr => {
      csv += `${new Date(tr.startMs).toISOString()},${new Date(tr.endMs).toISOString()},${tr.durationMin},${
        tr.movingMin
      },${tr.distKm},${tr.avgSpeedKmh},${tr.maxSpeedKmh},${tr.socStart},${tr.socEnd},${tr.fuelStart},${
        tr.fuelEnd
      },${tr.fuelUsedL},${tr.savingsBd}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MyDash_trips_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111722] rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              My Trips & Analysis
              {isRecordingTrip && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  REC LIVE
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                'High-precision vehicle telemetry, powertrain recording & route forecasting',
                'تسجيل القيادة واستهلاك الطاقة المباشر وتحليل الرحلات والتنبؤ بالمسافات'
              )}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#17202d] rounded-xl border border-white/10 p-1 text-xs">
          {[
            { id: 'live', label: 'Live Dashboard', labelAr: 'اللوحة الحية' },
            { id: 'history', label: 'Trip History', labelAr: 'سجل الرحلات' },
            { id: 'analysis', label: 'Deep Analysis', labelAr: 'التحليل المتعمق' },
            { id: 'forecast', label: 'Route Forecast', labelAr: 'تنبؤ المسافات' },
            { id: 'cloud', label: 'G700 Cloud', labelAr: 'سحابة G700' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isArabic ? tab.labelAr : tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: LIVE COCKPIT & TRIP RECORDER */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Main Gauges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Speed Gauge */}
            <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold">{t('VEHICLE SPEED', 'سرعة السيارة')}</span>
                <span className="font-mono text-teal-400">GEAR {telemetry.gear}</span>
              </div>
              <div className="my-4 text-center">
                <span className="text-6xl font-black font-mono text-white tracking-tight">
                  {Math.round(telemetry.speedKmh)}
                </span>
                <span className="text-sm text-slate-400 block font-bold">KM/H</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-400 h-full transition-all duration-150"
                  style={{ width: `${Math.min(100, (telemetry.speedKmh / 180) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Tachometer / RPM */}
            <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold">{t('ENGINE / MOTOR', 'دورة المحرك')}</span>
                <span className="font-mono text-amber-400">{telemetry.driveMode.toUpperCase()}</span>
              </div>
              <div className="my-4 text-center">
                <span className="text-5xl font-black font-mono text-white tracking-tight">
                  {telemetry.rpm.toLocaleString()}
                </span>
                <span className="text-sm text-slate-400 block font-bold">RPM</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-150"
                  style={{ width: `${Math.min(100, (telemetry.rpm / 6000) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Battery SoC & Range */}
            <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold">{t('HYBRID BATTERY', 'بطارية الهايبرد')}</span>
                <span className="font-mono text-emerald-400">{telemetry.batteryRangeKm} KM EST</span>
              </div>
              <div className="my-4 text-center">
                <span className="text-5xl font-black font-mono text-emerald-400 tracking-tight">
                  {telemetry.batterySocPct}
                  <span className="text-2xl text-slate-400">%</span>
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  {telemetry.batteryPowerKw > 0
                    ? `⚡ +${telemetry.batteryPowerKw} kW output`
                    : `🔋 ${telemetry.batteryPowerKw} kW regen`}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-150"
                  style={{ width: `${telemetry.batterySocPct}%` }}
                ></div>
              </div>
            </div>

            {/* Fuel Level & Range */}
            <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold">{t('FUEL TANK', 'خزان الوقود')}</span>
                <span className="font-mono text-sky-400">{telemetry.fuelRangeKm} KM EST</span>
              </div>
              <div className="my-4 text-center">
                <span className="text-5xl font-black font-mono text-sky-400 tracking-tight">
                  {telemetry.fuelPct}
                  <span className="text-2xl text-slate-400">%</span>
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Combined Range: {telemetry.batteryRangeKm + telemetry.fuelRangeKm} KM
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full transition-all duration-150"
                  style={{ width: `${telemetry.fuelPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Active Trip Recording Banner & Controls */}
          <div className="p-6 rounded-2xl bg-[#111722] border border-white/10 flex flex-wrap items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isRecordingTrip ? 'bg-red-500 animate-ping' : 'bg-slate-600'
                  }`}
                ></span>
                <h3 className="text-base font-bold text-white">
                  {isRecordingTrip ? t('Trip in Progress', 'الرحلة قيد التسجيل') : t('Trip Recorder', 'مسجل الرحلات')}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {isRecordingTrip
                  ? t(
                      'Recording instantaneous speed, electric pack integration, and fuel consumption.',
                      'يتم تسجيل السرعة الآنية وتكامل طاقة البطارية واستهلاك الوقود.'
                    )
                  : t(
                      `Trip mode is ${tripMode.toUpperCase()}. Press Start Trip to begin recording manual drive telemetry.`,
                      `وضع التسجيل: ${tripMode === 'manual' ? 'يدوي' : 'تلقائي'}. اضغط بدء لبدء تسجيل القيادة.`
                    )}
              </p>
            </div>

            {/* Current Active Trip Live Telemetry */}
            {isRecordingTrip && activeTrip && (
              <div className="flex flex-wrap items-center gap-6 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('DISTANCE', 'المسافة')}</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {(activeTrip.distKm || 0).toFixed(2)} km
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('DURATION', 'المدة')}</span>
                  <span className="text-lg font-mono font-bold text-teal-300">
                    {(activeTrip.durationMin || 0).toFixed(1)} min
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('AVG SPEED', 'معدل السرعة')}</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {Math.round(activeTrip.avgSpeedKmh || 0)} km/h
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('MAX SPEED', 'أعلى سرعة')}</span>
                  <span className="text-lg font-mono font-bold text-amber-300">
                    {Math.round(activeTrip.maxSpeedKmh || 0)} km/h
                  </span>
                </div>
              </div>
            )}

            {/* Start / Stop Button */}
            <div className="flex items-center gap-3">
              {isRecordingTrip ? (
                <button
                  onClick={stopTrip}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  {t('End & Save Trip', 'إنهاء وحفظ الرحلة')}
                </button>
              ) : (
                <button
                  onClick={startTrip}
                  className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t('Start Trip Now', 'بدء الرحلة الآن')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRIP HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter & Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111722] rounded-xl border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 font-medium">{t('Filter Distance:', 'تصفية المسافة:')}</span>
              {(['all', 'under10', '10to30', '30to60', '60plus'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDistanceFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    distanceFilter === f
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-[#17202d] text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all'
                    ? 'All'
                    : f === 'under10'
                    ? '< 10 km'
                    : f === '10to30'
                    ? '10-30 km'
                    : f === '30to60'
                    ? '30-60 km'
                    : '60+ km'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">
                Storage: 1.4 MB / {tripStorageLimitMb} MB
              </span>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-lg bg-[#17202d] hover:bg-[#202b3c] border border-white/10 text-teal-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {t('Export CSV', 'تصدير CSV')}
              </button>
            </div>
          </div>

          {/* Trips Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111722]">
            <table className="w-full text-left rtl:text-right text-xs text-slate-200">
              <thead className="bg-[#161d29] text-[11px] text-slate-400 border-b border-white/10 uppercase tracking-wider font-mono">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Avg / Max Speed</th>
                  <th className="p-3">SoC Change</th>
                  <th className="p-3">Fuel Used</th>
                  <th className="p-3">Estimated Saving</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTrips.map(tr => (
                  <tr
                    key={tr.id}
                    onClick={() => setSelectedTripId(tr.id)}
                    className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      selectedTripId === tr.id ? 'bg-teal-500/10' : ''
                    }`}
                  >
                    <td className="p-3 font-mono">
                      <div className="font-bold text-white">{new Date(tr.startMs).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tr.startMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-white">{tr.distKm.toFixed(1)} km</td>
                    <td className="p-3 font-mono text-slate-300">
                      {tr.durationMin} min <span className="text-[10px] text-slate-500">({tr.movingMin}m moving)</span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="text-white font-bold">{tr.avgSpeedKmh}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-amber-400">{tr.maxSpeedKmh} km/h</span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="text-emerald-400">{tr.socStart}%</span>
                      <span className="text-slate-500"> → </span>
                      <span className="text-emerald-300">{tr.socEnd}%</span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        (-{Math.max(0, tr.socStart - tr.socEnd)}%)
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sky-300 font-bold">{tr.fuelUsedL.toFixed(1)} L</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">
                      +{tr.savingsBd.toFixed(2)} {fuelLedger.currency}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteTrip(tr.id);
                        }}
                        className="p-1 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400"
                        title="Delete trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEEP ANALYSIS & INTERACTIVE EXPLORER */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Top Aggregate Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#111722] border border-white/10 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-teal-500/10 text-teal-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t('Total Recorded Distance', 'إجمالي المسافة')}</span>
                <span className="text-xl font-bold font-mono text-white">{totalKmDriven.toFixed(1)} KM</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111722] border border-white/10 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t('Total Fuel Burned', 'إجمالي استهلاك الوقود')}</span>
                <span className="text-xl font-bold font-mono text-white">{totalFuelUsed.toFixed(1)} LITRES</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111722] border border-white/10 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t('Accumulated Savings', 'إجمالي التوفير المالي')}</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  +{totalSavedBd.toFixed(2)} {fuelLedger.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Speed Tiers Breakdown Table */}
          <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              {t('Speed Tiers Distribution', 'توزيع فئات السرعة')}
            </h3>

            <div className="space-y-3">
              {speedTiers.map(tier => (
                <div key={tier.range} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>{tier.range}</span>
                    <span className="font-mono text-teal-300">
                      {tier.distanceKm} km ({tier.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#18212e] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${tier.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Explorer Simulation Chart */}
          <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Explorer</h3>
                <p className="text-xs text-slate-400">
                  {t('Distance on x-axis; switchable curves for SoC, Fuel, and Speed', 'المسافة على المحور الأفقي مع منحنيات البطارية والوقود والسرعة')}
                </p>
              </div>

              {/* Curve Toggles */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setShowSocCurve(!showSocCurve)}
                  className={`px-3 py-1 rounded-lg border font-medium transition-colors ${
                    showSocCurve ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-[#17202d] text-slate-500 border-white/10'
                  }`}
                >
                  ⚡ Battery SoC %
                </button>
                <button
                  onClick={() => setShowFuelCurve(!showFuelCurve)}
                  className={`px-3 py-1 rounded-lg border font-medium transition-colors ${
                    showFuelCurve ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-[#17202d] text-slate-500 border-white/10'
                  }`}
                >
                  ⛽ Cumulative Fuel
                </button>
                <button
                  onClick={() => setShowSpeedCurve(!showSpeedCurve)}
                  className={`px-3 py-1 rounded-lg border font-medium transition-colors ${
                    showSpeedCurve ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#17202d] text-slate-500 border-white/10'
                  }`}
                >
                  🚗 Vehicle Speed
                </button>
              </div>
            </div>

            {/* SVG Visual Explorer Graph */}
            <div className="h-56 w-full bg-[#0a0e16] rounded-xl border border-white/10 p-4 relative flex flex-col justify-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#1f2937" strokeDasharray="4" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#1f2937" strokeDasharray="4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#1f2937" strokeDasharray="4" />

                {/* Shaded Powertrain Bands (EV -> HEV -> Cruise) */}
                <rect x="0" y="0" width="180" height="150" fill="#10b981" opacity="0.08" />
                <rect x="180" y="0" width="320" height="150" fill="#3b82f6" opacity="0.06" />

                {/* 1. SoC Curve (Green) */}
                {showSocCurve && (
                  <path
                    d="M 0 20 Q 90 25, 180 85 T 320 110 T 500 115"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                )}

                {/* 2. Cumulative Fuel Curve (Sky Blue) */}
                {showFuelCurve && (
                  <path
                    d="M 0 145 L 180 145 Q 260 120, 350 90 T 500 60"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                )}

                {/* 3. Speed Profile Curve (Amber) */}
                {showSpeedCurve && (
                  <path
                    d="M 0 140 Q 40 70, 90 60 T 160 50 T 250 35 T 380 40 T 500 135"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="2"
                  />
                )}
              </svg>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-white/10">
                <span>0 KM (Start)</span>
                <span>EV Electric Driving Zone</span>
                <span>Hybrid ICE Cruising Zone</span>
                <span>{selectedTrip ? selectedTrip.distKm.toFixed(1) : '50'} KM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTE FORECAST */}
      {activeTab === 'forecast' && (
        <div className="p-6 rounded-2xl bg-[#111722] border border-white/10 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Route Energy & Fuel Forecast</h3>
            <p className="text-xs text-slate-400">
              {t(
                'Predict electric driving range, engine recharge behavior, and fuel cost for arbitrary distances.',
                'توقع مسافة القيادة الكهربائية واستهلاك المحرك والتكلفة المالية لأي مسافة محددة.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-300">
                  <span>Target Distance:</span>
                  <span className="font-mono text-teal-400 font-bold">{forecastDistKm} KM</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={5}
                  value={forecastDistKm}
                  onChange={e => setForecastDistKm(parseInt(e.target.value))}
                  className="w-full accent-teal-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-300">
                  <span>Starting Battery SoC:</span>
                  <span className="font-mono text-emerald-400 font-bold">{forecastStartSoc}%</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={100}
                  value={forecastStartSoc}
                  onChange={e => setForecastStartSoc(parseInt(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Route Profile:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'city', label: 'City (Under 60 km/h)' },
                    { id: 'mixed', label: 'Mixed (My Average)' },
                    { id: 'highway', label: 'Highway (100-120 km/h)' },
                    { id: 'average', label: 'Aggressive / High Speed' }
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => setForecastRouteType(r.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-colors ${
                        forecastRouteType === r.id
                          ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                          : 'bg-[#17202d] text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Forecast Outcome Output */}
            <div className="p-5 rounded-xl bg-[#0c1017] border border-teal-500/20 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider block">
                  Simulated Powertrain Forecast
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-[#141b26]">
                    <span className="text-slate-400">Pure Electric Range</span>
                    <span className="font-mono font-bold text-emerald-400">{forecastResult.electricKm} KM</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#141b26]">
                    <span className="text-slate-400">Hybrid / Engine Cruising</span>
                    <span className="font-mono font-bold text-sky-400">{forecastResult.engineKm} KM</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#141b26]">
                    <span className="text-slate-400">Total Fuel Needed</span>
                    <span className="font-mono font-bold text-amber-300">{forecastResult.fuelUsedL} LITRES</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#141b26]">
                    <span className="text-slate-400">Battery End SoC</span>
                    <span className="font-mono font-bold text-emerald-300">{forecastResult.endSoc}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center">
                <span className="text-[11px] text-emerald-300 block font-medium">Estimated Fuel Savings vs Petrol</span>
                <span className="text-xl font-mono font-black text-white">
                  +{forecastResult.estSavingsBd} {fuelLedger.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: G700 GROUP CLOUD */}
      {activeTab === 'cloud' && (
        <div className="p-6 rounded-2xl bg-[#111722] border border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">G700 Group Cloud Fleet Sync</h3>
              <p className="text-xs text-slate-400">
                {t(
                  'Upload finished trips without GPS over Wi-Fi to compare efficiency across G700 owners.',
                  'مزامنة الرحلات عبر الواي فاي لمقارنة كفاءة الاستهلاك بين ملاك جيتور G700.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#17202d] border border-white/5 space-y-2">
              <span className="text-slate-400 block">Cloud Status</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Relay Connected (Wi-Fi Only)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#17202d] border border-white/5 space-y-2">
              <span className="text-slate-400 block">Driver Profile</span>
              <span className="font-mono font-bold text-white">G700-Bahrain-01</span>
            </div>

            <div className="p-4 rounded-xl bg-[#17202d] border border-white/5 space-y-2">
              <span className="text-slate-400 block">Waiting Trips in Queue</span>
              <span className="font-mono font-bold text-teal-300">0 trips (All synchronized)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
