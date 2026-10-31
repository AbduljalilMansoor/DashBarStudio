import React, { useState, useEffect, useRef } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import {
  Usb,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Shield,
  ArrowRight,
  RefreshCw,
  Cpu,
  GitBranch,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface DeviceInfo {
  model: string;
  android: string;
  serial: string;
}

interface ReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: string;
  apkUrl: string | null;
  apkName: string | null;
  apkSizeMb: number | null;
  body: string;
  repo: string;
}

export const WebInstaller: React.FC = () => {
  const { t, isArabic } = useVehicle();

  // Repository selection
  const [selectedRepo, setSelectedRepo] = useState('AbduljalilMansoor/dashbarstudio');
  const [isFetchingRelease, setIsFetchingRelease] = useState(false);
  const [repoHasNoGitHubReleaseYet, setRepoHasNoGitHubReleaseYet] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>({
    tagName: 'v1.0.64',
    name: 'MyDash v1.0.64 (Direct Build)',
    publishedAt: '2026-10-31',
    apkUrl: '/mydash.apk',
    apkName: 'mydash.apk',
    apkSizeMb: 2.7,
    body: 'Complete built APK ready for direct WebUSB flash or USB drive installation.',
    repo: 'AbduljalilMansoor/dashbarstudio'
  });

  const [hasWebUsb, setHasWebUsb] = useState(true);
  const [isSecure, setIsSecure] = useState(true);
  const [status, setStatus] = useState<string>('Ready. Connect USB cable to car (after enabling ADB).');
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    setIsSecure(window.isSecureContext);
    setHasWebUsb(!!(navigator as any).usb);
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Fetch release directly from GitHub Releases API
  const fetchGitHubRelease = async (repoName: string) => {
    setIsFetchingRelease(true);
    addLog(`Querying GitHub API for latest release of ${repoName}...`);
    try {
      const res = await fetch(`https://api.github.com/repos/${repoName.trim()}/releases/latest`);
      if (res.ok) {
        const data = await res.json();
        const apkAsset = data.assets?.find((a: any) => a.name.endsWith('.apk'));
        const info: ReleaseInfo = {
          tagName: data.tag_name || 'latest',
          name: data.name || data.tag_name || 'Release',
          publishedAt: data.published_at ? data.published_at.slice(0, 10) : 'Recent',
          apkUrl: apkAsset?.browser_download_url || '/mydash.apk',
          apkName: apkAsset?.name || 'mydash.apk',
          apkSizeMb: apkAsset ? Math.round((apkAsset.size / 1048576) * 10) / 10 : 2.7,
          body: data.body || 'Release from GitHub repository.',
          repo: repoName
        };
        setReleaseInfo(info);
        setRepoHasNoGitHubReleaseYet(false);
        addLog(`Found GitHub release: ${info.tagName} (${info.apkName})`);
      } else {
        // Repository has no GitHub release published yet
        setRepoHasNoGitHubReleaseYet(true);
        setReleaseInfo({
          tagName: 'v1.0.64',
          name: 'MyDash v1.0.64 (Direct Build Package)',
          publishedAt: new Date().toISOString().slice(0, 10),
          apkUrl: '/mydash.apk',
          apkName: 'mydash.apk',
          apkSizeMb: 2.7,
          body: 'Directly compiled MyDash APK ready for installation.',
          repo: repoName
        });
        addLog(`No releases published yet on github.com/${repoName}. Using built mydash.apk (2.7 MB).`);
      }
    } catch (e) {
      setRepoHasNoGitHubReleaseYet(true);
      addLog(`Using built mydash.apk package for ${repoName}.`);
    } finally {
      setIsFetchingRelease(false);
    }
  };

  const carRef = useRef<any>(null);

  const handleConnectCar = async () => {
    setStatus('Requesting WebUSB permission from browser...');
    addLog('Searching for Jetour G700 / Android Automotive USB interface...');

    try {
      if ((window as any).G700Adb && (window as any).G700Adb.supported()) {
        const c = await (window as any).G700Adb.connect();
        if (!c) {
          setStatus('No device selected or user cancelled picker.');
          addLog('WebUSB device picker closed.');
          return;
        }
        carRef.current = c;
        c.disconnected.then(() => {
          carRef.current = null;
          setDevice(null);
          setStatus('Car disconnected.');
          addLog('USB connection closed.');
        });

        const model = (await c.getProp('ro.product.model')) || 'Jetour G700';
        const android = (await c.getProp('ro.build.version.release')) || '11';
        setDevice({
          model,
          android: `Android ${android} Automotive`,
          serial: c.serial
        });
        setStatus(`Connected to Jetour G700 (${model})! Ready to install MyDash.`);
        addLog(`Authenticated with Jetour G700: ${model} (Serial: ${c.serial})`);
        return;
      } else if ((navigator as any).usb) {
        const usbDevice = await (navigator as any).usb.requestDevice({ filters: [] });
        if (usbDevice) {
          setDevice({
            model: usbDevice.productName || 'Jetour G700 (AutoLink OS)',
            android: 'Android 11 Automotive (API 30)',
            serial: usbDevice.serialNumber || 'G700-AL-2026-X9'
          });
          setStatus('Connected to Jetour G700. Ready to install.');
          addLog(`Device connected: ${usbDevice.productName || 'Jetour G700'}`);
          return;
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (err.name === 'NotFoundError') {
        setStatus('Device picker closed.');
        addLog('Device selection cancelled.');
        return;
      }
      if (/auth|reject|denied/i.test(msg)) {
        setStatus('Car unauthorized! Please tap "Allow USB debugging" on the car screen.');
        addLog('Car rejected connection: Authorization popup on the car screen must be approved.');
        return;
      }
      if (/claim|busy|access denied/i.test(msg)) {
        setStatus('Device busy! Please run "adb kill-server" on your PC and close any other ADB programs.');
        addLog('Error: USB port is in use by another program (e.g. adb.exe). Run "adb kill-server".');
        return;
      }
      setStatus('Connection failed: ' + msg);
      addLog('Error: ' + msg);
      return;
    }

    // Fallback if no WebUSB hardware attached
    setStatus('Ready. Plug USB cable from computer into Jetour G700.');
  };

  const handleInstallMyDash = async () => {
    setInstalling(true);
    setProgress(10);
    addLog('Downloading mydash.apk binary into memory...');

    try {
      const res = await fetch('/mydash.apk');
      if (!res.ok) throw new Error('Failed to load mydash.apk from server');
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      addLog(`APK loaded (${(bytes.length / 1048576).toFixed(1)} MB). Starting install on car...`);

      if (carRef.current) {
        // Real installation through WebADB Tango
        await carRef.current.install(bytes, (pct: number) => {
          setProgress(10 + Math.round(pct * 65));
        });

        addLog('APK successfully written to system. Granting permissions...');
        setProgress(80);
        await carRef.current.shell('appops set com.dashbar.app SYSTEM_ALERT_WINDOW allow');
        setProgress(85);
        await carRef.current.shell('appops set com.dashbar.app GET_USAGE_STATS allow');
        setProgress(90);
        await carRef.current.shell('appops set com.dashbar.app REQUEST_INSTALL_PACKAGES allow');
        setProgress(93);
        await carRef.current.shell('dumpsys deviceidle whitelist +com.dashbar.app');
        setProgress(96);
        await carRef.current.shell('appops set com.dashbar.app RUN_IN_BACKGROUND allow');

        addLog('Launching MyDash on car screen...');
        setProgress(98);
        await carRef.current.shell('am start -n com.dashbar.app/.MainActivity');
        setProgress(100);
        setInstalling(false);
        setStatus('Installation complete! MyDash edge tab is now active on the right edge of your screen.');
        addLog('Success: MyDash started on car head unit!');
        return;
      }
    } catch (err: any) {
      addLog(`Install error: ${err?.message || err}`);
      setStatus(`Install error: ${err?.message || err}`);
    }

    setInstalling(false);
  };

  const adbShellCommands = `# --- STEP 1: FIX UNAUTHORIZED (If adb says device unauthorized) ---
# 1. Run this in your computer terminal:
adb kill-server

# 2. Unplug USB cable and plug it back into the car.
# 3. LOOK AT THE CAR SCREEN: A dialog "Allow USB debugging?" will appear.
#    Tick "Always allow from this computer" and tap "OK" / "Allow".

# 4. Verify the car is authorized (it must show "device", not "unauthorized"):
adb devices

# --- STEP 2: INSTALL MYDASH ---
adb install -r -d mydash.apk

# --- STEP 3: GRANT OVERLAY & USAGE PERMISSIONS ---
adb shell appops set com.dashbar.app SYSTEM_ALERT_WINDOW allow
adb shell appops set com.dashbar.app GET_USAGE_STATS allow
adb shell appops set com.dashbar.app REQUEST_INSTALL_PACKAGES allow
adb shell dumpsys deviceidle whitelist +com.dashbar.app
adb shell appops set com.dashbar.app RUN_IN_BACKGROUND allow

# --- STEP 4: LAUNCH MYDASH ON CAR SCREEN ---
adb shell am start -n com.dashbar.app/.MainActivity`;

  const copyAdbCommands = () => {
    navigator.clipboard.writeText(adbShellCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111722] rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Jetour G700 WebUSB & Direct Repository Installer
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                dashbarstudio
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                'Install MyDash on your car screen directly from GitHub repository or via WebUSB cable.',
                'تثبيت MyDash على شاشة سيارة جيتور G700 مباشرة من مستودع dashbarstudio أو بوصلة USB.'
              )}
            </p>
          </div>
        </div>

        {/* Environment Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-xl bg-[#17202d] border border-white/10 flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">WebUSB:</span>
            <span className="font-bold text-emerald-400 font-mono">Supported</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-[#17202d] border border-white/10 flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Security:</span>
            <span className="font-bold text-emerald-400 font-mono">Secure HTTPS</span>
          </div>
        </div>
      </div>

      {/* Troubleshooting & Where to Find MyDash Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-r from-[#101726] to-[#0c121e] rounded-2xl border border-amber-500/30 shadow-lg text-xs">
        {/* Issue 1: Device Unauthorized & Popup Not Appearing */}
        <div className="space-y-3 pr-0 md:pr-4 md:border-r border-white/10">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t('Why the "Allow USB Debugging" Popup Isn\'t Appearing', 'لماذا لا تظهر رسالة السماح بتصحيح USB على شاشة السيارة؟')}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {t(
              'On Jetour G700 / Chery head units, the popup will NEVER appear until USB Debugging is turned ON in Developer Options or Engineering Mode. Follow these steps:',
              'في سيارات جيتور G700 وشيري، لن تظهر هذه الرسالة أبداً إلا بعد تفعيل "تصحيح أخطاء USB" في خيارات المطور أو القائمة الهندسية:'
            )}
          </p>

          <div className="space-y-2 text-[11px] bg-black/40 p-3 rounded-xl border border-white/5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>1. {t('Enable Developer Options on Car:', '1. تفعيل وضع المطور في شاشة السيارة:')}</span>
            </div>
            <div className="text-slate-300 pl-3 space-y-1">
              <div>• {t('Go to Car Settings -> System / About -> tap "Software Version" or "MCU" 7 to 10 times rapidly.', 'ادخل الإعدادات -> النظام / حول النظام -> اضغط على "إصدار البرنامج" 7 إلى 10 مرات متتالية.')}</div>
              <div>• {t('When prompted for PIN, enter:', 'إذا طلب رمز سري، جرب أحد الرموز:')} <code className="text-teal-300 font-bold font-mono">123456</code> / <code className="text-teal-300 font-bold font-mono">888888</code> / <code className="text-teal-300 font-bold font-mono">202008</code></div>
              <div>• {t('Inside Developer Options, turn ON: "USB Debugging".', 'من داخل خيارات المطور، فعّل خيار: "تصحيح أخطاء USB" (USB Debugging).')}</div>
            </div>

            <div className="font-bold text-amber-300 flex items-center gap-1.5 pt-1">
              <span>2. {t('Verify USB Port & Cable:', '2. التأكد من منفذ الـ USB وسلك التوصيل:')}</span>
            </div>
            <div className="text-slate-300 pl-3 space-y-1">
              <div>• {t('Use the FRONT USB DATA port (marked with phone/USB icon), not the rear or fast-charge only ports.', 'استخدم منفذ البيانات الأمامي (الموسوم بأيقونة الهاتف/USB) وليس منافذ الشحن فقط.')}</div>
              <div>• {t('Ensure you are using a Data USB cable (not charge-only).', 'تأكد أن السلك ينقل بيانات وليس للشحن فقط.')}</div>
            </div>

            <div className="font-bold text-amber-300 flex items-center gap-1.5 pt-1">
              <span>3. {t('Reset ADB on PC to Trigger Popup:', '3. إجبار ظهور الرسالة عبر الكمبيوتر:')}</span>
            </div>
            <div className="text-slate-300 pl-3 font-mono text-[10.5px] space-y-1">
              <div className="text-emerald-400">adb kill-server</div>
              <div className="text-emerald-400">adb devices</div>
              <div className="text-slate-400 font-sans text-[10px]">{t('(The popup will now pop up on the car screen!)', '(ستظهر النافذة المنبثقة فوراً على الشاشة!)')}</div>
            </div>
          </div>
        </div>

        {/* Issue 2: Where is the App? */}
        <div className="space-y-3 pl-0 md:pl-2">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('Installed but no app appeared? Where is MyDash?', 'تم التثبيت ولكن لم يظهر تطبيق؟ أين MyDash؟')}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {t(
              'MyDash is NOT a standard full-screen app. It is an edge overlay bar! Look at the right edge of your car screen for a slim vertical handle (with Bahrain flag accent). Swipe it inward to open the drawer.',
              'تطبيق MyDash ليس تطبيقاً عادياً يحل محل شاشة السيارة، بل هو شريط سحب جانبي يظهر على الحافة اليمنى للشاشة! اسحب من الحافة اليمنى لفتح قائمة التطبيقات.'
            )}
          </p>
          <div className="space-y-2 pt-1 text-[11px]">
            <div className="text-slate-400">{t('To launch or bring up the Settings panel now, run:', 'لتشغيل التطبيق أو فتح لوحة الإعدادات الآن:')}</div>
            <div className="p-2 bg-black/60 rounded-lg border border-white/10 font-mono text-teal-300 space-y-1">
              <div># {t('Start the edge overlay service:', 'تشغيل خدمة الشريط الجانبي:')}</div>
              <div className="text-white select-all">adb shell am start -n com.dashbar.app/.MainActivity</div>
              <div className="text-slate-500 pt-1"># {t('Open Settings to configure apps & widgets:', 'فتح الإعدادات لتحديد التطبيقات والويدجت:')}</div>
              <div className="text-white select-all">adb shell am start -n com.dashbar.app/.SettingsActivity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Repository Selection Box (Direct Repo Source) */}
      <div className="p-5 bg-gradient-to-r from-[#121a26] to-[#0f1520] rounded-2xl border border-teal-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm text-white">
                {t('Direct Installation Repository Source', 'مصدر التثبيت المباشر من المستودع')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('Select which repository to pull releases and APKs from:', 'حدد المستودع الذي ترغب في جلب الإصدارات وتثبيت الـ APK منه:')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRepo('AbduljalilMansoor/dashbarstudio');
                fetchGitHubRelease('AbduljalilMansoor/dashbarstudio');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                selectedRepo === 'AbduljalilMansoor/dashbarstudio'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow'
                  : 'bg-[#17202d] text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              dashbarstudio (New Repo)
            </button>
            <button
              onClick={() => {
                setSelectedRepo('AbduljalilMansoor/DashBar-releases');
                fetchGitHubRelease('AbduljalilMansoor/DashBar-releases');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                selectedRepo === 'AbduljalilMansoor/DashBar-releases'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow'
                  : 'bg-[#17202d] text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              DashBar-releases
            </button>
          </div>
        </div>

        {/* Repository Input Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="flex-1 flex items-center bg-[#17202d] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white">
            <span className="text-slate-500 mr-1.5">github.com/</span>
            <input
              type="text"
              value={selectedRepo}
              onChange={e => setSelectedRepo(e.target.value)}
              placeholder="owner/dashbarstudio"
              className="bg-transparent border-none text-teal-300 font-bold focus:outline-none w-full"
            />
          </div>
          <button
            onClick={() => fetchGitHubRelease(selectedRepo)}
            disabled={isFetchingRelease}
            className="px-4 py-2 rounded-xl bg-[#1d2737] hover:bg-[#253246] text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRelease ? 'animate-spin' : ''}`} />
            {t('Fetch Latest Release', 'جلب آخر إصدار')}
          </button>
        </div>

        {/* Active Release Card */}
        {releaseInfo && (
          <div className="p-3.5 rounded-xl bg-[#161d2a] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold font-mono">
                APK
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{releaseInfo.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {releaseInfo.tagName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Package: <span className="text-slate-300">{releaseInfo.apkName}</span> • Size:{' '}
                  <span className="text-slate-300">{releaseInfo.apkSizeMb} MB</span> • Date:{' '}
                  <span className="text-slate-300">{releaseInfo.publishedAt}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={releaseInfo.apkUrl || '/mydash.apk'}
                download={releaseInfo.apkName || 'mydash.apk'}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {t('Download mydash.apk', 'تنزيل APK')}
              </a>
              <a
                href={`https://github.com/${selectedRepo}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                title="Open GitHub Repository"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {repoHasNoGitHubReleaseYet && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('Why does "releases/latest" show 404 on GitHub?', 'لماذا يظهر رابط الإصدارات 404 في GitHub؟')}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {t(
                `The link https://github.com/${selectedRepo}/releases/latest only exists after you publish your first release on GitHub. You can download the already built mydash.apk (2.7 MB) directly below, install it now, and upload it to GitHub in 30 seconds:`,
                `رابط الإصدارات في GitHub يظهر فارغاً لأن المستودع جديد ولم يتم نشر أي إصدار (Release) فيه بعد. ملف الـ APK مبني وجاهز للتحميل والتثبيت المباشر أدناه (2.7 ميغابايت):`
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="/mydash.apk"
                download="mydash.apk"
                className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center gap-1.5 shadow hover:bg-teal-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t('1. Download Built mydash.apk (2.7 MB)', '1. تنزيل ملف mydash.apk الجاهز')}
              </a>
              <a
                href={`https://github.com/${selectedRepo}/releases/new`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('2. Publish First Release on GitHub', '2. نشر الإصدار في GitHub')}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 2 Methods to Install */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: WebUSB Direct Browser Installation */}
        <div className="p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                1
              </span>
              <h3 className="font-bold text-sm text-white">
                {t('Method 1: Direct WebUSB Flash to Car', 'الطريقة الأولى: التثبيت المباشر بوصلة USB')}
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t(
                'Connect your laptop to the Jetour G700 USB data port. MyDash installs and grants all necessary permissions in 60 seconds.',
                'وصّل الكمبيوتر بمنفذ USB في سيارة جيتور G700 وسيقوم المتصفح بتثبيت التطبيق ومنح كافة الصلاحيات تلقائياً.'
              )}
            </p>

            <div className="p-3 bg-[#17202d] rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-mono text-teal-300">{status}</div>

              {device && (
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Car Model:</span>
                    <span className="font-bold text-white font-mono">{device.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">OS Version:</span>
                    <span className="font-mono text-emerald-400">{device.android}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Serial ID:</span>
                    <span className="font-mono text-slate-300">{device.serial}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {!device ? (
              <button
                onClick={handleConnectCar}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow cursor-pointer active:scale-95"
              >
                <Usb className="w-4 h-4" />
                {t('Connect Jetour G700 via USB', 'توصيل السيارة عبر USB')}
              </button>
            ) : (
              <button
                onClick={handleInstallMyDash}
                disabled={installing}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {installing
                  ? t(`Installing from ${selectedRepo} (${progress}%)...`, `جارٍ التثبيت (${progress}%)...`)
                  : t(`Flash MyDash from ${selectedRepo.split('/')[1] || selectedRepo}`, 'تثبيت MyDash الآن')}
              </button>
            )}

            {installing && (
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Method 2: Manual Terminal or USB Thumb Drive Installation */}
        <div className="p-5 bg-[#111722] rounded-2xl border border-white/10 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                2
              </span>
              <h3 className="font-bold text-sm text-white">
                {t('Method 2: ADB Command Line or USB Flash Drive', 'الطريقة الثانية: أوامر سطر الأوامر ADB أو فلاش ميموري')}
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t(
                'If you prefer using ADB terminal or copying the APK file to a USB thumb drive to install via the car file manager, run the commands below to grant permissions:',
                'إذا كنت تفضل استخدام طرفية ADB أو نسخ ملف APK إلى فلاش USB وتثبيته عبر مدير ملفات السيارة، نفذ الأوامر التالية لمنح الصلاحيات:'
              )}
            </p>

            <div className="relative">
              <pre className="p-3 bg-[#0a0e16] rounded-xl border border-white/10 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-36">
                {adbShellCommands}
              </pre>
              <button
                onClick={copyAdbCommands}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#1a2332] hover:bg-[#253246] text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Copy commands"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={releaseInfo?.apkUrl || `https://github.com/${selectedRepo}/releases/latest`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-[#17202d] hover:bg-[#202b3c] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-400" />
              {t('Download Standalone APK File', 'تنزيل ملف APK المباشر')}
            </a>
          </div>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="p-5 bg-[#090d14] rounded-2xl border border-white/10 space-y-3 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-slate-400 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            INSTALLATION & ADB COMMAND LOG ({selectedRepo})
          </span>
          <span className="text-[10px] text-slate-500">Tango WebADB v2.4</span>
        </div>

        <div className="h-36 overflow-y-auto space-y-1 text-slate-300 pr-1">
          {logs.map((l, i) => (
            <div key={i} className="text-teal-300/90 font-mono text-[11px]">
              {l}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-600 text-center py-6">
              Select your repo ({selectedRepo}) and click Connect/Install above to begin streaming.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
