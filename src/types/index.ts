// Types for MyDash
export type Gear = 'P' | 'R' | 'N' | 'D';
export type DriveMode = 'Normal' | 'Sport' | 'Eco' | 'Snow' | 'Mud' | 'Sand' | 'Rock';
export type PowerMode = 'OFF' | 'ACC' | 'ON' | 'START';
export type LanguageMode = 0 | 1 | 2; // 0: Auto, 1: English, 2: Arabic
export type DisplayTarget = 'display0' | 'display5' | 'both' | 'ask';

export interface VehicleDoors {
  fl: boolean; // Front Left
  fr: boolean; // Front Right
  rl: boolean; // Rear Left
  rr: boolean; // Rear Right
  trunk: boolean;
}

export interface VehicleSeatbelts {
  driver: boolean; // true = fastened
  passenger: boolean; // true = fastened
  passengerOccupied: boolean;
}

export interface VehicleTelemetry {
  speedKmh: number;
  rpm: number;
  gear: Gear;
  driveMode: DriveMode;
  powerMode: PowerMode;
  doors: VehicleDoors;
  seatbelts: VehicleSeatbelts;
  hazardLights: boolean;
  batterySocPct: number;
  batteryPowerKw: number;
  batteryRangeKm: number;
  fuelPct: number;
  fuelRangeKm: number;
  odometerKm: number;
  outsideTempC: number;
  timestamp: number;
}

export interface ReminderSettings {
  // Seat belt
  beltOn: boolean;
  beltAudio: boolean;
  beltTone: number; // 0: Marimba, 1: Soft bell, 2: Digital beeps
  beltVol: number; // 10..100
  beltMinutes: number; // 1..10

  // Door open in D/R
  driveOn: boolean;
  driveAudio: boolean;
  driveTone: number; // 0: Triple chime, 1: Rising chime, 2: Falling chime
  driveVol: number; // 10..100
  driveMinutes: number; // 1..10

  // Door ajar parked
  doorOn: boolean;
  doorSecs: number; // 5..60 (remind after)
  doorHazard: boolean;
  hornType: number; // 0: Sedan horn, 1: Whistle Swoop, 2: Whistle Chirp, 3: Whistle Trill
  ajarSecs: number; // 2..60 (alarm length)
  outVol: number; // 5..100
}

export interface DrawerSettings {
  side: 'left' | 'right';
  autoHideSecs: number; // 3..30
  gridIdx: number; // 0: 2x2, 1: 3x2, 2: 3x3, 3: 2x3
  tabHeightOffset: number; // px offset from center
}

export interface AppFavorite {
  id: string;
  name: string;
  nameAr?: string;
  packageName: string;
  icon: string; // emoji or icon name
  displayTarget: DisplayTarget;
  color?: string;
}

export interface RunningApp {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  currentDisplay: 'display0' | 'display5';
  isFavorite: boolean;
  startTime: number;
}

export interface StoreCatalogApp {
  name: string;
  package: string;
  github?: string;
  aptoide?: string;
  url?: string;
  asset?: string;
  version?: string;
  installedVersion?: string;
  description: string;
  auto: boolean;
  preinstall?: boolean;
}

export interface FuelRate {
  id: string;
  date: string;
  pricePerLitre: number;
}

export interface FuelLedgerConfig {
  currency: string;
  rates: FuelRate[];
  standardL100km: number; // default 11.0
  previousConsumptionLitres: number;
  previousConsumptionValue: number;
  previousConsumptionDistanceKm: number;
  previousConsumptionSavings: number;
  totalLitresCounted: number;
  initialOdometerKm: number;
}

export interface TripSnapshot {
  timeMs: number;
  speedKmh: number;
  rpm: number;
  gear: Gear;
  driveMode: DriveMode;
  socPct: number;
  fuelPct: number;
  packPowerKw: number;
  distKm: number;
  powertrainMode: 'EV' | 'HEV' | 'ENGINE' | 'REGEN';
}

export interface RecordedTrip {
  id: string;
  startMs: number;
  endMs: number;
  durationMin: number;
  movingMin: number;
  distKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  socStart: number;
  socEnd: number;
  fuelStart: number;
  fuelEnd: number;
  packPosKwh: number;
  packNegKwh: number;
  tempC: number;
  fuelUsedL: number;
  savingsBd: number;
  snapshots: TripSnapshot[];
}

export interface DashDeckWidgetConfig {
  id: string;
  type: 'fuel_cost' | 'prayer' | 'weather' | 'fuel_battery' | 'rpm_power' | 'my_trips' | 'background';
  col: number; // 0..34
  row: number; // 0..4
  cols: number; // width
  rows: number; // height
  settings: Record<string, any>;
}

export interface SignalHistoryItem {
  id: string;
  timestamp: string;
  name: string;
  oldVal: string | number;
  newVal: string | number;
  isNoisy?: boolean;
}
