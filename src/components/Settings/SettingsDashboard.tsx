import React, { useState } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { audioSynthesizer } from '../../utils/audioSynthesizer';
import {
  Bell,
  DoorClosed,
  Volume2,
  Sliders,
  Globe,
  LayoutGrid,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Radio,
  ExternalLink,
  Trash2,
  Check
} from 'lucide-react';

export const SettingsDashboard: React.FC = () => {
  const {
    telemetry,
    updateTelemetry,
    reminderSettings,
    updateReminderSettings,
    drawerSettings,
    updateDrawerSettings,
    fuelLedger,
    updateFuelLedger,
    addFuelRate,
    removeFuelRate,
    resetFuelData,
    tripMode,
    setTripMode,
    tripStorageLimitMb,
    setTripStorageLimitMb,
    languageMode,
    setLanguageMode,
    isArabic,
    t,
    isDevUnlocked,
    unlockDev,
    lockDev,
    triggerSimulation,
    stopSimulation,
    isSimulating,
    setActiveTab
  } = useVehicle();

  // Accordion state for reminders
  const [beltExpanded, setBeltExpanded] = useState(true);
  const [driveExpanded, setDriveExpanded] = useState(true);
  const [doorExpanded, setDoorExpanded] = useState(true);
  const [fuelPanelExpanded, setFuelPanelExpanded] = useState(false);
  const [tripPanelExpanded, setTripPanelExpanded] = useState(false);

  // Dev tap counter
  const [tapCount, setTapCount] = useState(0);

  // New rate modal or inline add
  const [newRatePrice, setNewRatePrice] = useState('0.210');

  const handleVersionTap = () => {
    if (isDevUnlocked) return;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 10) {
      unlockDev();
      setTapCount(0);
    }
  };

  const tonesBelt = ['Marimba strike', 'Soft bell ping', 'Digital beeps'];
  const tonesDrive = ['Triple chime (default)', 'Rising chime', 'Falling chime'];
  const hornsAjar = ['Sedan horn', 'Whistle · Swoop', 'Whistle · Chirp', 'Whistle · Trill'];

  return (
    <div className="space-y-6">
      {/* Settings Top Header */}
      <div className="flex items-center justify-between p-4 bg-[#111722] rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t('Vehicle Reminders & Diagnostics Settings', 'إعدادات تنبيهات وتشخيص المركبة')}
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                'Jetour G700 Head Unit Configuration · Landscape 2-Column Layout',
                'لوحة تحكم شاشة جيتور G700 · واجهة أفقية بعمودين'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Landscape Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: USER & DRIVER SETTINGS */}
        {/* ========================================================= */}
        <div className="space-y-5">
          {/* 1. Trip Recording Mode & Storage Panel */}
          <div className="bg-[#111722] rounded-2xl border border-white/10 overflow-hidden shadow-lg">
            <button
              onClick={() => setTripPanelExpanded(!tripPanelExpanded)}
              className="w-full p-4 flex items-center justify-between text-left rtl:text-right hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-teal-400 font-bold text-xs uppercase tracking-wider font-mono">
                  {t('TRIP SETTINGS', 'إعدادات الرحلات')}
                </span>
                <span className="text-xs text-slate-400">
                  ({tripMode === 'manual' ? t('Manual Start', 'يدوي') : t('Automatic Start/End', 'تلقائي')})
                </span>
              </div>
              {tripPanelExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {tripPanelExpanded && (
              <div className="p-4 pt-0 border-t border-white/5 space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-2">{t('Trip Recording Mode:', 'وضع تسجيل الرحلة:')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTripMode('manual')}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                        tripMode === 'manual'
                          ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                          : 'bg-[#17202d] text-slate-400 border-white/10'
                      }`}
                    >
                      {t('Manual Start', 'تشغيل يدوي')}
                    </button>
                    <button
                      onClick={() => setTripMode('auto')}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                        tripMode === 'auto'
                          ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                          : 'bg-[#17202d] text-slate-400 border-white/10'
                      }`}
                    >
                      {t('Automatic (Gear D/R)', 'تلقائي (عند القيادة)')}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>{t('Trip Storage Limit:', 'حد تخزين الرحلات:')}</span>
                    <span className="font-mono text-teal-300 font-bold">{tripStorageLimitMb} MB</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={500}
                    step={10}
                    value={tripStorageLimitMb}
                    onChange={e => setTripStorageLimitMb(parseInt(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Fuel Cost Ledger Panel */}
          <div className="bg-[#111722] rounded-2xl border border-white/10 overflow-hidden shadow-lg">
            <button
              onClick={() => setFuelPanelExpanded(!fuelPanelExpanded)}
              className="w-full p-4 flex items-center justify-between text-left rtl:text-right hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                  {t('FUEL COST & LEDGER', 'تكلفة الوقود والتسعير')}
                </span>
                <span className="text-xs text-slate-400">
                  ({fuelLedger.rates[fuelLedger.rates.length - 1]?.pricePerLitre.toFixed(3)} {fuelLedger.currency}/L)
                </span>
              </div>
              {fuelPanelExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {fuelPanelExpanded && (
              <div className="p-4 pt-0 border-t border-white/5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{t('Standard Consumption (Savings Baseline):', 'الاستهلاك القياسي لحساب التوفير:')}</span>
                  <div className="flex items-center gap-1 font-mono text-white">
                    <input
                      type="number"
                      step={0.1}
                      value={fuelLedger.standardL100km}
                      onChange={e => updateFuelLedger({ standardL100km: parseFloat(e.target.value) || 11.0 })}
                      className="w-16 bg-[#17202d] border border-white/10 rounded px-2 py-1 text-right text-teal-300 font-bold"
                    />
                    <span>L/100km</span>
                  </div>
                </div>

                {/* Rates List */}
                <div className="space-y-2">
                  <span className="text-slate-400 block font-medium">{t('Fuel Rates History:', 'تاريخ تسعيرة الوقود:')}</span>
                  {fuelLedger.rates.map(rate => (
                    <div key={rate.id} className="flex items-center justify-between p-2 rounded-lg bg-[#17202d] border border-white/5">
                      <span className="font-mono text-slate-300">{rate.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {rate.pricePerLitre.toFixed(3)} {fuelLedger.currency}/L
                        </span>
                        {fuelLedger.rates.length > 1 && (
                          <button
                            onClick={() => removeFuelRate(rate.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="0.215"
                      value={newRatePrice}
                      onChange={e => setNewRatePrice(e.target.value)}
                      className="w-24 bg-[#17202d] border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-white"
                    />
                    <button
                      onClick={() => {
                        const p = parseFloat(newRatePrice);
                        if (p > 0) addFuelRate(new Date().toISOString().slice(0, 10), p);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors cursor-pointer"
                    >
                      + {t('Add Rate', 'إضافة تسعيرة')}
                    </button>
                    <button
                      onClick={resetFuelData}
                      className="ml-auto text-slate-500 hover:text-red-400 underline text-[11px]"
                    >
                      {t('Reset Fuel Data', 'تصفير البيانات')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Reminder Settings: Seat Belt, Door in D/R, Door Ajar */}
          <div className="space-y-4">
            <span className="text-teal-400 font-bold text-xs uppercase tracking-wider font-mono block px-1">
              {t('REMINDER SETTINGS', 'إعدادات التنبيهات')}
            </span>

            {/* Seat Belt Reminder */}
            <div className="p-4 rounded-2xl bg-[#111722] border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔔</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{t('Seat Belt Reminder', 'تنبيه حزام الأمان')}</h4>
                    <p className="text-[11px] text-slate-400">
                      {t('Alert if front passenger or driver is unbuckled while moving > 35 km/h.', 'تنبيه إذا كان الحزام غير مربوط أثناء القيادة بسرعة أعلى من 35 كم/س.')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.beltOn}
                  onChange={e => updateReminderSettings({ beltOn: e.target.checked })}
                  className="rounded accent-teal-400 w-5 h-5 cursor-pointer"
                />
              </div>

              {reminderSettings.beltOn && (
                <div className="pt-3 border-t border-white/10 space-y-3 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">{t('Audio alert (Cabin speakers)', 'تنبيه صوتي (سماعات المقصورة)')}</span>
                    <input
                      type="checkbox"
                      checked={reminderSettings.beltAudio}
                      onChange={e => updateReminderSettings({ beltAudio: e.target.checked })}
                      className="rounded accent-teal-400 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Tone Picker */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">{t('TONE SELECTION:', 'نغمة التنبيه:')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {tonesBelt.map((tName, idx) => (
                        <button
                          key={tName}
                          onClick={() => {
                            updateReminderSettings({ beltTone: idx });
                            audioSynthesizer.playSeatBelt(idx, 2, reminderSettings.beltVol);
                          }}
                          className={`p-2 rounded-xl border text-center font-medium transition-all ${
                            reminderSettings.beltTone === idx
                              ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                              : 'bg-[#17202d] text-slate-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {tName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Volume:</span>
                      <span className="font-mono text-teal-300 font-bold">{reminderSettings.beltVol}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={reminderSettings.beltVol}
                      onChange={e => updateReminderSettings({ beltVol: parseInt(e.target.value) })}
                      onMouseUp={() => audioSynthesizer.playSeatBelt(reminderSettings.beltTone, 2, reminderSettings.beltVol)}
                      className="w-full accent-teal-400"
                    />
                  </div>

                  {/* Duration Slider */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Alert Duration:</span>
                      <span className="font-mono text-teal-300 font-bold">{reminderSettings.beltMinutes} minutes</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={reminderSettings.beltMinutes}
                      onChange={e => updateReminderSettings({ beltMinutes: parseInt(e.target.value) })}
                      className="w-full accent-teal-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Door Open in D/R Reminder */}
            <div className="p-4 rounded-2xl bg-[#111722] border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🚪</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{t('Door Open in D/R Reminder', 'تنبيه الباب المفتوح في D أو R')}</h4>
                    <p className="text-[11px] text-slate-400">
                      {t('Chime alert and on-screen banner when any door or trunk is open in D or R.', 'جرس تحذيري وشريط أحمر فوري عند فتح أي باب أو الصندوق في وضع الحركة.')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.driveOn}
                  onChange={e => updateReminderSettings({ driveOn: e.target.checked })}
                  className="rounded accent-teal-400 w-5 h-5 cursor-pointer"
                />
              </div>

              {reminderSettings.driveOn && (
                <div className="pt-3 border-t border-white/10 space-y-3 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">{t('Audio alert (Cabin speakers)', 'تنبيه صوتي')}</span>
                    <input
                      type="checkbox"
                      checked={reminderSettings.driveAudio}
                      onChange={e => updateReminderSettings({ driveAudio: e.target.checked })}
                      className="rounded accent-teal-400 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Tone Picker */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">{t('CHIME TONE:', 'نغمة الجرس:')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {tonesDrive.map((tName, idx) => (
                        <button
                          key={tName}
                          onClick={() => {
                            updateReminderSettings({ driveTone: idx });
                            audioSynthesizer.playDoorOpenDrive(idx, reminderSettings.driveVol);
                          }}
                          className={`p-2 rounded-xl border text-center font-medium transition-all ${
                            reminderSettings.driveTone === idx
                              ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                              : 'bg-[#17202d] text-slate-300 border-white/10'
                          }`}
                        >
                          {tName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Volume:</span>
                      <span className="font-mono text-teal-300 font-bold">{reminderSettings.driveVol}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={reminderSettings.driveVol}
                      onChange={e => updateReminderSettings({ driveVol: parseInt(e.target.value) })}
                      onMouseUp={() => audioSynthesizer.playDoorOpenDrive(reminderSettings.driveTone, reminderSettings.driveVol)}
                      className="w-full accent-teal-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Door Ajar Reminder (Outside Horn) */}
            <div className="p-4 rounded-2xl bg-[#111722] border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔓</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{t('Door Ajar Reminder (Parked)', 'تذكير الباب الموارب أثناء الوقوف')}</h4>
                    <p className="text-[11px] text-slate-400">
                      {t('Loud horn blasts through outside speaker and hazard flash if left open.', 'منبه قوي عبر السماعة الخارجية وفلاش الرباعي إذا نُسي الباب مفتوحاً.')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.doorOn}
                  onChange={e => updateReminderSettings({ doorOn: e.target.checked })}
                  className="rounded accent-teal-400 w-5 h-5 cursor-pointer"
                />
              </div>

              {reminderSettings.doorOn && (
                <div className="pt-3 border-t border-white/10 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Remind after:</span>
                      <span className="font-mono text-teal-300 font-bold">{reminderSettings.doorSecs} seconds</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={reminderSettings.doorSecs}
                      onChange={e => updateReminderSettings({ doorSecs: parseInt(e.target.value) })}
                      className="w-full accent-teal-400"
                    />
                  </div>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">{t('Flash hazard lights too', 'تشغيل إشارات الطوارئ (الرباعي)')}</span>
                    <input
                      type="checkbox"
                      checked={reminderSettings.doorHazard}
                      onChange={e => updateReminderSettings({ doorHazard: e.target.checked })}
                      className="rounded accent-teal-400 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Horn selection */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">{t('HORN SOUND:', 'صوت المنبه:')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {hornsAjar.map((hName, idx) => (
                        <button
                          key={hName}
                          onClick={() => {
                            updateReminderSettings({ hornType: idx });
                            audioSynthesizer.playDoorAjarHorn(idx, 2, reminderSettings.outVol);
                          }}
                          className={`p-2 rounded-xl border text-center font-medium transition-all ${
                            reminderSettings.hornType === idx
                              ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                              : 'bg-[#17202d] text-slate-300 border-white/10'
                          }`}
                        >
                          {hName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Test button */}
                  <button
                    onClick={() => audioSynthesizer.playDoorAjarHorn(reminderSettings.hornType, 3, reminderSettings.outVol)}
                    className="w-full py-2.5 rounded-xl bg-[#17202d] hover:bg-[#202b3c] border border-white/10 text-teal-300 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    {t('Test Outside Speaker Sound', 'تجربة صوت السماعة الخارجية')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. Language Selector */}
          <div className="p-4 rounded-2xl bg-[#111722] border border-white/10 space-y-3 shadow-md">
            <span className="text-teal-400 font-bold text-xs uppercase tracking-wider font-mono block">
              {t('LANGUAGE', 'اللغة')}
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 0, label: 'Auto (Follow car)', labelAr: 'تلقائي' },
                { id: 1, label: 'English', labelAr: 'English' },
                { id: 2, label: 'العربية', labelAr: 'العربية' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setLanguageMode(item.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    languageMode === item.id
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-[#17202d] text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {isArabic ? item.labelAr : item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Drawer Settings: Side & Auto-hide */}
          <div className="p-4 rounded-2xl bg-[#111722] border border-white/10 space-y-3 shadow-md">
            <span className="text-teal-400 font-bold text-xs uppercase tracking-wider font-mono block">
              {t('DRAWER CONFIGURATION', 'إعدادات الدرج')}
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1.5">{t('Drawer Screen Side:', 'جهة الدرج:')}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => updateDrawerSettings({ side: 'left' })}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      drawerSettings.side === 'left'
                        ? 'bg-teal-500 text-slate-950 border-teal-400'
                        : 'bg-[#17202d] text-slate-400 border-white/10'
                    }`}
                  >
                    {t('Left Hand', 'يسار')}
                  </button>
                  <button
                    onClick={() => updateDrawerSettings({ side: 'right' })}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      drawerSettings.side === 'right'
                        ? 'bg-teal-500 text-slate-950 border-teal-400'
                        : 'bg-[#17202d] text-slate-400 border-white/10'
                    }`}
                  >
                    {t('Right Hand', 'يمين')}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1.5">
                  <span>Auto-hide Timer:</span>
                  <span className="font-mono text-teal-300 font-bold">{drawerSettings.autoHideSecs}s</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={30}
                  value={drawerSettings.autoHideSecs}
                  onChange={e => updateDrawerSettings({ autoHideSecs: parseInt(e.target.value) })}
                  className="w-full accent-teal-400 mt-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: DEBUG & DIAGNOSTICS / PERMISSIONS & UPDATES */}
        {/* ========================================================= */}
        <div className="space-y-5">
          {/* Permissions & Updates Status Card */}
          <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {t('Permissions & Updates Status', 'حالة الصلاحيات والتحديث')}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                HEALTHY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: 'Draw over other apps (SYSTEM_ALERT_WINDOW)', status: 'Granted' },
                { name: 'Usage access (GET_USAGE_STATS)', status: 'Granted' },
                { name: 'Install updates (REQUEST_INSTALL_PACKAGES)', status: 'Granted' },
                { name: 'Start with the car (Notification Listener)', status: 'Granted' },
                { name: 'Keep running in background (Battery whitelist)', status: 'Exempted' },
                { name: 'DashBar services (Alerts & Dock watchdog)', status: 'Active (Running)' }
              ].map(row => (
                <div
                  key={row.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#17202d] border border-white/5"
                >
                  <span className="text-slate-300">{row.name}</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Version line & 10-tap unlock */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <button
                  onClick={handleVersionTap}
                  className="text-left rtl:text-right text-xs font-mono text-slate-400 hover:text-teal-300 transition-colors select-none"
                >
                  Version v1.0.64 (Build 164)
                  {!isDevUnlocked && tapCount > 2 && (
                    <span className="block text-[10px] text-teal-400 font-sans">
                      {10 - tapCount} more taps to unlock developer options
                    </span>
                  )}
                  {isDevUnlocked && (
                    <span className="block text-[10px] text-amber-400 font-sans font-bold">
                      ● Developer options unlocked
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => alert('DashBar is on the newest stable version (v1.0.64).')}
                className="px-3.5 py-1.5 rounded-xl bg-[#17202d] hover:bg-[#202b3c] border border-white/10 text-teal-300 text-xs font-bold transition-colors cursor-pointer"
              >
                {t('Check for updates', 'التحقق من التحديثات')}
              </button>
            </div>
          </div>

          {/* DEVELOPER OPTIONS SECTION (Unlocked after 10 taps) */}
          {isDevUnlocked ? (
            <>
              {/* Simulate Testing Scenarios */}
              <div className="p-5 rounded-2xl bg-[#111722] border border-amber-500/30 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    {t('Simulate Testing Scenarios', 'محاكاة حالات الاختبار')}
                  </h3>
                  {isSimulating && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      SIMULATING (15s)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  {t(
                    'Each scenario overrides the car\'s signals for 15 seconds so you can verify alerts without driving.',
                    'كل سيناريو يفرض إشارات وهمية لمدة 15 ثانية لاختبار التنبيهات دون الحاجة للقيادة.'
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => triggerSimulation('door')}
                    className="p-2.5 rounded-xl bg-[#17202d] hover:bg-amber-950/30 border border-white/10 hover:border-amber-400 text-white font-bold transition-all cursor-pointer"
                  >
                    {t('Simulate Door Open', 'محاكاة باب مفتوح')}
                  </button>
                  <button
                    onClick={() => triggerSimulation('belt')}
                    className="p-2.5 rounded-xl bg-[#17202d] hover:bg-amber-950/30 border border-white/10 hover:border-amber-400 text-white font-bold transition-all cursor-pointer"
                  >
                    {t('Simulate Unbuckled Belt', 'محاكاة حزام غير مربوط')}
                  </button>
                  <button
                    onClick={() => triggerSimulation('speed')}
                    className="p-2.5 rounded-xl bg-[#17202d] hover:bg-amber-950/30 border border-white/10 hover:border-amber-400 text-white font-bold transition-all cursor-pointer"
                  >
                    {t('Simulate Speed > 10 km/h', 'محاكاة سرعة > 10')}
                  </button>
                </div>

                {isSimulating && (
                  <button
                    onClick={stopSimulation}
                    className="w-full py-2 rounded-xl bg-red-950/40 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-900/50 transition-colors"
                  >
                    {t('Stop Simulation Now', 'إيقاف المحاكاة الآن')}
                  </button>
                )}
              </div>

              {/* Live Signal Monitor Summary & Full Monitor Link */}
              <div className="p-5 rounded-2xl bg-[#111722] border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-teal-400" />
                    {t('Live Signal Monitor', 'مراقب الإشارات الحي')}
                  </h3>
                  <button
                    onClick={() => setActiveTab('signal_hunter')}
                    className="text-xs text-teal-400 hover:text-teal-300 underline font-medium"
                  >
                    {t('Open Full Signal Hunter →', 'فتح أداة البحث عن الإشارات ←')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-[#17202d] rounded-lg flex justify-between">
                    <span className="text-slate-400">LHFDOORSTS (FL)</span>
                    <span className={telemetry.doors.fl ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {telemetry.doors.fl ? '1 (OPEN)' : '0 (CLOSED)'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#17202d] rounded-lg flex justify-between">
                    <span className="text-slate-400">RHFDOORSTS (FR)</span>
                    <span className={telemetry.doors.fr ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {telemetry.doors.fr ? '1 (OPEN)' : '0 (CLOSED)'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#17202d] rounded-lg flex justify-between">
                    <span className="text-slate-400">PLG_LATCHSTS (Trunk)</span>
                    <span className={telemetry.doors.trunk ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {telemetry.doors.trunk ? '0 (OPEN)' : '2 (CLOSED)'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#17202d] rounded-lg flex justify-between">
                    <span className="text-slate-400">LHFSEATBELTSW</span>
                    <span className={telemetry.seatbelts.driver ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                      {telemetry.seatbelts.driver ? '1 (FASTENED)' : '0 (UNFASTENED)'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={lockDev}
                  className="w-full py-2 rounded-xl bg-[#17202d] hover:bg-white/5 border border-white/10 text-slate-400 text-xs font-medium"
                >
                  {t('Hide Developer Options', 'إخفاء خيارات المطور')}
                </button>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-2xl bg-[#111722]/50 border border-white/5 text-center text-xs text-slate-500 space-y-1">
              <p>{t('Developer & Diagnostics options are hidden.', 'خيارات المطور والتشخيص مخفية.')}</p>
              <p className="text-[11px] text-slate-600">
                {t('Tap the version text 10 times to reveal simulation and signal tools.', 'اضغط على رقم الإصدار 10 مرات لإظهار أدوات المحاكاة والإشارات.')}
              </p>
            </div>
          )}

          {/* Uninstall & Legal Notice */}
          <div className="p-4 rounded-2xl bg-[#111722] border border-white/10 space-y-3">
            <button
              onClick={() => {
                if (confirm('Reset DashBar settings and restore defaults?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
            >
              {t('Reset DashBar Settings', 'إعادة تعيين إعدادات DashBar')}
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed font-mono">
              DashBar v1.0.64 · © 2026 Abduljalil Alyusif. All rights reserved.
              <br />
              Not affiliated with Jetour, Chery, or Autolink.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
