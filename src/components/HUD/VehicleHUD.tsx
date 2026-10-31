import React from 'react';
import { useVehicle } from '../../context/VehicleContext';
import {
  Car,
  ShieldAlert,
  Flame,
  BatteryCharging,
  Zap,
  Radio,
  Sliders,
  Power,
  DoorClosed
} from 'lucide-react';

export const VehicleHUD: React.FC = () => {
  const { telemetry, updateTelemetry, reminderSettings, activeAlertBanner, t, isArabic } = useVehicle();

  // Controls for interactive driving
  const accelerate = (amount: number) => {
    if (telemetry.gear === 'P' || telemetry.gear === 'N') return;
    const newSpeed = Math.min(180, Math.max(0, telemetry.speedKmh + amount));
    const newRpm = newSpeed === 0 ? 800 : Math.round(1200 + (newSpeed / 180) * 4500);
    const newKw = Math.round((newSpeed / 180) * 85);
    updateTelemetry({
      speedKmh: newSpeed,
      rpm: newRpm,
      batteryPowerKw: newKw
    });
  };

  const brake = (amount: number) => {
    const newSpeed = Math.max(0, telemetry.speedKmh - amount);
    const newRpm = newSpeed === 0 ? 800 : Math.round(1200 + (newSpeed / 180) * 4500);
    const regenKw = newSpeed > 0 ? -Math.round((amount / 20) * 35) : 0;
    updateTelemetry({
      speedKmh: newSpeed,
      rpm: newSpeed === 0 && telemetry.gear === 'P' ? 0 : newRpm,
      batteryPowerKw: regenKw
    });
  };

  const setGear = (g: 'P' | 'R' | 'N' | 'D') => {
    updateTelemetry({
      gear: g,
      rpm: g === 'P' ? 0 : telemetry.rpm || 800,
      speedKmh: g === 'P' ? 0 : telemetry.speedKmh
    });
  };

  const toggleDoor = (doorKey: keyof typeof telemetry.doors) => {
    updateTelemetry({
      doors: {
        ...telemetry.doors,
        [doorKey]: !telemetry.doors[doorKey]
      }
    });
  };

  const toggleSeatbelt = (who: 'driver' | 'passenger') => {
    updateTelemetry({
      seatbelts: {
        ...telemetry.seatbelts,
        [who]: !telemetry.seatbelts[who]
      }
    });
  };

  const togglePassengerOccupied = () => {
    updateTelemetry({
      seatbelts: {
        ...telemetry.seatbelts,
        passengerOccupied: !telemetry.seatbelts.passengerOccupied
      }
    });
  };

  const toggleHazards = () => {
    updateTelemetry({ hazardLights: !telemetry.hazardLights });
  };

  const togglePower = () => {
    const nextPower = telemetry.powerMode === 'ON' ? 'OFF' : 'ON';
    updateTelemetry({
      powerMode: nextPower,
      speedKmh: nextPower === 'OFF' ? 0 : telemetry.speedKmh,
      rpm: nextPower === 'OFF' ? 0 : 800,
      gear: nextPower === 'OFF' ? 'P' : telemetry.gear
    });
  };

  return (
    <div className="space-y-6">
      {/* Visual Emergency Warning Alert Banner when alarms trigger */}
      {activeAlertBanner && (
        <div className="p-4 rounded-2xl bg-red-600/90 border border-red-400 text-white shadow-2xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <span className="font-extrabold text-sm uppercase tracking-wide block">
                {isArabic ? activeAlertBanner.messageAr : activeAlertBanner.message}
              </span>
              <span className="text-xs opacity-90">
                {t(
                  'Active DashBar safety reminder protocol sounding in cabin / exterior speaker.',
                  'بروتوكول تنبيه السلامة في DashBar يعمل حالياً عبر السماعات.'
                )}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-red-700">
            WARNING ACTIVE
          </span>
        </div>
      )}

      {/* Main Automotive Cockpit & Telemetry Simulator */}
      <div className="p-6 bg-[#111722] rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Jetour G700 Interactive Head Unit
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    telemetry.powerMode === 'ON' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`}
                ></span>
              </h2>
              <p className="text-xs text-slate-400">
                {t(
                  'Real-time vehicle bus simulator (CAN/Autolink) with interactive physical controls',
                  'محاكي بيانات السيارة الحية ومكتبة Autolink مع أزرار التحكم بالقيادة'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePower}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow ${
                telemetry.powerMode === 'ON'
                  ? 'bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              <Power className="w-4 h-4" />
              {telemetry.powerMode === 'ON' ? t('Power OFF (Switch off)', 'إيقاف السيارة') : t('Start Car (Engine ON)', 'تشغيل السيارة')}
            </button>
          </div>
        </div>

        {/* Dashboard Center Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Gear PRND Selector */}
          <div className="p-4 rounded-2xl bg-[#161d2a] border border-white/5 space-y-3">
            <span className="text-[11px] text-slate-400 font-mono block">TRANSMISSION SHIFTER</span>
            <div className="grid grid-cols-4 gap-2">
              {(['P', 'R', 'N', 'D'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGear(g)}
                  className={`py-3 rounded-xl font-mono text-lg font-black transition-all ${
                    telemetry.gear === g
                      ? 'bg-teal-500 text-slate-950 shadow-lg ring-2 ring-teal-300'
                      : 'bg-[#1e2736] text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-between text-xs text-slate-400">
              <span>Drive Mode:</span>
              <select
                value={telemetry.driveMode}
                onChange={e => updateTelemetry({ driveMode: e.target.value as any })}
                className="bg-[#1e2736] text-teal-300 font-mono font-bold rounded px-2 py-0.5 border border-white/10"
              >
                <option value="Normal">Normal</option>
                <option value="Sport">Sport</option>
                <option value="Eco">Eco</option>
                <option value="Snow">Snow</option>
                <option value="Mud">Mud</option>
                <option value="Sand">Sand</option>
                <option value="Rock">Rock</option>
              </select>
            </div>
          </div>

          {/* Center: Digital Speedometer Dial */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#182230] to-[#0e141f] border border-teal-500/30 text-center relative shadow-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-teal-400 tracking-widest uppercase">
              SPEEDOMETER
            </span>
            <div className="my-2">
              <span className="text-7xl font-black font-mono text-white tracking-tight">
                {Math.round(telemetry.speedKmh)}
              </span>
              <span className="text-xs font-bold text-slate-400 block mt-1">KM/H</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2">
              <span>{telemetry.rpm} RPM</span>
              <span>•</span>
              <span className="text-teal-400">{telemetry.batteryPowerKw} kW</span>
            </div>

            {/* Accelerator & Brake Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full mt-5">
              <button
                onClick={() => brake(10)}
                className="py-3 px-4 rounded-xl bg-red-950/40 text-red-400 border border-red-500/30 font-bold hover:bg-red-900/40 transition-colors active:scale-95 cursor-pointer"
              >
                {t('Brake (-10)', 'فرامل')}
              </button>
              <button
                onClick={() => accelerate(10)}
                disabled={telemetry.gear === 'P' || telemetry.powerMode === 'OFF'}
                className="py-3 px-4 rounded-xl bg-teal-500 text-slate-950 font-black hover:bg-teal-400 transition-colors active:scale-95 cursor-pointer disabled:opacity-40"
              >
                {t('Gas (+10)', 'تسارع')}
              </button>
            </div>
          </div>

          {/* Right: Powertrain & Battery Status */}
          <div className="p-4 rounded-2xl bg-[#161d2a] border border-white/5 space-y-3">
            <span className="text-[11px] text-slate-400 font-mono block">ENERGY & CONSUMPTION</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#1e2736]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  Battery Level
                </span>
                <span className="font-mono font-bold text-emerald-400">{telemetry.batterySocPct}%</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-[#1e2736]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Fuel Level
                </span>
                <span className="font-mono font-bold text-amber-400">{telemetry.fuelPct}%</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-[#1e2736]">
                <span className="text-slate-400">Total Odometer</span>
                <span className="font-mono font-bold text-white">{telemetry.odometerKm.toLocaleString()} KM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Doors & Safety Belts Interactive Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
          {/* Doors & Trunk Toggles */}
          <div className="p-4 rounded-2xl bg-[#161d2a] border border-white/5 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <DoorClosed className="w-4 h-4 text-teal-400" />
              {t('Vehicle Doors & Trunk State (Simulate Open/Close)', 'حالة الأبواب وصندوق الأمتعة')}
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => toggleDoor('fl')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  telemetry.doors.fl
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                    : 'bg-[#1e2736] text-slate-300 border-white/10'
                }`}
              >
                FL (Front Left): {telemetry.doors.fl ? 'OPEN' : 'CLOSED'}
              </button>

              <button
                onClick={() => toggleDoor('fr')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  telemetry.doors.fr
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                    : 'bg-[#1e2736] text-slate-300 border-white/10'
                }`}
              >
                FR (Front Right): {telemetry.doors.fr ? 'OPEN' : 'CLOSED'}
              </button>

              <button
                onClick={() => toggleDoor('trunk')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  telemetry.doors.trunk
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                    : 'bg-[#1e2736] text-slate-300 border-white/10'
                }`}
              >
                Trunk: {telemetry.doors.trunk ? 'OPEN' : 'CLOSED'}
              </button>

              <button
                onClick={() => toggleDoor('rl')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  telemetry.doors.rl
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                    : 'bg-[#1e2736] text-slate-300 border-white/10'
                }`}
              >
                RL (Rear Left): {telemetry.doors.rl ? 'OPEN' : 'CLOSED'}
              </button>

              <button
                onClick={() => toggleDoor('rr')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  telemetry.doors.rr
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                    : 'bg-[#1e2736] text-slate-300 border-white/10'
                }`}
              >
                RR (Rear Right): {telemetry.doors.rr ? 'OPEN' : 'CLOSED'}
              </button>

              <button
                onClick={toggleHazards}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                  telemetry.hazardLights
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold animate-pulse'
                    : 'bg-[#1e2736] text-slate-400 border-white/10'
                }`}
              >
                Hazards: {telemetry.hazardLights ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Seat Belts Toggles */}
          <div className="p-4 rounded-2xl bg-[#161d2a] border border-white/5 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-400" />
              {t('Seat Belt Buckles & Occupancy Sensor', 'أحزمة الأمان ومستشعر وجود الراكب')}
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => toggleSeatbelt('driver')}
                className={`p-3 rounded-xl border text-center font-medium transition-all ${
                  telemetry.seatbelts.driver
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                }`}
              >
                Driver Belt: {telemetry.seatbelts.driver ? 'FASTENED' : 'UNBUCKLED'}
              </button>

              <button
                onClick={() => toggleSeatbelt('passenger')}
                className={`p-3 rounded-xl border text-center font-medium transition-all ${
                  telemetry.seatbelts.passenger
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                }`}
              >
                Passenger Belt: {telemetry.seatbelts.passenger ? 'FASTENED' : 'UNBUCKLED'}
              </button>
            </div>

            <button
              onClick={togglePassengerOccupied}
              className={`w-full py-2 rounded-xl border text-center text-xs font-medium transition-all ${
                telemetry.seatbelts.passengerOccupied
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                  : 'bg-[#1e2736] text-slate-400 border-white/10'
              }`}
            >
              Passenger Seat Occupancy: {telemetry.seatbelts.passengerOccupied ? 'OCCUPIED' : 'EMPTY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
