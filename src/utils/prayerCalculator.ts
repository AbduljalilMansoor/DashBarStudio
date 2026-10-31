// Prayer times calculation based on astronomical formulas from DeckData.java

export interface CityPreset {
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Manama', nameAr: 'المنامة', lat: 26.2285, lng: 50.5860 },
  { name: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { name: 'Jeddah', nameAr: 'جدة', lat: 21.4858, lng: 39.1925 },
  { name: 'Makkah', nameAr: 'مكة المكرمة', lat: 21.3891, lng: 39.8579 },
  { name: 'Madinah', nameAr: 'المدينة المنورة', lat: 24.4709, lng: 39.6122 },
  { name: 'Dammam', nameAr: 'الدمام', lat: 26.4207, lng: 50.0888 },
  { name: 'Dubai', nameAr: 'دبي', lat: 25.2048, lng: 55.2708 },
  { name: 'Abu Dhabi', nameAr: 'أبو ظبي', lat: 24.4539, lng: 54.3773 },
  { name: 'Doha', nameAr: 'الدوحة', lat: 25.2854, lng: 51.5310 },
  { name: 'Kuwait City', nameAr: 'مدينة الكويت', lat: 29.3759, lng: 47.9774 },
  { name: 'Muscat', nameAr: 'مسقط', lat: 23.5880, lng: 58.3829 },
  { name: 'Najaf', nameAr: 'النجف الأشرف', lat: 32.0003, lng: 44.3366 },
  { name: 'Karbala', nameAr: 'كربلاء المقدسة', lat: 32.6160, lng: 44.0249 },
  { name: 'Baghdad', nameAr: 'بغداد', lat: 33.3152, lng: 44.3661 },
  { name: 'Cairo', nameAr: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { name: 'London', nameAr: 'لندن', lat: 51.5072, lng: -0.1276 }
];

export const METHOD_NAMES = [
  "Ja'fari (Leva Institute, Qom)",
  "Muslim World League",
  "Umm al-Qura"
];

export const PRAYER_NAMES_EN = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
export const PRAYER_NAMES_AR = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

// Calculation parameters: [fajrAngle, maghribAngle, ishaAngle, ishaMinutesAfterMaghrib]
const METHODS = [
  [16, 4, 14, 0],     // Ja'fari
  [18, 0, 17, 0],     // MWL
  [18.5, 0, 0, 90]    // Umm al-Qura
];

function julian(y: number, m: number, d: number): number {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100.0);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function fix(a: number, b: number): number {
  a = a - b * Math.floor(a / b);
  return a < 0 ? a + b : a;
}

function sin(d: number): number {
  return Math.sin((d * Math.PI) / 180);
}

function cos(d: number): number {
  return Math.cos((d * Math.PI) / 180);
}

function sunPos(jd: number): [number, number] {
  const d = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * d, 360);
  const q = fix(280.459 + 0.98564736 * d, 360);
  const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * d;
  const ra = (Math.atan2(cos(e) * sin(L), cos(L)) * 180) / Math.PI / 15;
  let eqt = q / 15 - fix(ra, 24);
  if (eqt > 12) eqt -= 24;
  else if (eqt < -12) eqt += 24;
  const dec = (Math.asin(sin(e) * sin(L)) * 180) / Math.PI;
  return [dec, eqt];
}

function angleHours(angle: number, lat: number, dec: number): number {
  const v = (-sin(angle) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec));
  if (v < -1 || v > 1) return NaN;
  return (Math.acos(v) * 180) / Math.PI / 15;
}

function asrHours(lat: number, dec: number): number {
  const alt = (Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * Math.PI / 180))) * 180) / Math.PI;
  const v = (sin(alt) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec));
  if (v < -1 || v > 1) return NaN;
  return (Math.acos(v) * 180) / Math.PI / 15;
}

export interface PrayerTimesResult {
  names: string[];
  namesAr: string[];
  times: string[]; // Formatted time strings
  minutes: number[]; // Minutes from midnight
  visibleIndices: number[];
  nextPrayerIndex: number;
  nextPrayerName: string;
  nextPrayerNameAr: string;
  minutesUntilNext: number;
  formattedCountdown: string;
}

export function calculatePrayers(
  lat: number,
  lng: number,
  methodIdx: number = 0,
  adjustments: number[] = [0, 0, 0, 0, 0],
  is24h: boolean = true,
  date: Date = new Date()
): PrayerTimesResult {
  const tzOffsetHours = -date.getTimezoneOffset() / 60;
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const jd = julian(y, m, d) - lng / (15 * 24.0);
  const [dec, eqt] = sunPos(jd);
  const noon = 12 + tzOffsetHours - lng / 15 - eqt;

  const safeMethod = Math.max(0, Math.min(METHODS.length - 1, methodIdx));
  const k = METHODS[safeMethod];

  const t: number[] = new Array(5);
  t[0] = noon - angleHours(k[0], lat, dec); // Fajr
  t[1] = noon; // Dhuhr
  t[2] = noon + asrHours(lat, dec); // Asr
  const sunset = noon + angleHours(0.833, lat, dec);
  t[3] = k[1] > 0 ? noon + angleHours(k[1], lat, dec) : sunset; // Maghrib
  t[4] = k[2] > 0 ? noon + angleHours(k[2], lat, dec) : t[3] + k[3] / 60.0; // Isha

  const minutes: number[] = [];
  const times: string[] = [];

  for (let i = 0; i < 5; i++) {
    const adj = adjustments[i] || 0;
    const minVal = Math.round((t[i] * 60 + adj) % 1440);
    minutes.push(minVal);

    const h = Math.floor(minVal / 60);
    const mi = minVal % 60;

    if (is24h) {
      times.push(`${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`);
    } else {
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      times.push(`${h12}:${String(mi).padStart(2, '0')} ${ampm}`);
    }
  }

  // Ja'fari shows Fajr (0), Dhuhr (1), Maghrib (3)
  const visibleIndices = safeMethod === 0 ? [0, 1, 3] : [0, 1, 2, 3, 4];

  // Determine next prayer
  const nowMin = date.getHours() * 60 + date.getMinutes();
  let nextIdx = -1;
  let minUntil = Infinity;

  for (const idx of visibleIndices) {
    const pMin = minutes[idx];
    if (pMin > nowMin) {
      nextIdx = idx;
      minUntil = pMin - nowMin;
      break;
    }
  }

  if (nextIdx === -1) {
    // Rolls over to tomorrow's first visible prayer
    nextIdx = visibleIndices[0];
    minUntil = (1440 - nowMin) + minutes[nextIdx];
  }

  const hoursLeft = Math.floor(minUntil / 60);
  const minsLeft = minUntil % 60;
  const formattedCountdown = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;

  return {
    names: PRAYER_NAMES_EN,
    namesAr: PRAYER_NAMES_AR,
    times,
    minutes,
    visibleIndices,
    nextPrayerIndex: nextIdx,
    nextPrayerName: PRAYER_NAMES_EN[nextIdx],
    nextPrayerNameAr: PRAYER_NAMES_AR[nextIdx],
    minutesUntilNext: minUntil,
    formattedCountdown
  };
}
