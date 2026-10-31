// Weather fetching utility mirroring DeckData.java using Open-Meteo

export interface WeatherData {
  tempC: number;
  code: number;
  condition: string;
  conditionAr: string;
  icon: string;
  isDay: boolean;
  windSpeedKmh: number;
  timestamp: number;
}

const CACHE: Record<string, WeatherData> = {};

export function getWeatherCondition(code: number, isDay: boolean): { condition: string; conditionAr: string; icon: string } {
  if (code === 0) {
    return { condition: 'Clear', conditionAr: 'صافٍ', icon: isDay ? '☀️' : '🌙' };
  }
  if (code <= 2) {
    return { condition: 'Partly Cloudy', conditionAr: 'غائم جزئياً', icon: isDay ? '⛅' : '☁️' };
  }
  if (code === 3) {
    return { condition: 'Overcast', conditionAr: 'غائم كلياً', icon: '☁️' };
  }
  if (code === 45 || code === 48) {
    return { condition: 'Fog', conditionAr: 'ضباب', icon: '🌫️' };
  }
  if (code >= 51 && code <= 57) {
    return { condition: 'Drizzle', conditionAr: 'رذاذ خفيف', icon: '🌦️' };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { condition: 'Rain', conditionAr: 'أمطار', icon: '🌧️' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { condition: 'Snow', conditionAr: 'ثلوج', icon: '❄️' };
  }
  if (code >= 95) {
    return { condition: 'Thunderstorm', conditionAr: 'عاصفة رعدية', icon: '⛈️' };
  }
  return { condition: 'Cloudy', conditionAr: 'غائم', icon: '☁️' };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const cacheKey = `${Math.round(lat * 100)},${Math.round(lng * 100)}`;
  const cached = CACHE[cacheKey];
  if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
    return cached;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();
    const current = data.current;

    const isDay = current.is_day === 1;
    const { condition, conditionAr, icon } = getWeatherCondition(current.weather_code, isDay);

    const result: WeatherData = {
      tempC: Math.round(current.temperature_2m * 10) / 10,
      code: current.weather_code,
      condition,
      conditionAr,
      icon,
      isDay,
      windSpeedKmh: Math.round(current.wind_speed_10m),
      timestamp: Date.now()
    };

    CACHE[cacheKey] = result;
    return result;
  } catch (e) {
    // Fallback if offline or API blocked
    return (
      cached || {
        tempC: 28,
        code: 0,
        condition: 'Clear',
        conditionAr: 'صافٍ',
        icon: '☀️',
        isDay: true,
        windSpeedKmh: 14,
        timestamp: Date.now()
      }
    );
  }
}
