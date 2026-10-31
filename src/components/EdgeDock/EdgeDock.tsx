import React, { useState, useEffect, useRef } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { AppFavorite, DisplayTarget } from '../../types';
import {
  ExternalLink,
  Settings as SettingsIcon,
  Plus,
  X,
  Layers,
  ArrowRightLeft,
  Tv,
  Check,
  Smartphone,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const EdgeDock: React.FC = () => {
  const {
    drawerSettings,
    favorites,
    addFavorite,
    updateFavorite,
    removeFavorite,
    isDrawerOpen,
    setIsDrawerOpen,
    runningApps,
    launchApp,
    closeApp,
    closeAllApps,
    toggleAppDisplay,
    setActiveTab,
    t,
    isArabic
  } = useVehicle();

  const [isEditing, setIsEditing] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'grid' | 'running' | 'all_apps'>('grid');
  const [runningFilter, setRunningFilter] = useState<'favorites' | 'other'>('favorites');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [countdownPercent, setCountdownPercent] = useState(100);

  // Chooser modal for "Ask me every time"
  const [askChooserApp, setAskChooserApp] = useState<AppFavorite | null>(null);

  // Drag and drop / target display picker
  const [editingTargetApp, setEditingTargetApp] = useState<AppFavorite | null>(null);

  const autoHideTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Auto-hide timer logic (counts down from 100% to 0% over drawerSettings.autoHideSecs)
  const resetAutoHide = () => {
    if (isEditing || askChooserApp || showAddModal || editingTargetApp) return;

    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setCountdownPercent(100);
    const totalMs = drawerSettings.autoHideSecs * 1000;
    const intervalMs = 50;
    let elapsed = 0;

    countdownIntervalRef.current = window.setInterval(() => {
      elapsed += intervalMs;
      const left = Math.max(0, 100 - (elapsed / totalMs) * 100);
      setCountdownPercent(left);
      if (left <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }
    }, intervalMs);

    autoHideTimerRef.current = window.setTimeout(() => {
      setIsDrawerOpen(false);
    }, totalMs);
  };

  const pauseAutoHide = () => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  useEffect(() => {
    if (isDrawerOpen) {
      resetAutoHide();
    } else {
      setIsEditing(false);
      setActiveSubView('grid');
      setAskChooserApp(null);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isDrawerOpen, isEditing, drawerSettings.autoHideSecs]);

  // Max slots according to gridIdx: 0: 2x2 (4), 1: 3x2 (6, default), 2: 3x3 (9), 3: 2x3 (6)
  const maxSlots = drawerSettings.gridIdx === 0 ? 4 : drawerSettings.gridIdx === 2 ? 9 : 6;
  const gridColsClass =
    drawerSettings.gridIdx === 0
      ? 'grid-cols-2'
      : drawerSettings.gridIdx === 2
      ? 'grid-cols-3'
      : drawerSettings.gridIdx === 3
      ? 'grid-cols-2'
      : 'grid-cols-3';

  const handleSlotClick = (fav: AppFavorite) => {
    if (isEditing) {
      setEditingTargetApp(fav);
      return;
    }
    if (fav.displayTarget === 'ask') {
      setAskChooserApp(fav);
    } else {
      launchApp({
        name: fav.name,
        packageName: fav.packageName,
        icon: fav.icon,
        displayTarget: fav.displayTarget
      });
    }
  };

  // Pre-defined app catalog to pick from when adding an app
  const availableAppsToPick = [
    { name: 'Apple CarPlay', nameAr: 'أبل كاربلاي', packageName: 'com.apple.carplay', icon: '🍎', color: '#64748b' },
    { name: 'Android Auto', nameAr: 'أندرويد أوتو', packageName: 'com.google.android.projection.gearhead', icon: '⚡', color: '#0284c7' },
    { name: 'Display Mirror', nameAr: 'مرآة الشاشة', packageName: 'com.autolink.mirror', icon: '📱', color: '#3b82f6' },
    { name: 'Google Maps', nameAr: 'خرائط جوجل', packageName: 'com.google.android.apps.maps', icon: '🗺️', color: '#10b981' },
    { name: 'Spotify Music', nameAr: 'سبوتيفاي', packageName: 'com.spotify.music', icon: '🎵', color: '#22c55e' },
    { name: 'YouTube Music', nameAr: 'يوتيوب ميوزك', packageName: 'com.google.android.apps.youtube.music', icon: '🎧', color: '#ef4444' },
    { name: 'Waze Navigation', nameAr: 'ويز ملاحة', packageName: 'com.waze', icon: '🚗', color: '#06b6d4' },
    { name: 'Aptoide Store', nameAr: 'متجر أبتويد', packageName: 'cm.aptoide.pt', icon: '🏪', color: '#f97316' },
    { name: 'Radio & Media', nameAr: 'الراديو والوسائط', packageName: 'com.autolink.media', icon: '📻', color: '#8b5cf6' },
    { name: 'DashCam Viewer', nameAr: 'كاميرا الداش كام', packageName: 'com.autolink.dvr', icon: '📹', color: '#eab308' },
    { name: 'Telegram', nameAr: 'تيليجرام', packageName: 'org.telegram.messenger', icon: '✈️', color: '#0284c7' },
    { name: 'Jetour Car Home', nameAr: 'الصفحة الرئيسية', packageName: 'com.jetour.carhome', icon: '🚘', color: '#6366f1' }
  ];

  const handleSelectAppToAdd = (app: typeof availableAppsToPick[0]) => {
    addFavorite({
      name: app.name,
      nameAr: app.nameAr,
      packageName: app.packageName,
      icon: app.icon,
      displayTarget: 'display0',
      color: app.color
    });
    setShowAddModal(false);
  };

  const isLeft = drawerSettings.side === 'left';

  return (
    <>
      {/* 1. Edge Tab Button (Sticky to screen edge) */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          isLeft ? 'left-0' : 'right-0'
        } top-1/2 -translate-y-1/2`}
        style={{ transform: `translateY(calc(-50% + ${drawerSettings.tabHeightOffset}px))` }}
      >
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`flex items-center gap-1.5 py-4 px-2 bg-[#121820]/95 hover:bg-[#1a232e] text-teal-400 border border-teal-500/30 backdrop-blur-md shadow-2xl transition-all duration-200 cursor-pointer group ${
            isLeft ? 'rounded-r-2xl border-l-0 pl-1.5' : 'rounded-l-2xl border-r-0 pr-1.5'
          }`}
          title={isArabic ? 'فتح درج التطبيقات MyDash' : 'Open MyDash Dock'}
        >
          {/* Bahrain flag emblem accent stripe */}
          <div className="w-1.5 h-8 rounded-full overflow-hidden flex flex-col border border-white/20">
            <div className="h-1/2 bg-red-600"></div>
            <div className="h-1/2 bg-white"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-sm tracking-widest text-teal-300 font-mono">M</span>
            {isLeft ? (
              <ChevronRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-teal-400 group-hover:-translate-x-0.5 transition-transform" />
            )}
          </div>
        </button>
      </div>

      {/* 2. Floating Quick-Launch Drawer */}
      {isDrawerOpen && (
        <div
          className={`fixed z-50 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
            isLeft ? 'left-4' : 'right-4'
          } w-[360px] sm:w-[420px] max-w-[92vw] bg-[#0f141c]/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden flex flex-col`}
          onMouseEnter={pauseAutoHide}
          onMouseLeave={resetAutoHide}
          onTouchStart={pauseAutoHide}
          onTouchEnd={resetAutoHide}
        >
          {/* Top auto-hide progress bar */}
          <div className="h-1 bg-slate-800/80 w-full overflow-hidden">
            <div
              className="h-full bg-teal-400 transition-all duration-75 ease-linear"
              style={{ width: `${countdownPercent}%` }}
            ></div>
          </div>

          {/* Drawer Header */}
          <div className="p-4 pb-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm border border-teal-500/30">
                M
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide text-white">MyDash Dock</h3>
                <p className="text-[11px] text-slate-400">
                  {activeSubView === 'grid'
                    ? isEditing
                      ? t('Drag & drop or tap to edit', 'اسحب للترتيب أو اضغط للتعديل')
                      : t('Quick-launch favorite apps', 'تشغيل سريع للتطبيقات المفضلة')
                    : activeSubView === 'running'
                    ? t('Running apps & processes', 'التطبيقات والمهام الجارية')
                    : t('All installed apps', 'جميع التطبيقات المثبتة')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[65vh]">
            {activeSubView === 'grid' && (
              <>
                {/* Favorites Grid */}
                <div className={`grid ${gridColsClass} gap-2.5`}>
                  {Array.from({ length: maxSlots }).map((_, idx) => {
                    const fav = favorites[idx];
                    if (fav) {
                      return (
                        <div
                          key={fav.id}
                          onClick={() => handleSlotClick(fav)}
                          className={`relative group flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none min-h-[92px] ${
                            isEditing
                              ? 'border-dashed border-teal-500/50 bg-teal-950/20 hover:bg-teal-900/30'
                              : 'border-white/10 bg-[#161d27] hover:bg-[#1e2735] hover:border-teal-500/40 active:scale-95 shadow-md'
                          }`}
                        >
                          {/* Display Target Badge */}
                          {fav.displayTarget !== 'display0' && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-black/60 text-teal-300 border border-teal-500/30">
                              {fav.displayTarget === 'display5'
                                ? 'D5'
                                : fav.displayTarget === 'both'
                                ? 'D0+5'
                                : 'ASK'}
                            </span>
                          )}

                          {/* Delete badge in edit mode */}
                          {isEditing && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                removeFavorite(fav.id);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 shadow-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                            {fav.icon}
                          </span>
                          <span className="text-xs font-semibold text-center text-slate-200 line-clamp-1">
                            {isArabic && fav.nameAr ? fav.nameAr : fav.name}
                          </span>
                          {isEditing && (
                            <span className="text-[10px] text-teal-400 mt-0.5">
                              {t('Change Display', 'تغيير الشاشة')}
                            </span>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <button
                          key={`empty-${idx}`}
                          onClick={() => {
                            setSelectedSlotIndex(idx);
                            setShowAddModal(true);
                          }}
                          className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] hover:border-teal-500/50 text-slate-400 hover:text-teal-300 transition-all cursor-pointer min-h-[92px]"
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">{t('+ Add app', '+ أضف تطبيقاً')}</span>
                        </button>
                      );
                    }
                  })}
                </div>
              </>
            )}

            {activeSubView === 'running' && (
              <div className="space-y-3">
                {/* Filter buttons: Favorites / Other apps */}
                <div className="flex bg-[#161d27] p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setRunningFilter('favorites')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      runningFilter === 'favorites' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {t('Favorites', 'المفضلة')} ({runningApps.filter(r => r.isFavorite).length})
                  </button>
                  <button
                    onClick={() => setRunningFilter('other')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      runningFilter === 'other' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {t('Other Apps', 'أخرى')} ({runningApps.filter(r => !r.isFavorite).length})
                  </button>
                </div>

                {/* Running apps list */}
                <div className="space-y-2">
                  {runningApps
                    .filter(r => (runningFilter === 'favorites' ? r.isFavorite : !r.isFavorite))
                    .map(app => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#161d27] border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{app.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {app.name}
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {app.currentDisplay === 'display5' ? 'Running on Display 5' : 'Running on Display 0'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {app.isFavorite && (
                            <button
                              onClick={() => toggleAppDisplay(app.id)}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20"
                              title={t('Toggle Display 0 / Display 5', 'التبديل بين الشاشة 0 والشاشة 5')}
                            >
                              {app.currentDisplay === 'display0'
                                ? t('Send to D5', 'نقل للشاشة 5')
                                : t('Return to D0', 'إعادة للشاشة 0')}
                            </button>
                          )}
                          <button
                            onClick={() => closeApp(app.id)}
                            className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                            title={t('Close App', 'إغلاق التطبيق')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {runningApps.filter(r => (runningFilter === 'favorites' ? r.isFavorite : !r.isFavorite)).length ===
                    0 && (
                    <div className="p-6 text-center text-xs text-slate-500">
                      {t('No running apps under this filter.', 'لا توجد تطبيقات جارية تحت هذا التصنيف.')}
                    </div>
                  )}
                </div>

                {runningApps.length > 0 && (
                  <button
                    onClick={() => closeAllApps(runningFilter === 'favorites')}
                    className="w-full py-2 rounded-xl text-xs font-medium text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 transition-colors"
                  >
                    {t('Close All', 'إغلاق الكل')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Drawer Bottom Navigation Bar */}
          <div className="p-3 bg-[#0a0d13] border-t border-white/10 flex items-center justify-between gap-1 text-[11px] font-semibold">
            {activeSubView === 'grid' ? (
              <>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveTab('store');
                  }}
                  className="flex-1 py-2 px-1 text-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  {t('ALL APPS', 'التطبيقات')}
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex-1 py-2 px-1 text-center rounded-lg transition-colors ${
                    isEditing ? 'bg-teal-500 text-slate-950 font-bold' : 'hover:bg-white/10 text-teal-400'
                  }`}
                >
                  {isEditing ? t('DONE', 'تم') : t('EDIT FAVORITES', 'تعديل المفضلة')}
                </button>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveTab('settings');
                  }}
                  className="flex-1 py-2 px-1 text-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  {t('SETTINGS', 'الإعدادات')}
                </button>
                <button
                  onClick={() => setActiveSubView('running')}
                  className="flex-1 py-2 px-1 text-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors relative"
                >
                  {t('RUNNING APPS', 'الجارية')}
                  {runningApps.length > 0 && (
                    <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveSubView('grid')}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-center"
              >
                ← {t('Back to Favorites Grid', 'العودة لشبكة المفضلة')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Chooser Modal when "Ask me every time" is selected */}
      {askChooserApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-teal-500/30 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4">
            <span className="text-4xl">{askChooserApp.icon}</span>
            <h4 className="font-bold text-lg text-white">
              {isArabic && askChooserApp.nameAr ? askChooserApp.nameAr : askChooserApp.name}
            </h4>
            <p className="text-xs text-slate-400">
              {t('Choose which display to open this app on:', 'اختر الشاشة التي ترغب بتشغيل هذا التطبيق عليها:')}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  launchApp({
                    name: askChooserApp.name,
                    packageName: askChooserApp.packageName,
                    icon: askChooserApp.icon,
                    displayTarget: 'display0'
                  });
                  setAskChooserApp(null);
                }}
                className="p-3.5 rounded-xl bg-[#1b2330] hover:bg-teal-500 hover:text-slate-950 font-bold text-xs border border-white/10 transition-all flex flex-col items-center gap-1.5"
              >
                <Smartphone className="w-5 h-5" />
                <span>Display 0</span>
                <span className="text-[10px] font-normal opacity-75">{t('Center Console', 'الشاشة الوسطية')}</span>
              </button>

              <button
                onClick={() => {
                  launchApp({
                    name: askChooserApp.name,
                    packageName: askChooserApp.packageName,
                    icon: askChooserApp.icon,
                    displayTarget: 'display5'
                  });
                  setAskChooserApp(null);
                }}
                className="p-3.5 rounded-xl bg-[#1b2330] hover:bg-teal-500 hover:text-slate-950 font-bold text-xs border border-white/10 transition-all flex flex-col items-center gap-1.5"
              >
                <Tv className="w-5 h-5" />
                <span>Display 5</span>
                <span className="text-[10px] font-normal opacity-75">{t('Passenger Screen', 'شاشة الراكب')}</span>
              </button>
            </div>

            <button
              onClick={() => setAskChooserApp(null)}
              className="text-xs text-slate-400 hover:text-white pt-2"
            >
              {t('Cancel', 'إلغاء')}
            </button>
          </div>
        </div>
      )}

      {/* 4. Display Target Configuration Modal (Edit Mode) */}
      {editingTargetApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingTargetApp.icon}</span>
                <h4 className="font-bold text-sm text-white">
                  {isArabic && editingTargetApp.nameAr ? editingTargetApp.nameAr : editingTargetApp.name}
                </h4>
              </div>
              <button onClick={() => setEditingTargetApp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {t('Which display should this favorite run on?', 'على أي شاشة يجب تشغيل هذا التطبيق؟')}
            </p>

            <div className="space-y-2">
              {[
                { key: 'display0', label: 'Display 0 (Default - Center Screen)', labelAr: 'الشاشة 0 (الافتراضي - الشاشة الرئيسية)' },
                { key: 'display5', label: 'Display 5 (Passenger Display)', labelAr: 'الشاشة 5 (شاشة الراكب)' },
                { key: 'both', label: 'Both Displays (D0 + D5)', labelAr: 'كلا الشاشتين (0 و 5 معاً)' },
                { key: 'ask', label: 'Ask me every time (Chooser)', labelAr: 'اسألني في كل مرة (نافذة اختيار)' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    updateFavorite(editingTargetApp.id, { displayTarget: opt.key as DisplayTarget });
                    setEditingTargetApp(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left rtl:text-right text-xs font-medium border flex items-center justify-between transition-all ${
                    editingTargetApp.displayTarget === opt.key
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-white/10 bg-[#161d27] hover:bg-[#1f2937] text-slate-200'
                  }`}
                >
                  <span>{isArabic ? opt.labelAr : opt.label}</span>
                  {editingTargetApp.displayTarget === opt.key && <Check className="w-4 h-4 text-teal-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base text-white">{t('Add to Favorites', 'إضافة إلى المفضلة')}</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {t('Select an installed application to add to your quick-launch dock:', 'اختر تطبيقاً لإضافته إلى درج التشغيل السريع:')}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {availableAppsToPick
                .filter(app => !favorites.some(f => f.packageName === app.packageName))
                .map(app => (
                  <button
                    key={app.packageName}
                    onClick={() => handleSelectAppToAdd(app)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#17202c] hover:bg-[#1f2b3b] border border-white/5 hover:border-teal-500/40 text-left rtl:text-right transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">
                        {isArabic && app.nameAr ? app.nameAr : app.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.packageName}</div>
                    </div>
                    <Plus className="w-4 h-4 text-teal-400 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
