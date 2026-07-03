/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Teacher, AttendanceRecord, AttendanceStatus } from '../types';
import { Camera, QrCode, CheckCircle, Clock, Volume2, VolumeX, ShieldAlert, Sparkles, User, RefreshCw } from 'lucide-react';

interface QrAttendanceScannerProps {
  teachers: Teacher[];
  records: AttendanceRecord[];
  onSaveRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  selectedDate: string;
}

export default function QrAttendanceScanner({ teachers, records, onSaveRecord, selectedDate }: QrAttendanceScannerProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [scannedTeacher, setScannedTeacher] = useState<Teacher | null>(null);
  const [scanResult, setScanResult] = useState<{ status: AttendanceStatus; time: string; msg: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [activeQrDataUrl, setActiveQrDataUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Timer ref for auto-clearing scan screens
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesize terminal beep sound using Web Audio API (completely offline & local)
  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6 tone
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120.00, ctx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio Context not allowed or supported yet', e);
    }
  };

  // Generate QR Code data URL dynamically when selected teacher changes
  useEffect(() => {
    if (selectedTeacherId) {
      const t = teachers.find(teacher => teacher.id === selectedTeacherId);
      if (t) {
        // We embed teacher ID + NIP as the QR payload
        const qrPayload = JSON.stringify({ id: t.id, nip: t.nip, name: t.name });
        QRCode.toDataURL(qrPayload, { margin: 2, scale: 5, color: { dark: '#1e1b4b', light: '#ffffff' } })
          .then(url => {
            setActiveQrDataUrl(url);
          })
          .catch(err => {
            console.error('Error generating QR', err);
          });
      }
    } else {
      setActiveQrDataUrl('');
    }
  }, [selectedTeacherId, teachers]);

  // Execute scan simulation
  const handleSimulateScan = (teacherId: string, customStatus?: AttendanceStatus) => {
    if (!isScanningActive) return;
    setErrorMsg('');
    
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) {
      setErrorMsg('Guru tidak ditemukan.');
      playBeep('error');
      return;
    }

    if (teacher.status === 'nonaktif') {
      setErrorMsg(`Guru ${teacher.name} berstatus Nonaktif dan tidak dapat melakukan absensi.`);
      playBeep('error');
      return;
    }

    // Determine check-in status and time based on current actual clock or realistic simulation
    const now = new Date();
    const hoursStr = String(now.getHours()).padStart(2, '0');
    const minsStr = String(now.getMinutes()).padStart(2, '0');
    const timeOfScan = `${hoursStr}:${minsStr}`;

    // Decide if late or not (limit 07:15 is normal, above 07:15 is late)
    let status: AttendanceStatus = customStatus || 'hadir';
    let checkInTime = timeOfScan;
    
    if (!customStatus) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const limitMinutes = 7 * 60 + 15; // 07:15 AM
      if (currentMinutes > limitMinutes) {
        status = 'terlambat';
      }
    }

    // Save record via parent state
    onSaveRecord({
      teacherId: teacher.id,
      date: selectedDate,
      status,
      checkInTime: (status === 'hadir' || status === 'terlambat') ? checkInTime : undefined,
      notes: status === 'terlambat' ? 'Presensi otomatis via QR Terminal lobby' : undefined
    });

    // Display scanned state
    setScannedTeacher(teacher);
    setScanResult({
      status,
      time: checkInTime,
      msg: status === 'hadir' 
        ? 'PRESENSI BERHASIL - TEPAT WAKTU' 
        : status === 'terlambat' 
        ? 'PRESENSI BERHASIL - TERLAMBAT' 
        : `PRESENSI TERCATAT SEBAGAI ${status.toUpperCase()}`
    });

    playBeep('success');

    // Auto-reset screen after 4 seconds of idle
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setScannedTeacher(null);
      setScanResult(null);
    }, 4000);
  };

  // Handle manual code scan entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    // Search by NIP or ID or raw payload
    let foundTeacher: Teacher | null = null;
    let targetId = '';

    try {
      // Check if it is the JSON payload we generated
      const data = JSON.parse(manualCode);
      if (data && data.id) {
        targetId = data.id;
      }
    } catch {
      // It is plain text (NIP or Name)
      targetId = manualCode.trim();
    }

    foundTeacher = teachers.find(t => t.id === targetId || t.nip === targetId || t.name.toLowerCase().includes(targetId.toLowerCase())) || null;

    if (foundTeacher) {
      handleSimulateScan(foundTeacher.id);
      setManualCode('');
    } else {
      setErrorMsg('Format QR Code atau NIP Guru tidak terdaftar di sistem.');
      playBeep('error');
    }
  };

  return (
    <div className="space-y-6" id="qr-attendance-scanner-page">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="qr-scanner-header">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight uppercase">GERBANG ABSENSI QR CODE (TERMINAL LOBBY)</h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Presensi mandiri guru di lobi sekolah menggunakan scan QR Code Kartu Guru secara instant.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              soundEnabled 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>Suara Beep: {soundEnabled ? 'Aktif' : 'Senyap'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="qr-scanner-workspace">
        {/* Left Side: Gate Terminal Simulator View (Col 7) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between text-white relative overflow-hidden min-h-[500px]" id="scanner-terminal">
          {/* Cyberpunk scanning grids / accents */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">TERMINAL_GATE_01 // LIVE</span>
          </div>
          <div className="absolute top-4 right-4 text-right font-mono text-[10px] text-slate-500 font-bold">
            TANGGAL: {selectedDate}
          </div>

          {/* Scanner Middle Display Frame */}
          <div className="my-8 flex-1 flex flex-col items-center justify-center relative">
            {scannedTeacher && scanResult ? (
              /* Presensi Success Alert Screen */
              <div className="text-center space-y-4 animate-scale-up w-full max-w-sm p-6 rounded-2xl border bg-emerald-950/40 border-emerald-500/30">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400 animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                    scanResult.status === 'terlambat' 
                      ? 'bg-amber-950/50 text-amber-400 border-amber-500/30' 
                      : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {scanResult.msg}
                  </span>
                  
                  {/* Photo or Placeholder Avatar */}
                  <div className="mt-4 flex justify-center">
                    {scannedTeacher.photo ? (
                      <img
                        src={scannedTeacher.photo}
                        alt={scannedTeacher.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-400 shadow-md"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-xl ${scannedTeacher.photoColor} flex items-center justify-center font-black text-2xl tracking-wide border border-emerald-500/20`}>
                        {scannedTeacher.name.replace(/(Drs|H|S\.Pd|M\.Pd|S\.T|S\.Si|Dr|M\.Hum|\.)/g, '').trim()[0]}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mt-3 leading-tight">{scannedTeacher.name}</h3>
                  <p className="text-xs text-emerald-300 font-mono mt-1">NIP. {scannedTeacher.nip}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{scannedTeacher.subject}</p>
                </div>

                <div className="border-t border-emerald-500/10 pt-3 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span>WAKTU MASUK:</span>
                  <span className="font-bold text-emerald-400 text-sm">{scanResult.time} WIB</span>
                </div>
                
                <p className="text-[10px] text-slate-500 italic mt-2 animate-pulse">Menutup otomatis dalam beberapa detik...</p>
              </div>
            ) : errorMsg ? (
              /* Error Alert Screen */
              <div className="text-center space-y-4 animate-scale-up max-w-sm p-6 rounded-2xl border bg-rose-950/30 border-rose-500/30">
                <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/40">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <span className="bg-rose-950/60 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    PENGESAHAN GAGAL
                  </span>
                  <p className="text-xs text-slate-300 font-semibold mt-3">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setErrorMsg('')}
                  className="px-4 py-1.5 bg-rose-900/40 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-700/50 hover:bg-rose-900/60 transition cursor-pointer"
                >
                  Ulangi Pemindaian
                </button>
              </div>
            ) : (
              /* Standby Scanner Mode Frame */
              <div className="text-center space-y-6 w-full max-w-sm">
                {/* Aiming/Camera target laser simulation */}
                <div className="w-52 h-52 mx-auto border-2 border-dashed border-indigo-500/40 rounded-3xl relative flex items-center justify-center overflow-hidden bg-slate-950/50">
                  <div className="absolute inset-x-0 h-0.5 bg-indigo-500 opacity-60 animate-scan-line shadow-[0_0_10px_#4f46e5]"></div>
                  <Camera className="w-12 h-12 text-indigo-500/30 animate-pulse" />
                  <span className="absolute bottom-3 text-[9px] font-mono tracking-widest text-indigo-400/60 font-bold">KAMERA STANDBY</span>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-300 tracking-wide uppercase">HADAPKAN KARTU GURU KE SCANNER</h4>
                  <p className="text-xs text-slate-500 mt-1">Arahkan area QR Code pada ID Card guru Anda ke lensa pemindai secara horizontal.</p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Trigger bar / hardware console at bottom */}
          <div className="border-t border-slate-800 pt-4 flex flex-col md:flex-row items-center gap-3" id="scanner-bottom-console">
            <form onSubmit={handleManualSubmit} className="w-full flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Masukkan NIP / ID Guru secara manual untuk simulasi..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-xs font-mono outline-none text-slate-300 placeholder-slate-600"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition uppercase tracking-wider cursor-pointer"
              >
                Scan NIP
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: QR Code Generator & Simulation Panel (Col 5) */}
        <div className="lg:col-span-5 space-y-6" id="scanner-sim-controls">
          {/* Card 1: Dynamic QR Code Viewer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4" id="qr-viewer-card">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <QrCode className="w-4 h-4 text-indigo-600" />
              Generator QR Code Mandiri
            </h3>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Guru untuk Cetak QR / Tes Absen</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition cursor-pointer"
              >
                <option value="">-- Pilih Nama Guru --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (NIP: {t.nip})
                  </option>
                ))}
              </select>
            </div>

            {selectedTeacherId && activeQrDataUrl ? (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-fade-in" id="qr-result-box">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={activeQrDataUrl}
                    alt="Teacher QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                
                <div className="text-center max-w-xs">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">ISI QR CODE:</span>
                  <span className="text-[11px] font-semibold text-slate-700 block bg-white px-2 py-1 rounded border border-slate-200 mt-1 select-all break-all leading-tight font-mono">
                    {teachers.find(t => t.id === selectedTeacherId)?.name}
                  </span>
                </div>

                {/* Instant Actions for the Simulator */}
                <div className="w-full grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleSimulateScan(selectedTeacherId)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    Simulasi Scan
                  </button>
                  <button
                    onClick={() => handleSimulateScan(selectedTeacherId, 'terlambat')}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    Simulasi Terlambat
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 flex flex-col items-center justify-center min-h-[220px]">
                <QrCode className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
                <p className="text-xs font-bold uppercase text-slate-500">PILIH GURU TERLEBIH DAHULU</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal">QR Code dinamis akan otomatis ter-generate berdasarkan data NIP dan Nama Guru resmi.</p>
              </div>
            )}
          </div>

          {/* Card 2: Interactive Bulk Helper Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4" id="fast-scan-helper">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Tombol Cepat Simulasi Antrian Lobi
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Simulasikan guru-guru berikut mengantri di depan scanner lobi sekolah pada pagi hari kerja. Klik salah satu guru untuk melakukan scan QR instan:
            </p>

            <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 pr-1" id="lobby-queue">
              {teachers.filter(t => t.status === 'aktif').map(t => {
                const recordForToday = records.find(r => r.teacherId === t.id && r.date === selectedDate);
                const hasAbseb = !!recordForToday;
                
                return (
                  <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded ${t.photoColor} flex items-center justify-center font-bold text-[10px] shrink-0`}>
                        {t.name[0]}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 block truncate leading-tight">{t.name}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">NIP {t.nip}</span>
                      </div>
                    </div>
                    
                    {hasAbseb ? (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${
                        recordForToday.status === 'hadir' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : recordForToday.status === 'terlambat' 
                          ? 'bg-amber-50 text-amber-600 border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {recordForToday.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSimulateScan(t.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 font-bold text-[9px] rounded transition uppercase tracking-wider cursor-pointer shrink-0"
                      >
                        Scan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
