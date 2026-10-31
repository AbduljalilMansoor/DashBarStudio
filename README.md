# DashBar — Quick-Launch Drawer, DashDeck & Telemetry System for Jetour G700

A comprehensive React application rewritten from the original Android Automotive head unit software for Jetour G700 and AutoLink systems.

## Features

### 1. DashBar Quick-Launch Dock (Edge Drawer)
- **Persistent Floating Edge Tab**: Accessible from anywhere on the screen (configurable left or right side with vertical position offset and Bahrain flag emblem).
- **6–9 Favorites Grid**: Layout options for 2x2, 3x2 (default), 3x3, and 2x3.
- **Display Target Routing**: Launch apps directly on Display 0 (Center console), Display 5 (Passenger display), Both displays, or prompt on every launch.
- **Auto-Hide Countdown Bar**: Dynamic progress bar counting down from 3 to 30 seconds with hover/touch pausing.
- **Running Apps Manager**: Process switcher with Display 0 / Display 5 toggles, individual app termination, and Close All.

### 2. DashDeck Studio (Instrument Cluster Widget Designer)
- **Target Resolution**: Specifically designed for Display 2 (ultra-wide 4032 × 284 px or 1920 × 720 px).
- **35 Columns × 5 Rows Grid**: Real-pixel cluster layout designer with 1x to 4x zoom levels.
- **Interactive Widgets**:
  - **Fuel Cost**: SAVED green leaf pill, VALUE in BD, FUEL litres burned, and ODO odometer reading.
  - **Prayer Times**: Ja'fari (Leva Institute), Muslim World League, and Umm al-Qura calculations with "Next prayer only" countdown and Athan Takbeer audio previews (Ali and Aqsa recordings).
  - **Weather**: Live Open-Meteo weather integration with temperature, condition icons, and wind speeds.
  - **Fuel & Battery**: Dual capsules (EV range + Petrol range) or single combined pill.
  - **RPM / Power**: Real-time powertrain kW dial and tachometer.
  - **Background Wallpaper**: Cyber Grid, Contour Gold, Light Streaks, Bahrain Flag, or custom upload with 0–100% opacity.
- **Themes**: Glass, Classic, Minimal, and an Arabic widget text switch.

### 3. My Trips & Deep Analysis (NewTrip Engine)
- **Live Cockpit**: Speedometer, Tachometer (RPM), Battery SoC gauge, Fuel gauge, and Gear PRND status.
- **Trip Recording**: Manual and automatic driving session recording (distance, duration, moving time, max/avg speed, energy kWh regen/consumed, fuel used).
- **Speed Tiers Analysis**: Breakdown into <30, 30–60, 60–90, 90–120, and >120 km/h bands.
- **Interactive Explorer**: Distance on x-axis with switchable curves for SoC %, Cumulative Fuel, and Speed profile.
- **Route Energy Forecast**: Aerodynamic road-load model predicting EV electric range, engine recharge behavior, and financial fuel savings.
- **Exporting**: CSV export (trips, speed tiers, drive modes) and fleet cloud sync overview.

### 4. Vehicle Safety Reminders & Settings
- **Seat Belt Reminder**: Alerts when moving > 35 km/h with front belts unbuckled. Features synthesized Marimba strike, Soft bell ping, and Digital beeps with progressive urgency levels.
- **Door Open in D/R**: Visual red banner and Triple chime / Rising chime / Falling chime cabin alerts.
- **Door Ajar Reminder**: Parked timer (5–60s) triggering outside horn blasts (Sedan twin-tone horn or Whistle swoop/chirp/trill) and hazard lights.
- **Web Audio Synthesis**: Fully synthesized sound engine matching original audio frequencies and harmonic distortion.
- **Developer Options**: Hidden diagnostics, 15-second simulation overrides, and CAN bus live signal monitor with wildcard searching (`*DOOR*`, `LHF*`, `*STS`).

### 5. DashBar App Store
- Catalog browser for Android Automotive apps with GitHub Releases and Aptoide lookup.
- Add custom GitHub repositories (`owner/repo`) or direct APK download links.

### 6. WebUSB ADB Car Installer
- Browser-based WebUSB direct flashing tool for connecting a laptop or tablet to the Jetour G700 via USB.
- One-click installation and automatic permission granting (`SYSTEM_ALERT_WINDOW`, `GET_USAGE_STATS`, battery exemption).

## Getting Started

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build production bundle
npm run build
```
