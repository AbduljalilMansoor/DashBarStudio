import React, { useState, useEffect, useRef } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { DashDeckWidgetConfig } from '../../types';
import { calculatePrayers, CITY_PRESETS } from '../../utils/prayerCalculator';
import { fetchWeather, WeatherData } from '../../utils/weatherService';
import { audioSynthesizer } from '../../utils/audioSynthesizer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Volume2,
  Palette,
  Check,
  Layers,
  Fuel,
  Compass,
  Gauge,
  CloudSun,
  Eye,
  Sliders
} from 'lucide-react';

const DEFAULT_WIDGETS: DashDeckWidgetConfig[] = [
  {
    id: 'w_bg',
    type: 'background',
    col: 0,
    row: 0,
    cols: 35,
    rows: 5,
    settings: {
      preset: 'cyber_grid',
      opacity: 0.35
    }
  },
  {
    id: 'w_fuel_cost',
    type: 'fuel_cost',
    col: 1,
    row: 1,
    cols: 12,
    rows: 3,
    settings: {
      vertical: false,
      showOdo: true,
      transparentBg: false
    }
  },
  {
    id: 'w_prayer',
    type: 'prayer',
    col: 14,
    row: 1,
    cols: 9,
    rows: 3,
    settings: {
      cityIndex: 0, // Manama
      method: 0, // Ja'fari
      nextOnly: true,
      recording: 'aqsa',
      volume: 60
    }
  },
  {
    id: 'w_fuel_battery',
    type: 'fuel_battery',
    col: 24,
    row: 1,
    cols: 10,
    rows: 3,
    settings: {
      styleOption: 'B' // Option B: dual capsules
    }
  }
];

export const DashDeckStudio: React.FC = () => {
  const { telemetry, fuelLedger, t, isArabic } = useVehicle();

  // Saved / Deployed layout state
  const [widgets, setWidgets] = useState<DashDeckWidgetConfig[]>(() => {
    const saved = localStorage.getItem('mydash_dashdeck_widgets') || localStorage.getItem('dashbar_dashdeck_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });

  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1x to 4x
  const [theme, setTheme] = useState<'classic' | 'glass' | 'minimal'>('glass');
  const [arabicWidgetText, setArabicWidgetText] = useState(false);
  const [isDeployed, setIsDeployed] = useState(true);

  // Weather state for preview
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Editing dialog state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeConfigWidget, setActiveConfigWidget] = useState<DashDeckWidgetConfig | null>(null);

  // Dragging / Moving state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number; col: number; row: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial weather for Manama
    fetchWeather(26.2285, 50.586).then(setWeatherData);
  }, []);

  const saveLayout = (newWidgets: DashDeckWidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('mydash_dashdeck_widgets', JSON.stringify(newWidgets));
    setIsDeployed(true);
  };

  const handleAddWidget = (type: DashDeckWidgetConfig['type']) => {
    const newWidget: DashDeckWidgetConfig = {
      id: 'w_' + Date.now(),
      type,
      col: 2,
      row: 1,
      cols: type === 'fuel_cost' ? 12 : type === 'prayer' ? 9 : type === 'background' ? 35 : 8,
      rows: type === 'background' ? 5 : 3,
      settings:
        type === 'fuel_cost'
          ? { vertical: false, showOdo: true, transparentBg: false }
          : type === 'prayer'
          ? { cityIndex: 0, method: 0, nextOnly: true, recording: 'aqsa', volume: 60 }
          : type === 'fuel_battery'
          ? { styleOption: 'B' }
          : type === 'rpm_power'
          ? { styleOption: 'A' }
          : type === 'background'
          ? { preset: 'cyber_grid', opacity: 0.4 }
          : {}
    };

    saveLayout([...widgets, newWidget]);
    setSelectedWidgetId(newWidget.id);
  };

  const handleDeleteWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    saveLayout(updated);
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);

  // Calculations for Fuel Cost widget
  const currentPrice = fuelLedger.rates[fuelLedger.rates.length - 1]?.pricePerLitre || 0.200;
  const totalLitres = fuelLedger.totalLitresCounted + fuelLedger.previousConsumptionLitres;
  const totalValue = totalLitres * currentPrice + fuelLedger.previousConsumptionValue;
  const drivenDistance = (telemetry.odometerKm - fuelLedger.initialOdometerKm) + fuelLedger.previousConsumptionDistanceKm;
  const totalSavings = Math.max(
    0,
    ((fuelLedger.standardL100km * drivenDistance) / 100 - totalLitres) * currentPrice +
      fuelLedger.previousConsumptionSavings
  );

  // Calculations for Prayer Times widget
  const prayerResult = calculatePrayers(26.2285, 50.586, 0);

  // Theme styling generator
  const getThemeClasses = (isTransparent?: boolean) => {
    if (isTransparent) return 'bg-transparent border border-white/10';
    if (theme === 'glass') {
      return 'bg-[#0f172a]/75 backdrop-blur-md border border-white/15 shadow-xl';
    }
    if (theme === 'minimal') {
      return 'bg-[#0a0f18]/90 border border-teal-500/20';
    }
    return 'bg-[#141b26] border border-white/10 shadow-md'; // Classic
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111722] rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              DashDeck Studio
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Display 2 (4032 × 284)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                'Digital instrument cluster overlay designer · 35 columns × 5 rows grid',
                'مصمم لوحة العدادات الرقمية للسيارة · شبكة 35 عموداً × 5 صفوف'
              )}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#17202d] rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-slate-200">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Theme selector */}
          <div className="flex items-center bg-[#17202d] rounded-xl border border-white/10 p-1">
            {(['glass', 'classic', 'minimal'] as const).map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                  theme === th ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {th}
              </button>
            ))}
          </div>

          {/* Arabic widget text toggle */}
          <button
            onClick={() => setArabicWidgetText(!arabicWidgetText)}
            className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition-colors ${
              arabicWidgetText
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-[#17202d] text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <span className="font-bold">عربي</span>
            <span className="text-[11px]">{arabicWidgetText ? 'مفعّل' : 'معطّل'}</span>
          </button>

          {/* Deploy / Revert */}
          <button
            onClick={() => saveLayout(widgets)}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {t('Deploy to Car', 'تطبيق على السيارة')}
          </button>

          <button
            onClick={() => saveLayout(DEFAULT_WIDGETS)}
            className="p-2 rounded-xl bg-[#17202d] hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title={t('Reset to Defaults', 'إعادة ضبط للافتراضي')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulator Viewport (The Ultra-wide 4032 x 284 Instrument Cluster Canvas) */}
      <div className="relative overflow-x-auto overflow-y-hidden p-4 bg-[#090d14] rounded-2xl border border-white/10 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span>INSTRUMENT DISPLAY 2 (ULTRA-WIDE 4032 × 284 px)</span>
          <span className="text-teal-400">
            {isDeployed ? '● DEPLOYED OVERLAY ACTIVE' : '○ DRAFT EDITING'}
          </span>
        </div>

        {/* Scaled simulator container */}
        <div
          ref={containerRef}
          className="relative rounded-xl border border-teal-500/30 overflow-hidden shadow-inner bg-black select-none transition-all duration-150"
          style={{
            width: `${1200 * zoomLevel}px`,
            height: `${140 * zoomLevel}px`
          }}
        >
          {/* Background Layer Widget */}
          {widgets.map(w => {
            if (w.type !== 'background') return null;
            const bgImg =
              w.settings.preset === 'bahrain_flag'
                ? '/deckbg/bahrain_flag.jpg'
                : w.settings.preset === 'contour_gold'
                ? '/deckbg/contour_gold.jpg'
                : w.settings.preset === 'light_streaks'
                ? '/deckbg/light_streaks.jpg'
                : '/deckbg/cyber_grid.jpg';

            return (
              <div
                key={w.id}
                className="absolute inset-0 pointer-events-none bg-cover bg-center transition-opacity"
                style={{
                  backgroundImage: `url(${bgImg})`,
                  opacity: w.settings.opacity ?? 0.35
                }}
              />
            );
          })}

          {/* 35 x 5 Grid Overlay guide lines */}
          <div className="absolute inset-0 grid grid-cols-35 grid-rows-5 pointer-events-none opacity-15">
            {Array.from({ length: 35 * 5 }).map((_, i) => (
              <div key={i} className="border-r border-b border-teal-500/40"></div>
            ))}
          </div>

          {/* Interactive Widgets Rendering */}
          {widgets.map(w => {
            if (w.type === 'background') return null;
            const isSelected = selectedWidgetId === w.id;
            const leftPct = (w.col / 35) * 100;
            const topPct = (w.row / 5) * 100;
            const widthPct = (w.cols / 35) * 100;
            const heightPct = (w.rows / 5) * 100;

            return (
              <div
                key={w.id}
                onClick={() => setSelectedWidgetId(w.id)}
                className={`absolute rounded-xl transition-shadow cursor-pointer flex flex-col justify-center overflow-hidden p-2 select-none ${getThemeClasses(
                  w.settings.transparentBg
                )} ${
                  isSelected
                    ? 'ring-2 ring-teal-400 shadow-2xl z-20'
                    : 'hover:ring-1 hover:ring-teal-500/50 z-10'
                }`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`
                }}
              >
                {/* 1. Fuel Cost Widget */}
                {w.type === 'fuel_cost' && (
                  <div className={`flex items-center justify-around h-full gap-2 text-center text-slate-100 ${w.settings.vertical ? 'flex-col' : 'flex-row'}`}>
                    {/* SAVED Pill with Leaf */}
                    <div className="flex-1 px-2 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold text-emerald-400 tracking-wider flex items-center gap-0.5">
                        🍃 {arabicWidgetText ? 'الموفر' : 'SAVED'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-white">
                        {totalSavings.toFixed(2)} {fuelLedger.currency}
                      </span>
                    </div>

                    {/* VALUE Pill */}
                    <div className="flex-1 px-2 py-1 bg-[#1a2332]/60 border border-white/10 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                        {arabicWidgetText ? 'القيمة' : 'VALUE'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-white">
                        {totalValue.toFixed(2)} {fuelLedger.currency}
                      </span>
                    </div>

                    {/* FUEL Pill */}
                    <div className="flex-1 px-2 py-1 bg-[#1a2332]/60 border border-white/10 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                        {arabicWidgetText ? 'الوقود' : 'FUEL'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-white">
                        {totalLitres.toFixed(1)} L
                      </span>
                    </div>

                    {/* ODO Pill */}
                    {w.settings.showOdo && (
                      <div className="flex-1 px-2 py-1 bg-[#1a2332]/60 border border-white/10 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                          {arabicWidgetText ? 'العداد' : 'ODO'}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-white">
                          {telemetry.odometerKm.toLocaleString()} KM
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Prayer Times Widget */}
                {w.type === 'prayer' && (
                  <div className="flex flex-col justify-center h-full text-slate-100 px-2">
                    {w.settings.nextOnly ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-teal-400" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-teal-300 font-bold uppercase tracking-wider">
                              {arabicWidgetText ? prayerResult.nextPrayerNameAr : prayerResult.nextPrayerName}
                            </span>
                            <span className="text-xs font-mono font-extrabold text-white">
                              {prayerResult.times[prayerResult.nextPrayerIndex]}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[8px] text-slate-400 block">
                            {arabicWidgetText ? 'متبقي' : 'TIME LEFT'}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {prayerResult.formattedCountdown}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-center text-[10px]">
                        {prayerResult.visibleIndices.map(pIdx => (
                          <div key={pIdx} className="flex flex-col">
                            <span className="text-[8px] text-slate-400">
                              {arabicWidgetText ? prayerResult.namesAr[pIdx] : prayerResult.names[pIdx]}
                            </span>
                            <span className="font-mono font-bold text-white">{prayerResult.times[pIdx]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Fuel & Battery Widget */}
                {w.type === 'fuel_battery' && (
                  <div className="flex items-center justify-around h-full px-2 gap-2 text-slate-100">
                    {w.settings.styleOption === 'A' ? (
                      <div className="w-full flex items-center justify-between px-3 py-1 bg-teal-950/40 border border-teal-500/30 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🔋</span>
                          <span className="text-xs font-mono font-bold text-teal-300">
                            {telemetry.batterySocPct}%
                          </span>
                        </div>
                        <div className="text-xs font-mono font-extrabold text-white">
                          {telemetry.batteryRangeKm + telemetry.fuelRangeKm} KM
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {telemetry.fuelPct}%
                          </span>
                          <span className="text-sm">⛽</span>
                        </div>
                      </div>
                    ) : (
                      // Option B: Dual Capsules
                      <>
                        <div className="flex-1 flex items-center justify-between px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
                          <span className="text-xs">⚡</span>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-400 block font-bold">
                              {telemetry.batterySocPct}%
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {telemetry.batteryRangeKm} KM
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 flex items-center justify-between px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg">
                          <span className="text-xs">⛽</span>
                          <div className="text-right">
                            <span className="text-[9px] text-amber-400 block font-bold">
                              {telemetry.fuelPct}%
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {telemetry.fuelRangeKm} KM
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 4. RPM / Power Widget */}
                {w.type === 'rpm_power' && (
                  <div className="flex items-center justify-around h-full px-3 text-slate-100">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-teal-400" />
                      <div>
                        <span className="text-[9px] text-slate-400 block">
                          {arabicWidgetText ? 'القدرة' : 'POWER'}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {telemetry.batteryPowerKw} kW
                        </span>
                      </div>
                    </div>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">
                        {arabicWidgetText ? 'دورة/دقيقة' : 'RPM'}
                      </span>
                      <span className="text-xs font-mono font-bold text-teal-300">
                        {telemetry.rpm.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. Weather Widget */}
                {w.type === 'weather' && weatherData && (
                  <div className="flex items-center justify-between h-full px-3 text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{weatherData.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-white">
                          {arabicWidgetText ? weatherData.conditionAr : weatherData.condition}
                        </span>
                        <span className="text-[9px] text-slate-400 block">Manama, Bahrain</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-extrabold text-white">
                        {weatherData.tempC}°C
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {weatherData.windSpeedKmh} km/h wind
                      </span>
                    </div>
                  </div>
                )}

                {/* Resize handle in bottom-right */}
                {isSelected && (
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      // Toggle width
                      const newCols = w.cols >= 16 ? 8 : w.cols + 2;
                      setWidgets(prev =>
                        prev.map(item => (item.id === w.id ? { ...item, cols: newCols } : item))
                      );
                    }}
                    className="absolute bottom-0 right-0 p-1 bg-teal-400 text-slate-950 rounded-tl cursor-se-resize shadow"
                    title="Click to expand/shrink width"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Widget Management & Preset Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Widget Library */}
        <div className="p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-400" />
              {t('Add Widget to Cluster', 'إضافة أداة للشاشة')}
            </h3>
            <span className="text-[11px] text-slate-400">
              {widgets.length} {t('placed', 'مضافة')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleAddWidget('fuel_cost')}
              className="p-3 rounded-xl bg-[#17202d] hover:bg-[#1e2a3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Fuel className="w-4 h-4 text-emerald-400" />
                <span>{t('Fuel Cost', 'تكلفة الوقود')}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {t('Saved leaf, value, fuel litres, ODO', 'الموفر، القيمة، اللترات، العداد')}
              </span>
            </button>

            <button
              onClick={() => handleAddWidget('prayer')}
              className="p-3 rounded-xl bg-[#17202d] hover:bg-[#1e2a3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Compass className="w-4 h-4 text-teal-400" />
                <span>{t('Prayer Times', 'أوقات الصلاة')}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {t('Ja\'fari / MWL, countdown & takbeer', 'الجعفري / الرابطة، متبقي والتكبير')}
              </span>
            </button>

            <button
              onClick={() => handleAddWidget('fuel_battery')}
              className="p-3 rounded-xl bg-[#17202d] hover:bg-[#1e2a3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>{t('Fuel & Battery', 'الوقود والبطارية')}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {t('Dual capsules or combined range', 'كبسولتين أو المدى المزدوج')}
              </span>
            </button>

            <button
              onClick={() => handleAddWidget('rpm_power')}
              className="p-3 rounded-xl bg-[#17202d] hover:bg-[#1e2a3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>{t('RPM / Power', 'دورة المحرك / القدرة')}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {t('kW gauge & tachometer dial', 'عداد كيلوواط وسرعة الدوران')}
              </span>
            </button>

            <button
              onClick={() => handleAddWidget('weather')}
              className="p-3 rounded-xl bg-[#17202d] hover:bg-[#1e2a3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <CloudSun className="w-4 h-4 text-sky-400" />
                <span>{t('Weather', 'الطقس')}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {t('Open-Meteo current condition', 'حالة الطقس المباشرة')}
              </span>
            </button>

            <button
              onClick={() => handleAddWidget('background')}
              className="p-3 rounded-xl bg-[#17202d] hover:bg-[#1e2a3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>{t('Background Wallpaper', 'خلفية الشاشة')}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {t('Cyber grid, Gold, Bahrain flag', 'الشبكة السيبرانية، ذهبي، البحرين')}
              </span>
            </button>
          </div>
        </div>

        {/* Center: Selected Widget Settings */}
        <div className="p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              {t('Widget Settings', 'إعدادات الأداة المحددة')}
            </h3>
            {selectedWidget && (
              <button
                onClick={() => handleDeleteWidget(selectedWidget.id)}
                className="p-1.5 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-950/60 transition-colors"
                title={t('Delete Widget', 'حذف الأداة')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedWidget ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#17202d] border border-white/5">
                <span className="text-slate-300 font-medium">Type:</span>
                <span className="font-mono font-bold text-teal-300 uppercase">{selectedWidget.type}</span>
              </div>

              {/* Grid Placement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Column (0..34):</label>
                  <input
                    type="number"
                    min={0}
                    max={34}
                    value={selectedWidget.col}
                    onChange={e => {
                      const v = Math.max(0, Math.min(34, parseInt(e.target.value) || 0));
                      setWidgets(prev =>
                        prev.map(item => (item.id === selectedWidget.id ? { ...item, col: v } : item))
                      );
                    }}
                    className="w-full bg-[#17202d] border border-white/10 rounded-xl px-3 py-1.5 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Row (0..4):</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={selectedWidget.row}
                    onChange={e => {
                      const v = Math.max(0, Math.min(4, parseInt(e.target.value) || 0));
                      setWidgets(prev =>
                        prev.map(item => (item.id === selectedWidget.id ? { ...item, row: v } : item))
                      );
                    }}
                    className="w-full bg-[#17202d] border border-white/10 rounded-xl px-3 py-1.5 font-mono text-white"
                  />
                </div>
              </div>

              {/* Specific Widget Type Controls */}
              {selectedWidget.type === 'fuel_cost' && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Show Odometer (ODO)</span>
                    <input
                      type="checkbox"
                      checked={selectedWidget.settings.showOdo ?? true}
                      onChange={e => {
                        const val = e.target.checked;
                        setWidgets(prev =>
                          prev.map(w =>
                            w.id === selectedWidget.id
                              ? { ...w, settings: { ...w.settings, showOdo: val } }
                              : w
                          )
                        );
                      }}
                      className="rounded accent-teal-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Transparent Background</span>
                    <input
                      type="checkbox"
                      checked={selectedWidget.settings.transparentBg ?? false}
                      onChange={e => {
                        const val = e.target.checked;
                        setWidgets(prev =>
                          prev.map(w =>
                            w.id === selectedWidget.id
                              ? { ...w, settings: { ...w.settings, transparentBg: val } }
                              : w
                          )
                        );
                      }}
                      className="rounded accent-teal-500 w-4 h-4"
                    />
                  </label>
                </div>
              )}

              {selectedWidget.type === 'prayer' && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Next prayer only layout</span>
                    <input
                      type="checkbox"
                      checked={selectedWidget.settings.nextOnly ?? true}
                      onChange={e => {
                        const val = e.target.checked;
                        setWidgets(prev =>
                          prev.map(w =>
                            w.id === selectedWidget.id
                              ? { ...w, settings: { ...w.settings, nextOnly: val } }
                              : w
                          )
                        );
                      }}
                      className="rounded accent-teal-500 w-4 h-4"
                    />
                  </label>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Athan Takbeer Audio:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setWidgets(prev =>
                            prev.map(w =>
                              w.id === selectedWidget.id
                                ? { ...w, settings: { ...w.settings, recording: 'aqsa' } }
                                : w
                            )
                          );
                          audioSynthesizer.playAthan('aqsa', 60);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 ${
                          selectedWidget.settings.recording === 'aqsa'
                            ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                            : 'bg-[#17202d] text-slate-300 border-white/10'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Aqsa (أقصى)</span>
                      </button>
                      <button
                        onClick={() => {
                          setWidgets(prev =>
                            prev.map(w =>
                              w.id === selectedWidget.id
                                ? { ...w, settings: { ...w.settings, recording: 'ali' } }
                                : w
                            )
                          );
                          audioSynthesizer.playAthan('ali', 60);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 ${
                          selectedWidget.settings.recording === 'ali'
                            ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                            : 'bg-[#17202d] text-slate-300 border-white/10'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ali (علي)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedWidget.type === 'background' && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="text-[11px] text-slate-400 block">Preset Background:</label>
                  <select
                    value={selectedWidget.settings.preset || 'cyber_grid'}
                    onChange={e => {
                      const v = e.target.value;
                      setWidgets(prev =>
                        prev.map(w =>
                          w.id === selectedWidget.id ? { ...w, settings: { ...w.settings, preset: v } } : w
                        )
                      );
                    }}
                    className="w-full bg-[#17202d] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                  >
                    <option value="cyber_grid">Cyber Grid (الشبكة السيبرانية)</option>
                    <option value="contour_gold">Contour Gold (الخطوط الكنتورية الذهبية)</option>
                    <option value="light_streaks">Light Streaks (أشعة الضوء)</option>
                    <option value="bahrain_flag">Bahrain Flag (علم البحرين)</option>
                  </select>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Opacity / Transparency:</span>
                      <span className="font-mono text-teal-400">
                        {Math.round((selectedWidget.settings.opacity ?? 0.35) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((selectedWidget.settings.opacity ?? 0.35) * 100)}
                      onChange={e => {
                        const val = parseInt(e.target.value) / 100;
                        setWidgets(prev =>
                          prev.map(w =>
                            w.id === selectedWidget.id
                              ? { ...w, settings: { ...w.settings, opacity: val } }
                              : w
                          )
                        );
                      }}
                      className="w-full accent-teal-400"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
              {t(
                'Click any placed widget in the simulator above to customize its properties.',
                'اضغط على أي أداة موضوعة في المحاكي أعلاه لتخصيص خياراتها.'
              )}
            </div>
          )}
        </div>

        {/* Right: Jetour G700 Head Unit Specifications */}
        <div className="p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-400" />
            {t('Cluster Display Info', 'معلومات شاشة العدادات')}
          </h3>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between p-2 rounded-lg bg-[#17202d]">
              <span className="text-slate-400">Resolution</span>
              <span className="font-mono font-bold text-teal-300">4032 × 284 px</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#17202d]">
              <span className="text-slate-400">Target Display</span>
              <span className="font-mono font-bold text-white">Display 2 (Cluster)</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#17202d]">
              <span className="text-slate-400">Grid Dimensions</span>
              <span className="font-mono font-bold text-white">35 columns × 5 rows</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#17202d]">
              <span className="text-slate-400">Refresh Cadence</span>
              <span className="font-mono font-bold text-white">1000 ms</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t(
              'DashDeck creates a transparent hardware-accelerated overlay above the car\'s digital speedometer and gauges. Changes apply immediately upon clicking "Deploy to Car".',
              'يقوم DashDeck برسم طبقة شفافة عالية الأداء فوق عدادات السيارة الأصلية. يتم حفظ ونشر التصميم فور الضغط على تطبيق.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
