/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Teacher, AttendanceRecord, AttendanceStatus } from '../types';
import { 
  Calendar, 
  Check, 
  Clock, 
  FileText, 
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  MessageSquare,
  Coffee,
  X
} from 'lucide-react';

interface DailyAttendanceProps {
  teachers: Teacher[];
  records: AttendanceRecord[];
  onSaveRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  onSaveBulkRecords: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DailyAttendance({ 
  teachers, 
  records, 
  onSaveRecord, 
  onSaveBulkRecords,
  selectedDate, 
  onDateChange 
}: DailyAttendanceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Holiday states
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayType, setHolidayType] = useState('Hari Libur Nasional');
  const [holidayNotes, setHolidayNotes] = useState('');
  
  // Local states for inline editing comments/time to avoid typing lag
  const [editingNotes, setEditingNotes] = useState<{ [teacherId: string]: string }>({});
  const [editingTime, setEditingTime] = useState<{ [teacherId: string]: string }>({});

  // Active (employed) teachers
  const activeTeachers = useMemo(() => {
    const list = teachers.filter(t => t.status === 'aktif');
    return [...list].sort((a, b) => {
      const hasNipA = !!(a.nip && a.nip.trim().length > 0);
      const hasNipB = !!(b.nip && b.nip.trim().length > 0);
      
      if (hasNipA && !hasNipB) return -1;
      if (!hasNipA && hasNipB) return 1;
      
      const getPriority = (sub: string) => {
        const s = (sub || '').toLowerCase();
        if (s.includes('bk') || s.includes('bimbingan')) return 2;
        if (s.includes('tenaga') || s.includes('kependidikan') || s.includes('staf') || s.includes('tu') || s.includes('administrasi')) return 3;
        return 1; // Guru Mapel / Default
      };
      
      const prioA = getPriority(a.subject);
      const prioB = getPriority(b.subject);
      
      if (prioA !== prioB) return prioA - prioB;
      
      return a.name.localeCompare(b.name);
    });
  }, [teachers]);

  // Attendance records for the selected date
  const recordsOnSelectedDate = useMemo(() => {
    return records.filter(r => r.date === selectedDate);
  }, [records, selectedDate]);

  // Map records by teacher ID for O(1) lookup
  const recordMapByTeacherId = useMemo(() => {
    const map: { [teacherId: string]: AttendanceRecord } = {};
    recordsOnSelectedDate.forEach(r => {
      map[r.teacherId] = r;
    });
    return map;
  }, [recordsOnSelectedDate]);

  // Filtered list of teachers for search
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return activeTeachers;
    return activeTeachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.nip.includes(searchQuery)
    );
  }, [activeTeachers, searchQuery]);

  // Status statistics for today
  const stats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    let libur = 0;
    
    recordsOnSelectedDate.forEach(r => {
      // make sure teacher is still active
      const exists = activeTeachers.some(t => t.id === r.teacherId);
      if (!exists) return;

      if (r.status === 'hadir') hadir++;
      else if (r.status === 'terlambat') terlambat++;
      else if (r.status === 'izin') izin++;
      else if (r.status === 'sakit') sakit++;
      else if (r.status === 'alpa') alpa++;
      else if (r.status === 'libur') libur++;
    });

    const totalTeachers = activeTeachers.length;
    const totalRecorded = recordsOnSelectedDate.length;
    const pending = totalTeachers - totalRecorded;

    return { hadir, terlambat, izin, sakit, alpa, libur, pending, totalTeachers };
  }, [recordsOnSelectedDate, activeTeachers]);

  // Perform bulk attendance for holidays
  const handleMarkAllLiburSubmit = (type: string, notes: string) => {
    const fullNote = notes.trim() ? `${type}: ${notes.trim()}` : type;
    const bulkData: Omit<AttendanceRecord, 'id'>[] = activeTeachers.map(teacher => ({
      teacherId: teacher.id,
      date: selectedDate,
      status: 'libur' as const,
      checkInTime: undefined,
      notes: fullNote
    }));
    onSaveBulkRecords(bulkData);
    setIsHolidayModalOpen(false);
    setHolidayNotes('');
  };

  // Perform bulk attendance: mark all remaining or all active teachers as present
  const handleMarkAllHadir = () => {
    const bulkData: Omit<AttendanceRecord, 'id'>[] = activeTeachers.map(teacher => {
      const existing = recordMapByTeacherId[teacher.id];
      return {
        teacherId: teacher.id,
        date: selectedDate,
        status: existing ? existing.status : 'hadir', // keep existing or set to 'hadir'
        checkInTime: existing ? existing.checkInTime : '07:00',
        notes: existing ? existing.notes : undefined
      };
    });

    // For any teacher who doesn't have a record yet, set to 'hadir'
    const newBulkData = activeTeachers.map(teacher => {
      const existing = recordMapByTeacherId[teacher.id];
      if (!existing) {
        return {
          teacherId: teacher.id,
          date: selectedDate,
          status: 'hadir' as const,
          checkInTime: '07:00',
          notes: undefined
        };
      }
      return null;
    }).filter((r): r is Omit<AttendanceRecord, 'id'> => r !== null);

    if (newBulkData.length === 0) {
      // If everyone is already marked, override everyone to 'hadir' as bulk action
      const overrideAll = activeTeachers.map(t => ({
        teacherId: t.id,
        date: selectedDate,
        status: 'hadir' as const,
        checkInTime: '07:00',
        notes: undefined
      }));
      onSaveBulkRecords(overrideAll);
    } else {
      onSaveBulkRecords(newBulkData);
    }
  };

  // Record/toggle attendance status for a single teacher
  const handleStatusChange = (teacherId: string, status: AttendanceStatus) => {
    const existing = recordMapByTeacherId[teacherId];
    
    let checkInTime = undefined;
    if (status === 'hadir') checkInTime = '07:00';
    if (status === 'terlambat') checkInTime = editingTime[teacherId] || '07:20';

    onSaveRecord({
      teacherId,
      date: selectedDate,
      status,
      checkInTime,
      notes: editingNotes[teacherId] || existing?.notes || undefined
    });
  };

  // Handle changes in notes
  const handleNotesChange = (teacherId: string, val: string) => {
    setEditingNotes(prev => ({ ...prev, [teacherId]: val }));
    
    // Save to database/state immediately if record exists
    const existing = recordMapByTeacherId[teacherId];
    if (existing) {
      onSaveRecord({
        ...existing,
        notes: val.trim() || undefined
      });
    }
  };

  // Handle changes in arrival time
  const handleTimeChange = (teacherId: string, val: string) => {
    setEditingTime(prev => ({ ...prev, [teacherId]: val }));
    
    // Save immediately if record exists and is "terlambat" or "hadir"
    const existing = recordMapByTeacherId[teacherId];
    if (existing && (existing.status === 'terlambat' || existing.status === 'hadir')) {
      onSaveRecord({
        ...existing,
        checkInTime: val
      });
    }
  };

  return (
    <div className="space-y-6" id="daily-att-container">
      {/* Upper Control Bar - Styled with Geometric Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200" id="daily-att-controls">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Tanggal Absen</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-indigo-600 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="attendance-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:bg-white rounded-lg text-xs font-bold text-slate-700 outline-none transition cursor-pointer"
              />
            </div>
          </div>
          
          <div className="border-l border-slate-200 h-10 hidden sm:block"></div>

          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">PENCATATAN HARIAN</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Isi status kehadiran guru pada hari kerja efektif.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto w-full md:w-auto">
          <button
            id="btn-mark-all-hadir"
            onClick={handleMarkAllHadir}
            className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 border border-emerald-200 flex-1 md:flex-initial"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Set Semua Guru Hadir
          </button>

          <button
            id="btn-mark-all-libur"
            onClick={() => setIsHolidayModalOpen(true)}
            className="px-4 py-2.5 bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 border border-violet-200 flex-1 md:flex-initial"
          >
            <Coffee className="w-4 h-4 text-violet-600" />
            Set Hari Libur / Cuti
          </button>
        </div>
      </div>

      {/* Progress & Stat Header - Styled as geometric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4" id="daily-att-stats">
        {/* Progress Tracker Card */}
        <div className="sm:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
          {stats.pending === 0 ? (
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Absensi</h4>
            <p className="text-base font-extrabold text-slate-800 tracking-tight mt-0.5">
              {stats.totalTeachers - stats.pending} / {stats.totalTeachers} Diabsen
            </p>
            {stats.pending > 0 ? (
              <p className="text-[10px] text-amber-600 font-bold mt-0.5 uppercase tracking-wide">Ada {stats.pending} guru belum tercatat</p>
            ) : (
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5 uppercase tracking-wide">Semua guru selesai diabsen</p>
            )}
          </div>
        </div>

        {/* Status Pills Summary */}
        <div className="sm:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-around flex-wrap gap-4">
          <div className="text-center min-w-[50px]">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Hadir</span>
            <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block">{stats.hadir}</span>
          </div>
          <div className="text-center min-w-[50px]">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Izin</span>
            <span className="text-lg font-extrabold text-sky-600 mt-0.5 block">{stats.izin}</span>
          </div>
          <div className="text-center min-w-[50px]">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Sakit</span>
            <span className="text-lg font-extrabold text-indigo-600 mt-0.5 block">{stats.sakit}</span>
          </div>
          <div className="text-center min-w-[50px]">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Alpa</span>
            <span className="text-lg font-extrabold text-rose-500 mt-0.5 block">{stats.alpa}</span>
          </div>
          <div className="text-center min-w-[50px]">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Libur/Cuti</span>
            <span className="text-lg font-extrabold text-violet-600 mt-0.5 block">{stats.libur}</span>
          </div>
        </div>
      </div>

      {/* Main Recording Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" id="daily-recording-card">
        {/* Toolbar with Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-att-teacher-input"
              type="text"
              placeholder="Cari guru yang ingin diabsen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded-lg text-xs font-semibold outline-none text-slate-700"
            />
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Klik tombol status untuk menyimpan perubahan secara otomatis.</span>
          </div>
        </div>

        {filteredTeachers.length > 0 ? (
          <div className="divide-y divide-slate-100" id="att-teachers-list">
            {filteredTeachers.map((teacher) => {
              const record = recordMapByTeacherId[teacher.id];
              const isHadir = record?.status === 'hadir';
              const isTerlambat = record?.status === 'terlambat';
              const isIzin = record?.status === 'izin';
              const isSakit = record?.status === 'sakit';
              const isAlpa = record?.status === 'alpa';
              const isLibur = record?.status === 'libur';
              const isUnrecorded = !record;

              // Local controlled notes and arrival time or from existing records
              const currentNotes = editingNotes[teacher.id] !== undefined 
                ? editingNotes[teacher.id] 
                : (record?.notes || '');
              const currentTime = editingTime[teacher.id] !== undefined 
                ? editingTime[teacher.id] 
                : (record?.checkInTime || '07:15');

              return (
                <div key={teacher.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/30 transition">
                  {/* Left Column: Teacher Identity */}
                  <div className="flex items-center gap-3 min-w-[200px] max-w-xs shrink-0">
                    <div className={`w-9 h-9 rounded-lg ${teacher.photoColor} flex items-center justify-center font-bold text-xs tracking-wider shadow-inner`}>
                      {teacher.name.replace(/(Drs|H|S\.Pd|M\.Pd|S\.T|S\.Si|Dr|M\.Hum|\.)/g, '').trim()[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 text-sm block leading-tight truncate">{teacher.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wide truncate">{teacher.subject} • NIP {teacher.nip}</span>
                    </div>
                  </div>

                  {/* Middle / Details Action Column */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Status Button Toggle Row */}
                    <div className="flex flex-wrap items-center gap-1.5" id={`status-toggles-${teacher.id}`}>
                      {/* HADIR */}
                      <button
                        onClick={() => handleStatusChange(teacher.id, 'hadir')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isHadir 
                            ? 'bg-emerald-500 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isHadir && <Check className="w-3.5 h-3.5" />}
                        Hadir
                      </button>

                      {/* IZIN */}
                      <button
                        onClick={() => handleStatusChange(teacher.id, 'izin')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isIzin 
                            ? 'bg-sky-500 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isIzin && <Check className="w-3.5 h-3.5" />}
                        Izin
                      </button>

                      {/* SAKIT */}
                      <button
                        onClick={() => handleStatusChange(teacher.id, 'sakit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSakit 
                            ? 'bg-indigo-500 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isSakit && <Check className="w-3.5 h-3.5" />}
                        Sakit
                      </button>

                      {/* ALPA */}
                      <button
                        onClick={() => handleStatusChange(teacher.id, 'alpa')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isAlpa 
                            ? 'bg-rose-500 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isAlpa && <Check className="w-3.5 h-3.5" />}
                        Alpa
                      </button>

                      {/* LIBUR / CUTI */}
                      <button
                        onClick={() => handleStatusChange(teacher.id, 'libur')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isLibur 
                            ? 'bg-violet-600 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isLibur && <Check className="w-3.5 h-3.5" />}
                        Libur/Cuti
                      </button>

                      {isUnrecorded && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                          Belum Diabsen
                        </span>
                      )}
                    </div>

                    {/* Sub-inputs dependent on chosen status */}
                    {(isIzin || isSakit || isLibur) && (
                      <div className="flex flex-col sm:flex-row gap-2.5 items-center mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 animate-slide-up" id={`sub-inputs-${teacher.id}`}>
                        
                        <div className="relative flex-1 w-full">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder={
                              isIzin 
                                ? "Alasan izin (contoh: menghadiri nikahan)..." 
                                : isLibur
                                  ? "Keterangan libur/cuti (contoh: Cuti Bersama, Hari Raya)..."
                                  : "Keterangan sakit (contoh: surat dokter ada)..."
                            }
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(teacher.id, e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 text-xs rounded-lg outline-none font-semibold text-slate-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center" id="no-att-teachers-found">
            <h3 className="text-xs font-bold text-slate-800 uppercase">Tidak ada guru ditemukan</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Sesuaikan kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* Holiday/Cuti Bersama Dialog Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="holiday-bulk-modal">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-xl overflow-hidden p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Set Hari Libur / Cuti Bersama</h3>
              </div>
              <button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Tindakan ini akan mencatatkan status <strong className="text-violet-600">"Libur/Cuti"</strong> untuk seluruh guru aktif pada tanggal <strong className="text-slate-700">{selectedDate}</strong> secara massal.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Libur</label>
                <select
                  value={holidayType}
                  onChange={(e) => setHolidayType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-600 transition"
                >
                  <option value="Hari Libur Nasional">Hari Libur Nasional</option>
                  <option value="Cuti Bersama">Cuti Bersama</option>
                  <option value="Libur Semester/Sekolah">Libur Semester/Sekolah</option>
                  <option value="Libur Khusus/Lainnya">Libur Khusus/Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Hari Libur / Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Tahun Baru Hijriah, Cuti Bersama Idul Fitri..."
                  value={holidayNotes}
                  onChange={(e) => setHolidayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-violet-600 rounded-lg text-xs font-semibold outline-none text-slate-700 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleMarkAllLiburSubmit(holidayType, holidayNotes)}
                className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs transition"
              >
                Simpan &amp; Terapkan Masal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
