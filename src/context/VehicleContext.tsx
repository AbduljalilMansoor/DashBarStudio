import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  VehicleTelemetry,
  ReminderSettings,
  DrawerSettings,
  AppFavorite,
  RunningApp,
  FuelLedgerConfig,
  RecordedTrip,
  TripSnapshot,
  SignalHistoryItem,
  LanguageMode,
  DisplayTarget
} from '../types';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface VehicleContextType {
  telemetry: VehicleTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<VehicleTelemetry>>;
  updateTelemetry: (partial: Partial<VehicleTelemetry>) => void;

  // Reminders
  reminderSettings: ReminderSettings;
  updateReminderSettings: (partial: Partial<ReminderSettings>) => void;
  activeAlertBanner: { type: 'belt' | 'door_drive' | 'door_ajar'; message: string; messageAr: string } | null;

  // Simulation
  isSimulating: boolean;
  simulationType: string | null;
  triggerSimulation: (type: 'door' | 'belt' | 'speed') => void;
  stopSimulation: () => void;

  // Language
  languageMode: LanguageMode;
  setLanguageMode: (mode: LanguageMode) => void;
  isArabic: boolean;
  t: (en: string, ar?: string) => string;

  // Drawer & Favorites
  drawerSettings: DrawerSettings;
  updateDrawerSettings: (partial: Partial<DrawerSettings>) => void;
  favorites: AppFavorite[];
  addFavorite: (app: Omit<AppFavorite, 'id'>) => void;
  updateFavorite: (id: string, partial: Partial<AppFavorite>) => void;
  removeFavorite: (id: string) => void;
  reorderFavorites: (newOrder: AppFavorite[]) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;

  // Running Apps
  runningApps: RunningApp[];
  launchApp: (app: { name: string; packageName: string; icon: string; displayTarget?: DisplayTarget }) => void;
  closeApp: (id: string) => void;
  closeAllApps: (filterFavorites?: boolean) => void;
  toggleAppDisplay: (id: string) => void;

  // Fuel Ledger
  fuelLedger: FuelLedgerConfig;
  updateFuelLedger: (partial: Partial<FuelLedgerConfig>) => void;
  addFuelRate: (date: string, price: number) => void;
  removeFuelRate: (id: string) => void;
  resetFuelData: () => void;

  // Trips
  recordedTrips: RecordedTrip[];
  isRecordingTrip: boolean;
  activeTrip: Partial<RecordedTrip> | null;
  tripMode: 'manual' | 'auto';
  setTripMode: (mode: 'manual' | 'auto') => void;
  tripStorageLimitMb: number;
  setTripStorageLimitMb: (mb: number) => void;
  startTrip: () => void;
  stopTrip: () => void;
  deleteTrip: (id: string) => void;

  // Signal Monitor & Hunting
  signalHistory: SignalHistoryItem[];
  addSignalLog: (name: string, oldVal: any, newVal: any) => void;
  clearSignalHistory: () => void;

  // Developer mode
  isDevUnlocked: boolean;
  unlockDev: () => void;
  lockDev: () => void;

  // Active Screen
  activeTab: 'hud' | 'trips' | 'dashdeck' | 'settings' | 'store' | 'installer' | 'signal_hunter';
  setActiveTab: (tab: 'hud' | 'trips' | 'dashdeck' | 'settings' | 'store' | 'installer' | 'signal_hunter') => void;
}

const VehicleContext = createContext<VehicleContextType | null>(null);

const INITIAL_TELEMETRY: VehicleTelemetry = {
  speedKmh: 0,
  rpm: 0,
  gear: 'P',
  driveMode: 'Normal',
  powerMode: 'ON',
  doors: { fl: false, fr: false, rl: false, rr: false, trunk: false },
  seatbelts: { driver: true, passenger: true, passengerOccupied: false },
  hazardLights: false,
  batterySocPct: 82,
  batteryPowerKw: 0,
  batteryRangeKm: 85,
  fuelPct: 74,
  fuelRangeKm: 640,
  odometerKm: 14285,
  outsideTempC: 31,
  timestamp: Date.now()
};

const INITIAL_REMINDERS: ReminderSettings = {
  beltOn: false,
  beltAudio: true,
  beltTone: 0, // Marimba
  beltVol: 25,
  beltMinutes: 3,

  driveOn: false,
  driveAudio: true,
  driveTone: 0, // Triple chime
  driveVol: 25,
  driveMinutes: 3,

  doorOn: false,
  doorSecs: 20,
  doorHazard: true,
  hornType: 0, // Sedan horn
  ajarSecs: 15,
  outVol: 60
};

const INITIAL_FAVORITES: AppFavorite[] = [
  { id: '1', name: 'Display Mirror', nameAr: 'مرآة الشاشة', packageName: 'com.autolink.mirror', icon: '📱', displayTarget: 'display0', color: '#3b82f6' },
  { id: '2', name: 'Google Maps', nameAr: 'خرائط جوجل', packageName: 'com.google.android.apps.maps', icon: '🗺️', displayTarget: 'display0', color: '#10b981' },
  { id: '3', name: 'Spotify Music', nameAr: 'سبوتيفاي', packageName: 'com.spotify.music', icon: '🎵', displayTarget: 'display0', color: '#22c55e' },
  { id: '4', name: 'YouTube', nameAr: 'يوتيوب', packageName: 'com.google.android.youtube', icon: '▶️', displayTarget: 'display5', color: '#ef4444' },
  { id: '5', name: 'Radio & Media', nameAr: 'الراديو والوسائط', packageName: 'com.autolink.media', icon: '📻', displayTarget: 'display0', color: '#8b5cf6' },
  { id: '6', name: 'Waze Navigation', nameAr: 'ويز ملاحة', packageName: 'com.waze', icon: '🚗', displayTarget: 'display0', color: '#06b6d4' }
];

const INITIAL_RUNNING_APPS: RunningApp[] = [
  { id: 'r1', name: 'Display Mirror', packageName: 'com.autolink.mirror', icon: '📱', currentDisplay: 'display0', isFavorite: true, startTime: Date.now() - 360000 },
  { id: 'r2', name: 'Spotify Music', packageName: 'com.spotify.music', icon: '🎵', currentDisplay: 'display0', isFavorite: true, startTime: Date.now() - 120000 }
];

const INITIAL_FUEL_LEDGER: FuelLedgerConfig = {
  currency: 'BD',
  rates: [
    { id: 'rate1', date: '2026-01-01', pricePerLitre: 0.200 },
    { id: 'rate2', date: '2026-06-01', pricePerLitre: 0.215 }
  ],
  standardL100km: 11.0,
  previousConsumptionLitres: 450,
  previousConsumptionValue: 90.0,
  previousConsumptionDistanceKm: 4200,
  previousConsumptionSavings: 38.5,
  totalLitresCounted: 135.2,
  initialOdometerKm: 12500
};

// Seed sample completed trips
const INITIAL_TRIPS: RecordedTrip[] = [
  {
    id: 'trip-1',
    startMs: Date.now() - 86400000 * 2,
    endMs: Date.now() - 86400000 * 2 + 1800000,
    durationMin: 30,
    movingMin: 26.5,
    distKm: 28.4,
    avgSpeedKmh: 64.3,
    maxSpeedKmh: 112,
    socStart: 95,
    socEnd: 68,
    fuelStart: 80,
    fuelEnd: 77,
    packPosKwh: 6.8,
    packNegKwh: 1.4,
    tempC: 32,
    fuelUsedL: 1.8,
    savingsBd: 0.42,
    snapshots: []
  },
  {
    id: 'trip-2',
    startMs: Date.now() - 86400000,
    endMs: Date.now() - 86400000 + 2700000,
    durationMin: 45,
    movingMin: 38.0,
    distKm: 46.2,
    avgSpeedKmh: 72.9,
    maxSpeedKmh: 124,
    socStart: 100,
    socEnd: 55,
    fuelStart: 77,
    fuelEnd: 73,
    packPosKwh: 11.2,
    packNegKwh: 2.1,
    tempC: 30,
    fuelUsedL: 2.6,
    savingsBd: 0.74,
    snapshots: []
  }
];

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>(() => {
    const saved = localStorage.getItem('mydash_telemetry') || localStorage.getItem('dashbar_telemetry');
    return saved ? JSON.parse(saved) : INITIAL_TELEMETRY;
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    const saved = localStorage.getItem('mydash_reminders') || localStorage.getItem('dashbar_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [drawerSettings, setDrawerSettings] = useState<DrawerSettings>(() => {
    const saved = localStorage.getItem('mydash_drawer') || localStorage.getItem('dashbar_drawer');
    return saved ? JSON.parse(saved) : { side: 'right', autoHideSecs: 5, gridIdx: 1, tabHeightOffset: 0 };
  });

  const [favorites, setFavorites] = useState<AppFavorite[]>(() => {
    const saved = localStorage.getItem('mydash_favorites') || localStorage.getItem('dashbar_favorites');
    return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
  });

  const [runningApps, setRunningApps] = useState<RunningApp[]>(INITIAL_RUNNING_APPS);

  const [fuelLedger, setFuelLedger] = useState<FuelLedgerConfig>(() => {
    const saved = localStorage.getItem('mydash_fuel_ledger') || localStorage.getItem('dashbar_fuel_ledger');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_LEDGER;
  });

  const [recordedTrips, setRecordedTrips] = useState<RecordedTrip[]>(() => {
    const saved = localStorage.getItem('mydash_trips') || localStorage.getItem('dashbar_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [tripMode, setTripMode] = useState<'manual' | 'auto'>('manual');
  const [tripStorageLimitMb, setTripStorageLimitMb] = useState(50);
  const [isRecordingTrip, setIsRecordingTrip] = useState(false);
  const [activeTrip, setActiveTrip] = useState<Partial<RecordedTrip> | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(1); // 1 = English default, 2 = Arabic
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'hud' | 'trips' | 'dashdeck' | 'settings' | 'store' | 'installer' | 'signal_hunter'>('hud');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationType, setSimulationType] = useState<string | null>(null);
  const simTimerRef = useRef<number | null>(null);

  // Active Alert Banner
  const [activeAlertBanner, setActiveAlertBanner] = useState<{
    type: 'belt' | 'door_drive' | 'door_ajar';
    message: string;
    messageAr: string;
  } | null>(null);

  // Signal history for live signal monitor
  const [signalHistory, setSignalHistory] = useState<SignalHistoryItem[]>([]);
  const lastSignalValuesRef = useRef<Record<string, any>>({});
  const doorAjarTimerRef = useRef<number | null>(null);
  const doorAjarFiredRef = useRef<boolean>(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('mydash_reminders', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  useEffect(() => {
    localStorage.setItem('mydash_drawer', JSON.stringify(drawerSettings));
  }, [drawerSettings]);

  useEffect(() => {
    localStorage.setItem('mydash_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('mydash_fuel_ledger', JSON.stringify(fuelLedger));
  }, [fuelLedger]);

  useEffect(() => {
    localStorage.setItem('mydash_trips', JSON.stringify(recordedTrips));
  }, [recordedTrips]);

  const updateTelemetry = useCallback((partial: Partial<VehicleTelemetry>) => {
    setTelemetry(prev => {
      const next = { ...prev, ...partial, timestamp: Date.now() };
      return next;
    });
  }, []);

  const updateReminderSettings = (partial: Partial<ReminderSettings>) => {
    setReminderSettings(prev => ({ ...prev, ...partial }));
  };

  const updateDrawerSettings = (partial: Partial<DrawerSettings>) => {
    setDrawerSettings(prev => ({ ...prev, ...partial }));
  };

  const updateFuelLedger = (partial: Partial<FuelLedgerConfig>) => {
    setFuelLedger(prev => ({ ...prev, ...partial }));
  };

  const addFuelRate = (date: string, price: number) => {
    setFuelLedger(prev => ({
      ...prev,
      rates: [...prev.rates, { id: 'rate_' + Date.now(), date, pricePerLitre: price }]
    }));
  };

  const removeFuelRate = (id: string) => {
    setFuelLedger(prev => ({
      ...prev,
      rates: prev.rates.filter(r => r.id !== id)
    }));
  };

  const resetFuelData = () => {
    setFuelLedger({
      currency: 'BD',
      rates: [{ id: 'rate1', date: new Date().toISOString().slice(0, 10), pricePerLitre: 0.200 }],
      standardL100km: 11.0,
      previousConsumptionLitres: 0,
      previousConsumptionValue: 0,
      previousConsumptionDistanceKm: 0,
      previousConsumptionSavings: 0,
      totalLitresCounted: 0,
      initialOdometerKm: telemetry.odometerKm
    });
  };

  // Signal logging
  const addSignalLog = useCallback((name: string, oldVal: any, newVal: any) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
    setSignalHistory(prev => [
      { id: 'sig_' + Date.now() + Math.random(), timestamp: timeStr, name, oldVal, newVal },
      ...prev.slice(0, 99)
    ]);
  }, []);

  const clearSignalHistory = () => {
    setSignalHistory([]);
  };

  // Language helper
  const isArabic = languageMode === 2;
  const t = useCallback(
    (en: string, ar?: string) => {
      if (isArabic && ar) return ar;
      return en;
    },
    [isArabic]
  );

  // Favorites management
  const addFavorite = (app: Omit<AppFavorite, 'id'>) => {
    if (favorites.length >= 9) return;
    const newFav: AppFavorite = { ...app, id: 'fav_' + Date.now() };
    setFavorites(prev => [...prev, newFav]);
  };

  const updateFavorite = (id: string, partial: Partial<AppFavorite>) => {
    setFavorites(prev => prev.map(f => (f.id === id ? { ...f, ...partial } : f)));
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const reorderFavorites = (newOrder: AppFavorite[]) => {
    setFavorites(newOrder);
  };

  // Running Apps management
  const launchApp = (app: { name: string; packageName: string; icon: string; displayTarget?: DisplayTarget }) => {
    setIsDrawerOpen(false);
    const existing = runningApps.find(r => r.packageName === app.packageName);
    const targetDisplay = app.displayTarget === 'display5' ? 'display5' : 'display0';

    if (existing) {
      setRunningApps(prev =>
        prev.map(r => (r.id === existing.id ? { ...r, startTime: Date.now(), currentDisplay: targetDisplay } : r))
      );
    } else {
      const isFav = favorites.some(f => f.packageName === app.packageName);
      setRunningApps(prev => [
        {
          id: 'run_' + Date.now(),
          name: app.name,
          packageName: app.packageName,
          icon: app.icon,
          currentDisplay: targetDisplay,
          isFavorite: isFav,
          startTime: Date.now()
        },
        ...prev
      ]);
    }
  };

  const closeApp = (id: string) => {
    setRunningApps(prev => prev.filter(r => r.id !== id));
  };

  const closeAllApps = (filterFavorites?: boolean) => {
    if (filterFavorites === undefined) {
      setRunningApps([]);
    } else {
      setRunningApps(prev => prev.filter(r => r.isFavorite !== filterFavorites));
    }
  };

  const toggleAppDisplay = (id: string) => {
    setRunningApps(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextDisp = r.currentDisplay === 'display0' ? 'display5' : 'display0';
          return { ...r, currentDisplay: nextDisp };
        }
        return r;
      })
    );
  };

  // Developer mode unlock
  const unlockDev = () => setIsDevUnlocked(true);
  const lockDev = () => setIsDevUnlocked(false);

  // Simulation handlers
  const triggerSimulation = (type: 'door' | 'belt' | 'speed') => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
    setIsSimulating(true);
    setSimulationType(type);

    if (type === 'door') {
      updateTelemetry({
        doors: { ...telemetry.doors, fl: true },
        gear: 'D',
        speedKmh: 20
      });
      if (reminderSettings.driveAudio) {
        audioSynthesizer.playDoorOpenDrive(reminderSettings.driveTone, reminderSettings.driveVol);
      }
    } else if (type === 'belt') {
      updateTelemetry({
        seatbelts: { ...telemetry.seatbelts, driver: false },
        speedKmh: 42,
        gear: 'D'
      });
      if (reminderSettings.beltAudio) {
        audioSynthesizer.playSeatBelt(reminderSettings.beltTone, 2, reminderSettings.beltVol);
      }
    } else if (type === 'speed') {
      updateTelemetry({
        speedKmh: 48,
        rpm: 1850,
        gear: 'D'
      });
    }

    simTimerRef.current = window.setTimeout(() => {
      stopSimulation();
    }, 15000);
  };

  const stopSimulation = () => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
    setIsSimulating(false);
    setSimulationType(null);
    audioSynthesizer.stopAll();
    updateTelemetry({
      doors: { fl: false, fr: false, rl: false, rr: false, trunk: false },
      seatbelts: { driver: true, passenger: true, passengerOccupied: false },
      speedKmh: 0,
      gear: 'P',
      rpm: 0
    });
  };

  // Trip recording lifecycle
  const startTrip = () => {
    setIsRecordingTrip(true);
    setActiveTrip({
      id: 'trip_' + Date.now(),
      startMs: Date.now(),
      endMs: Date.now(),
      durationMin: 0,
      movingMin: 0,
      distKm: 0,
      avgSpeedKmh: 0,
      maxSpeedKmh: 0,
      socStart: telemetry.batterySocPct,
      socEnd: telemetry.batterySocPct,
      fuelStart: telemetry.fuelPct,
      fuelEnd: telemetry.fuelPct,
      packPosKwh: 0,
      packNegKwh: 0,
      tempC: telemetry.outsideTempC,
      fuelUsedL: 0,
      savingsBd: 0,
      snapshots: []
    });
  };

  const stopTrip = () => {
    if (!activeTrip) return;
    const finalTrip: RecordedTrip = {
      id: activeTrip.id || 'trip_' + Date.now(),
      startMs: activeTrip.startMs || Date.now() - 60000,
      endMs: Date.now(),
      durationMin: Math.max(1, Math.round(((Date.now() - (activeTrip.startMs || Date.now())) / 60000) * 10) / 10),
      movingMin: activeTrip.movingMin || 0.8,
      distKm: Math.round((activeTrip.distKm || 1.2) * 10) / 10,
      avgSpeedKmh: Math.round(activeTrip.avgSpeedKmh || 45),
      maxSpeedKmh: Math.round(activeTrip.maxSpeedKmh || telemetry.speedKmh),
      socStart: activeTrip.socStart || 85,
      socEnd: telemetry.batterySocPct,
      fuelStart: activeTrip.fuelStart || 75,
      fuelEnd: telemetry.fuelPct,
      packPosKwh: Math.round((activeTrip.packPosKwh || 0.4) * 10) / 10,
      packNegKwh: Math.round((activeTrip.packNegKwh || 0.1) * 10) / 10,
      tempC: telemetry.outsideTempC,
      fuelUsedL: Math.round(((activeTrip.fuelStart || 75) - telemetry.fuelPct) * 0.6 * 10) / 10 || 0.1,
      savingsBd: 0.15,
      snapshots: activeTrip.snapshots || []
    };

    setRecordedTrips(prev => [finalTrip, ...prev]);
    setIsRecordingTrip(false);
    setActiveTrip(null);
  };

  const deleteTrip = (id: string) => {
    setRecordedTrips(prev => prev.filter(t => t.id !== id));
  };

  // Main 1-second vehicle watchdog & alert evaluator loop
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      const anyDoorOpen = telemetry.doors.fl || telemetry.doors.fr || telemetry.doors.rl || telemetry.doors.rr || telemetry.doors.trunk;
      const isCarOn = telemetry.powerMode === 'ON' || telemetry.powerMode === 'START' || telemetry.speedKmh > 3;

      // 1. Door open in D or R reminder
      if (reminderSettings.driveOn && (telemetry.gear === 'D' || telemetry.gear === 'R') && anyDoorOpen && isCarOn) {
        const openNames: string[] = [];
        const openNamesAr: string[] = [];
        if (telemetry.doors.fl) { openNames.push('Front Left Door'); openNamesAr.push('الباب الأمامي الأيسر'); }
        if (telemetry.doors.fr) { openNames.push('Front Right Door'); openNamesAr.push('الباب الأمامي الأيمن'); }
        if (telemetry.doors.rl) { openNames.push('Rear Left Door'); openNamesAr.push('الباب الخلفي الأيسر'); }
        if (telemetry.doors.rr) { openNames.push('Rear Right Door'); openNamesAr.push('الباب الخلفي الأيمن'); }
        if (telemetry.doors.trunk) { openNames.push('Trunk'); openNamesAr.push('صندوق الأمتعة'); }

        setActiveAlertBanner({
          type: 'door_drive',
          message: `DOOR OPEN WHILE DRIVING: ${openNames.join(', ')}`,
          messageAr: `الباب مفتوح أثناء القيادة: ${openNamesAr.join('، ')}`
        });
      }
      // 2. Seat belt reminder: speed > 35 km/h and front belt unfastened
      else if (
        reminderSettings.beltOn &&
        telemetry.speedKmh >= 35 &&
        (!telemetry.seatbelts.driver || (telemetry.seatbelts.passengerOccupied && !telemetry.seatbelts.passenger)) &&
        isCarOn
      ) {
        setActiveAlertBanner({
          type: 'belt',
          message: 'FASTEN SEAT BELT: Driver or passenger belt unfastened',
          messageAr: 'اربط حزام الأمان: حزام السائق أو الراكب غير مربوط'
        });
      }
      // 3. Door ajar parked reminder
      else if (reminderSettings.doorOn && telemetry.gear === 'P' && anyDoorOpen && isCarOn) {
        if (!doorAjarTimerRef.current) {
          doorAjarTimerRef.current = now;
        } else if (now - doorAjarTimerRef.current >= reminderSettings.doorSecs * 1000 && !doorAjarFiredRef.current) {
          doorAjarFiredRef.current = true;
          setActiveAlertBanner({
            type: 'door_ajar',
            message: `DOOR AJAR: Outside chime sounding for ${reminderSettings.ajarSecs}s`,
            messageAr: `الباب مفتوح أثناء التوقف: منبه السماعة الخارجية يعمل لمدة ${reminderSettings.ajarSecs} ثانية`
          });
          audioSynthesizer.playDoorAjarHorn(reminderSettings.hornType, reminderSettings.ajarSecs, reminderSettings.outVol);
        }
      } else {
        doorAjarTimerRef.current = null;
        doorAjarFiredRef.current = false;
        setActiveAlertBanner(null);
      }

      // Record snapshot if recording active
      if (isRecordingTrip && activeTrip) {
        const dt = 1000;
        const speed = telemetry.speedKmh;
        const dKm = (speed / 3600);
        const moving = speed >= 3;

        const snapshot: TripSnapshot = {
          timeMs: now,
          speedKmh: speed,
          rpm: telemetry.rpm,
          gear: telemetry.gear,
          driveMode: telemetry.driveMode,
          socPct: telemetry.batterySocPct,
          fuelPct: telemetry.fuelPct,
          packPowerKw: telemetry.batteryPowerKw,
          distKm: (activeTrip.distKm || 0) + dKm,
          powertrainMode: speed === 0 ? 'ENGINE' : telemetry.batteryPowerKw > 0 ? 'EV' : 'REGEN'
        };

        setActiveTrip(prev => {
          if (!prev) return null;
          const newDist = (prev.distKm || 0) + dKm;
          const newMovingMs = (prev.movingMin ? prev.movingMin * 60000 : 0) + (moving ? dt : 0);
          const movingMin = newMovingMs / 60000;
          const avgSpeed = movingMin > 0 ? newDist / (movingMin / 60) : 0;
          const maxSpeed = Math.max(prev.maxSpeedKmh || 0, speed);

          return {
            ...prev,
            endMs: now,
            durationMin: Math.round(((now - (prev.startMs || now)) / 60000) * 10) / 10,
            movingMin: Math.round(movingMin * 10) / 10,
            distKm: Math.round(newDist * 100) / 100,
            avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
            maxSpeedKmh: maxSpeed,
            snapshots: [...(prev.snapshots || []).slice(-300), snapshot]
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    telemetry,
    reminderSettings,
    isRecordingTrip,
    activeTrip
  ]);

  return (
    <VehicleContext.Provider
      value={{
        telemetry,
        setTelemetry,
        updateTelemetry,
        reminderSettings,
        updateReminderSettings,
        activeAlertBanner,
        isSimulating,
        simulationType,
        triggerSimulation,
        stopSimulation,
        languageMode,
        setLanguageMode,
        isArabic,
        t,
        drawerSettings,
        updateDrawerSettings,
        favorites,
        addFavorite,
        updateFavorite,
        removeFavorite,
        reorderFavorites,
        isDrawerOpen,
        setIsDrawerOpen,
        runningApps,
        launchApp,
        closeApp,
        closeAllApps,
        toggleAppDisplay,
        fuelLedger,
        updateFuelLedger,
        addFuelRate,
        removeFuelRate,
        resetFuelData,
        recordedTrips,
        isRecordingTrip,
        activeTrip,
        tripMode,
        setTripMode,
        tripStorageLimitMb,
        setTripStorageLimitMb,
        startTrip,
        stopTrip,
        deleteTrip,
        signalHistory,
        addSignalLog,
        clearSignalHistory,
        isDevUnlocked,
        unlockDev,
        lockDev,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) throw new Error('useVehicle must be used within VehicleProvider');
  return context;
};
