import React, { useEffect } from 'react';
import { VehicleProvider, useVehicle } from './context/VehicleContext';
import { EdgeDock } from './components/EdgeDock/EdgeDock';
import { VehicleHUD } from './components/HUD/VehicleHUD';
import { TripManager } from './components/Trips/TripManager';
import { DashDeckStudio } from './components/DashDeck/DashDeckStudio';
import { SettingsDashboard } from './components/Settings/SettingsDashboard';
import { AppStore } from './components/AppStore/AppStore';
import { WebInstaller } from './components/WebInstaller/WebInstaller';
import { SignalMonitorFull } from './components/SignalMonitor/SignalMonitorFull';
import {
  Car,
  TrendingUp,
  Gauge,
  Sliders,
  ShoppingBag,
  Usb,
  Radio,
  Globe,
  Bell
} from 'lucide-react';

const MainShell: React.FC = () => {
  const {
    telemetry,
    activeTab,
    setActiveTab,
    languageMode,
    setLanguageMode,
    isArabic,
    t,
    reminderSettings
  } = useVehicle();

  // Set HTML dir attribute for RTL when Arabic is active
  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
  }, [isArabic]);

  const navItems = [
    { id: 'hud', label: 'Live Cockpit', labelAr: 'قمرة القيادة', icon: Car },
    { id: 'trips', label: 'My Trips', labelAr: 'رحلاتي والتحليل', icon: TrendingUp },
    { id: 'dashdeck', label: 'DashDeck', labelAr: 'لوحة العدادات', icon: Gauge },
    { id: 'settings', label: 'Settings', labelAr: 'الإعدادات والتنبيهات', icon: Sliders },
    { id: 'store', label: 'App Store', labelAr: 'متجر التطبيقات', icon: ShoppingBag },
    { id: 'installer', label: 'WebUSB Installer', labelAr: 'تثبيت USB', icon: Usb },
    { id: 'signal_hunter', label: 'Signal Hunter', labelAr: 'صائد الإشارات', icon: Radio }
  ];

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30">
      {/* Automotive Top Status & Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0f141f]/95 border-b border-white/10 backdrop-blur-md shadow-md px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Vehicle Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black text-lg flex items-center justify-center font-mono shadow-md">
                M
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wide text-white leading-tight">
                  MyDash
                </span>
                <span className="text-[10px] text-teal-400 font-mono tracking-wider">
                  JETOUR G700 · AUTOLINK OS
                </span>
              </div>
            </div>

            {/* Live Vehicle Telemetry Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#161e2a] rounded-xl border border-white/10 text-xs font-mono">
              <span className="text-teal-300 font-bold">{Math.round(telemetry.speedKmh)} km/h</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-bold">GEAR {telemetry.gear}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">{telemetry.batterySocPct}% BATT</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400">{telemetry.fuelPct}% FUEL</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center overflow-x-auto gap-1 bg-[#141b26] p-1 rounded-2xl border border-white/5 text-xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isArabic ? item.labelAr : item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguageMode(isArabic ? 1 : 2)}
              className="px-2.5 py-1.5 rounded-xl bg-[#161e2a] hover:bg-[#202b3c] border border-white/10 text-xs font-bold text-teal-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle Language (English / العربية)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        {activeTab === 'hud' && <VehicleHUD />}
        {activeTab === 'trips' && <TripManager />}
        {activeTab === 'dashdeck' && <DashDeckStudio />}
        {activeTab === 'settings' && <SettingsDashboard />}
        {activeTab === 'store' && <AppStore />}
        {activeTab === 'installer' && <WebInstaller />}
        {activeTab === 'signal_hunter' && <SignalMonitorFull />}
      </main>

      {/* Floating MyDash Edge Dock (Always Available on Screen Edge) */}
      <EdgeDock />
    </div>
  );
};

export default function App() {
  return (
    <VehicleProvider>
      <MainShell />
    </VehicleProvider>
  );
}
