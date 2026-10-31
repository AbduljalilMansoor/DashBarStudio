import React, { useState } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { StoreCatalogApp } from '../../types';
import {
  ShoppingBag,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Tv,
  Layers,
  Search,
  Sliders,
  Shield,
  Trash2,
  Check
} from 'lucide-react';

const INITIAL_CATALOG: StoreCatalogApp[] = [
  {
    name: 'DashBar Studio Official',
    package: 'com.dashbar.app',
    github: 'AbduljalilMansoor/dashbarstudio',
    description: 'Official DashBar Studio release with edge drawer, cluster widgets, and safety reminders.',
    auto: true,
    version: '1.0.64',
    installedVersion: '1.0.64'
  },
  {
    name: 'Aptoide Store',
    package: 'cm.aptoide.pt',
    aptoide: 'cm.aptoide.pt',
    description: 'Third-party Android automotive app store. Installs any Android app directly to head unit.',
    auto: false,
    version: '10.3.0',
    installedVersion: '10.3.0'
  },
  {
    name: 'Organic Maps',
    package: 'app.organicmaps',
    github: 'organicmaps/organicmaps',
    description: 'Fast, detailed offline maps for travelers and drivers. OpenStreetMap based.',
    auto: true,
    version: '2026.04.12',
    installedVersion: '2026.04.12'
  },
  {
    name: 'Spotify Car Experience',
    package: 'com.spotify.music',
    description: 'Music and podcasts streaming optimized for automotive landscape touchscreens.',
    auto: true,
    version: '8.9.8',
    installedVersion: '8.9.8'
  },
  {
    name: 'Waze Car Navigation',
    package: 'com.waze',
    description: 'Live community-based traffic, hazard alerts and road speed limits.',
    auto: true,
    version: '5.1.0',
    installedVersion: '5.1.0'
  },
  {
    name: 'Display Mirror (AirPlay/Cast)',
    package: 'com.autolink.mirror',
    description: 'Wireless screen mirroring tool for iOS and Android smartphones on head unit.',
    auto: true,
    version: '3.4.1',
    installedVersion: '3.4.1'
  }
];

export const AppStore: React.FC = () => {
  const { runningApps, launchApp, closeApp, favorites, t, isArabic } = useVehicle();

  const [activeTab, setActiveTab] = useState<'store' | 'all_apps'>('store');
  const [catalog, setCatalog] = useState<StoreCatalogApp[]>(INITIAL_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customRepo, setCustomRepo] = useState('');
  const [customName, setCustomName] = useState('');
  const [installProgress, setInstallProgress] = useState<Record<string, number>>({});

  const handleInstallOrUpdate = (app: StoreCatalogApp) => {
    // Simulate install progress
    setInstallProgress(prev => ({ ...prev, [app.package]: 10 }));
    const timer = setInterval(() => {
      setInstallProgress(prev => {
        const cur = prev[app.package] || 10;
        if (cur >= 100) {
          clearInterval(timer);
          setCatalog(existing =>
            existing.map(item =>
              item.package === app.package ? { ...item, installedVersion: item.version } : item
            )
          );
          return { ...prev, [app.package]: 100 };
        }
        return { ...prev, [app.package]: cur + 20 };
      });
    }, 200);
  };

  const handleAddCustomApp = () => {
    if (!customName || !customRepo) return;
    const newApp: StoreCatalogApp = {
      name: customName,
      package: 'com.custom.' + customName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      github: customRepo,
      description: `Installed from GitHub repository ${customRepo}`,
      auto: true,
      version: '1.0.0'
    };
    setCatalog(prev => [newApp, ...prev]);
    setShowAddCustomModal(false);
    setCustomName('');
    setCustomRepo('');
  };

  const filteredCatalog = catalog.filter(
    app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.package.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111722] rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              DashBar Store & App Library
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                GitHub & Aptoide Releases
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                'Install and update automotive applications directly from developers\' releases',
                'تثبيت وتحديث تطبيقات شاشة السيارة مباشرة من مستودعات المطورين'
              )}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#17202d] rounded-xl border border-white/10 p-1 text-xs">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'store'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('App Store Catalog', 'كتالوج المتجر')}
            </button>
            <button
              onClick={() => setActiveTab('all_apps')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'all_apps'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('All Installed Apps', 'جميع التطبيقات المثبتة')}
            </button>
          </div>

          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#17202d] hover:bg-[#202b3c] border border-white/10 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('+ Add from GitHub', '+ إضافة من GitHub')}
          </button>
        </div>
      </div>

      {/* TAB 1: STORE CATALOG */}
      {activeTab === 'store' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-3 bg-[#111722] rounded-xl border border-white/10 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 ml-1" />
            <input
              type="text"
              placeholder={t('Search store apps by name or package...', 'ابحث عن التطبيقات بالاسم أو الحزمة...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(app => {
              const isInstalled = !!app.installedVersion;
              const hasUpdate = isInstalled && app.version && app.version !== app.installedVersion;
              const progress = installProgress[app.package];

              return (
                <div
                  key={app.package}
                  className="p-5 rounded-2xl bg-[#111722] border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                        {app.name}
                      </h4>
                      {isInstalled && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Installed
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block truncate">
                      {app.package}
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {app.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span>Version: {app.version || 'Latest'}</span>
                      {app.github && <span>github.com/{app.github}</span>}
                    </div>

                    {progress !== undefined && progress < 100 ? (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-400 h-full transition-all duration-150"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isInstalled ? (
                          <>
                            <button
                              onClick={() =>
                                launchApp({
                                  name: app.name,
                                  packageName: app.package,
                                  icon: '📱'
                                })
                              }
                              className="flex-1 py-2 rounded-xl bg-teal-500/10 text-teal-300 hover:bg-teal-500 hover:text-slate-950 font-bold text-xs border border-teal-500/30 transition-all text-center cursor-pointer"
                            >
                              {t('Open', 'فتح')}
                            </button>
                            {hasUpdate && (
                              <button
                                onClick={() => handleInstallOrUpdate(app)}
                                className="py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer"
                              >
                                {t('Update', 'تحديث')}
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleInstallOrUpdate(app)}
                            className="w-full py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {t('Install APK', 'تثبيت التطبيق')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALL INSTALLED APPS & PERMISSIONS */}
      {activeTab === 'all_apps' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#111722] rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white">Installed Automotive Applications</h3>
            <p className="text-xs text-slate-400">
              {t(
                'Manage permissions, display allocation, and force-stop background services.',
                'إدارة صلاحيات التطبيقات وتعيين شاشات العرض وإيقاف الخدمات في الخلفية.'
              )}
            </p>

            <div className="space-y-2 pt-2">
              {catalog
                .filter(a => !!a.installedVersion)
                .map(app => (
                  <div
                    key={app.package}
                    className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-[#17202d] border border-white/5 gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white">{app.name}</h4>
                      <span className="font-mono text-[10px] text-slate-400">{app.package}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() =>
                          launchApp({
                            name: app.name,
                            packageName: app.package,
                            icon: '📱',
                            displayTarget: 'display0'
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium"
                      >
                        Launch D0
                      </button>
                      <button
                        onClick={() =>
                          launchApp({
                            name: app.name,
                            packageName: app.package,
                            icon: '📱',
                            displayTarget: 'display5'
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-medium"
                      >
                        Launch D5
                      </button>
                      <button
                        onClick={() => alert(`Permissions granted for ${app.package}: Overlay, Usage Stats, Storage.`)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                        title="Permissions & App Info"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom GitHub App Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-teal-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h4 className="font-bold text-base text-white">{t('Add App from GitHub', 'إضافة تطبيق من GitHub')}</h4>
            <p className="text-xs text-slate-400">
              {t(
                'Enter the GitHub repository (owner/repo) to download the latest release APK automatically.',
                'أدخل اسم مستودع جيت هب (owner/repo) لتحميل ملف الـ APK من آخر إصدار تلقائياً.'
              )}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Application Name:</label>
                <input
                  type="text"
                  placeholder="e.g. VLC for Android"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-[#17202d] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">GitHub Repository (owner/repo):</label>
                <input
                  type="text"
                  placeholder="e.g. videolan/vlc-android"
                  value={customRepo}
                  onChange={e => setCustomRepo(e.target.value)}
                  className="w-full bg-[#17202d] border border-white/10 rounded-xl px-3 py-2 font-mono text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                onClick={handleAddCustomApp}
                disabled={!customName || !customRepo}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                {t('Add to Catalog', 'إضافة للكتالوج')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
