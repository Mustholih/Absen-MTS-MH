/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { Teacher } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  X, 
  UserPlus, 
  UserCheck, 
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  QrCode,
  Printer,
  Upload,
  User as UserIcon
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'photoColor'>) => void;
  onAddBulkTeachers?: (teachersList: Omit<Teacher, 'id' | 'photoColor'>[]) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

const PHOTO_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700'
];

export default function TeacherManagement({ teachers, onAddTeacher, onAddBulkTeachers, onUpdateTeacher, onDeleteTeacher }: TeacherManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  // Delete confirm state
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Form states
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  
  const [formError, setFormError] = useState('');

  // Photo & Card states
  const [photo, setPhoto] = useState('');
  const [selectedTeacherForIdCard, setSelectedTeacherForIdCard] = useState<Teacher | null>(null);
  const [cardQrUrl, setCardQrUrl] = useState('');
  const [schoolProfile, setSchoolProfile] = useState<any>(null);

  // --- Bulk Excel Import States ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPasteText, setImportPasteText] = useState('');
  const [importParsedData, setImportParsedData] = useState<any[]>([]);
  const [importError, setImportError] = useState('');

  // --- Custom QR Code States ---
  const [selectedTeacherForCustomQr, setSelectedTeacherForCustomQr] = useState<Teacher | null>(null);
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [qrSize, setQrSize] = useState<number>(240);
  const [qrBgColor, setQrBgColor] = useState<string>('#ffffff');
  const [qrTextColor, setQrTextColor] = useState<string>('#0f172a');
  const [qrBorderColor, setQrBorderColor] = useState<string>('#475569');
  const [qrBorderStyle, setQrBorderStyle] = useState<'solid' | 'dashed' | 'double' | 'dotted' | 'none'>('solid');
  const [qrBorderWidth, setQrBorderWidth] = useState<number>(4);
  const [qrShowName, setQrShowName] = useState<boolean>(true);
  const [qrShowNip, setQrShowNip] = useState<boolean>(true);
  const [qrShowSubject, setQrShowSubject] = useState<boolean>(true);
  const [qrCustomTitle, setQrCustomTitle] = useState<string>('KARTU ABSENSI PRESENSI GURU');

  // Generate Custom QR Code url on selection
  useEffect(() => {
    if (selectedTeacherForCustomQr) {
      const payload = JSON.stringify({
        id: selectedTeacherForCustomQr.id,
        nip: selectedTeacherForCustomQr.nip,
        name: selectedTeacherForCustomQr.name
      });
      QRCode.toDataURL(payload, { margin: 1, scale: 10 })
        .then(url => setCustomQrUrl(url))
        .catch(err => console.error('Error generating custom QR', err));
    } else {
      setCustomQrUrl('');
    }
  }, [selectedTeacherForCustomQr]);

  // Handle parsing spreadsheet clipboard text or CSV content
  const handleParseImport = (text: string) => {
    setImportError('');
    if (!text.trim()) {
      setImportError('Data kosong. Silakan tempelkan data atau pilih file.');
      return;
    }

    const lines = text.trim().split('\n');
    const tempRows: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cells: string[] = [];
      if (line.includes('\t')) {
        cells = line.split('\t');
      } else if (line.includes(';')) {
        cells = line.split(';');
      } else {
        cells = line.split(',');
      }

      cells = cells.map(c => c.replace(/^["']|["']$/g, '').trim());

      // Skip header row if it resembles headers
      if (i === 0 && (
        line.toLowerCase().includes('nama') || 
        line.toLowerCase().includes('nip') || 
        line.toLowerCase().includes('subject') || 
        line.toLowerCase().includes('pelajaran') ||
        line.toLowerCase().includes('kontak')
      )) {
        continue;
      }

      let rowNip = '';
      let rowName = '';
      let rowSubject = '';
      let rowContact = '';

      if (cells.length >= 4) {
        rowNip = cells[0];
        rowName = cells[1];
        rowSubject = cells[2];
        rowContact = cells[3];
      } else if (cells.length === 3) {
        rowName = cells[0];
        rowSubject = cells[1];
        rowContact = cells[2];
      } else if (cells.length === 2) {
        rowName = cells[0];
        rowSubject = cells[1];
      } else if (cells.length === 1) {
        rowName = cells[0];
      }

      // We only insert if the rowName is not empty
      if (rowName) {
        tempRows.push({
          nip: rowNip,
          name: rowName,
          subject: rowSubject || 'Umum',
          contact: rowContact || '08123456789'
        });
      }
    }

    if (tempRows.length === 0) {
      setImportError('Format data tidak sesuai atau kolom nama tidak ditemukan.');
    } else {
      setImportParsedData(tempRows);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportPasteText(text);
      handleParseImport(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (importParsedData.length === 0) return;
    
    if (onAddBulkTeachers) {
      const items = importParsedData.map(row => ({
        nip: row.nip,
        name: row.name,
        subject: row.subject,
        contact: row.contact,
        status: 'aktif' as const,
        photo: ''
      }));
      onAddBulkTeachers(items);
    } else {
      importParsedData.forEach(row => {
        onAddTeacher({
          nip: row.nip,
          name: row.name,
          subject: row.subject,
          contact: row.contact,
          status: 'aktif',
          photo: ''
        });
      });
    }

    setIsImportModalOpen(false);
    setImportPasteText('');
    setImportParsedData([]);
    setImportError('');
  };

  // Load school profile details for the ID card
  useEffect(() => {
    const stored = localStorage.getItem('school_profile_data');
    if (stored) {
      try {
        setSchoolProfile(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedTeacherForIdCard]);

  // Generate QR code URL on card select
  useEffect(() => {
    if (selectedTeacherForIdCard) {
      // Create JSON payload for secure, standard attendance scanning
      const payload = JSON.stringify({
        id: selectedTeacherForIdCard.id,
        nip: selectedTeacherForIdCard.nip,
        name: selectedTeacherForIdCard.name
      });
      QRCode.toDataURL(payload, { margin: 1, scale: 6 })
        .then(url => setCardQrUrl(url))
        .catch(err => console.error('Error generating card QR', err));
    } else {
      setCardQrUrl('');
    }
  }, [selectedTeacherForIdCard]);

  // Extract unique subjects for the filter dropdown
  const subjectsList = useMemo(() => {
    const list = new Set(teachers.map(t => t.subject));
    return ['Semua', ...Array.from(list)];
  }, [teachers]);

  // Filter teachers based on search query, subject, and status
  const filteredTeachers = useMemo(() => {
    const list = teachers.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.nip.includes(searchQuery);
      const matchesSubject = subjectFilter === 'Semua' || t.subject === subjectFilter;
      const matchesStatus = statusFilter === 'Semua' || t.status === statusFilter;
      
      return matchesSearch && matchesSubject && matchesStatus;
    });

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
  }, [teachers, searchQuery, subjectFilter, statusFilter]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setNip('');
    setName('');
    setSubject('');
    setContact('');
    setStatus('aktif');
    setPhoto('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setNip(teacher.nip);
    setName(teacher.name);
    setSubject(teacher.subject);
    setContact(teacher.contact);
    setStatus(teacher.status);
    setPhoto(teacher.photo || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!name.trim()) {
      setFormError('Nama guru wajib diisi.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Tugas utama wajib diisi.');
      return;
    }
    if (!contact.trim()) {
      setFormError('Nomor kontak wajib diisi.');
      return;
    }

    // NIP validation: digits only, only if filled
    if (nip.trim() && !/^\d+$/.test(nip.replace(/\s/g, ''))) {
      setFormError('NIP harus berupa angka saja.');
      return;
    }

    if (editingTeacher) {
      // Check duplicate NIP on edit (if changed and not empty)
      if (nip.trim() && nip.trim() !== editingTeacher.nip) {
        const duplicate = teachers.some(t => t.id !== editingTeacher.id && t.nip === nip.trim());
        if (duplicate) {
          setFormError('Guru dengan NIP tersebut sudah terdaftar.');
          return;
        }
      }

      onUpdateTeacher({
        ...editingTeacher,
        nip: nip.trim(),
        name: name.trim(),
        subject: subject.trim(),
        contact: contact.trim(),
        status,
        photo
      });
    } else {
      // Check if NIP is duplicate (only if filled)
      if (nip.trim()) {
        const duplicate = teachers.some(t => t.nip === nip.trim());
        if (duplicate) {
          setFormError('Guru dengan NIP tersebut sudah terdaftar.');
          return;
        }
      }

      onAddTeacher({
        nip: nip.trim(),
        name: name.trim(),
        subject: subject.trim(),
        contact: contact.trim(),
        status,
        photo
      });
    }

    setIsModalOpen(false);
  };

  const confirmDelete = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
  };

  const executeDelete = () => {
    if (teacherToDelete) {
      onDeleteTeacher(teacherToDelete.id);
      setTeacherToDelete(null);
    }
  };

  return (
    <div className="space-y-6" id="teacher-mgmt-container">
      {/* Header Panel - Styled with Geometric Balance Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="teacher-mgmt-header">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight uppercase">MANAJEMEN DATA GURU</h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Kelola data induk pendidik, tugas utama, dan informasi kontak.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            id="btn-import-guru"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Excel / CSV
          </button>
          <button
            id="btn-tambah-guru"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Guru Baru
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar - Sleek and structured border layout */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between" id="teacher-mgmt-toolbar">
        {/* Search Input block */}
        <div className="relative flex-1" id="search-wrapper">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="search-teacher-input"
            type="text"
            placeholder="Cari berdasarkan NIP atau nama guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Filters dropdowns - Geometric and centered */}
        <div className="flex flex-wrap gap-3 items-center" id="filters-wrapper">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="relative" id="filter-subject-wrapper">
            <select
              id="filter-subject-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 outline-none hover:bg-slate-100 transition cursor-pointer"
            >
              {subjectsList.map((subj) => (
                <option key={subj} value={subj}>{subj === 'Semua' ? 'Tugas Utama: Semua' : subj}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative" id="filter-status-wrapper">
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 outline-none hover:bg-slate-100 transition cursor-pointer"
            >
              <option value="Semua">Status: Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Teachers List Grid/Table - Clean Geometric Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden" id="teacher-table-card">
        {filteredTeachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="teachers-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Guru</th>
                  <th className="px-6 py-4">NIP</th>
                  <th className="px-6 py-4">Tugas Utama</th>
                  <th className="px-6 py-4">Hubungi / Kontak</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {filteredTeachers.map((teacher) => {
                  // Generate initials
                  const initials = teacher.name
                    .replace(/(Drs|H|S\.Pd|M\.Pd|S\.T|S\.Si|Dr|M\.Hum|\.)/g, '')
                    .trim()
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('') || 'G';

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0">
                            {teacher.photo ? (
                              <img
                                src={teacher.photo}
                                alt={teacher.name}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-lg ${teacher.photoColor || 'bg-indigo-100 text-indigo-700'} flex items-center justify-center font-bold text-xs tracking-wide`}>
                                {initials}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{teacher.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{teacher.subject}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs font-bold">{teacher.nip || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 inline-block">
                          {teacher.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <a 
                          href={`https://wa.me/${teacher.contact.replace(/^0/, '62')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 font-bold transition"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{teacher.contact}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          teacher.status === 'aktif' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {teacher.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            id={`btn-id-card-${teacher.id}`}
                            onClick={() => setSelectedTeacherForIdCard(teacher)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Cetak ID Card KTP"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-custom-qr-${teacher.id}`}
                            onClick={() => setSelectedTeacherForCustomQr(teacher)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Cetak QR Code Besar & Custom"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-${teacher.id}`}
                            onClick={() => openEditModal(teacher)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Data Guru"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${teacher.id}`}
                            onClick={() => confirmDelete(teacher)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center" id="no-teachers-found">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase">Tidak ada guru ditemukan</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Coba sesuaikan pencarian atau filter Anda.</p>
          </div>
        )}
      </div>

      {/* Save / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="teacher-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                {editingTeacher ? <Edit className="w-4 h-4 text-indigo-600" /> : <UserPlus className="w-4 h-4 text-indigo-600" />}
                {editingTeacher ? 'Ubah Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* NIP Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">NIP (Opsional - Kosongkan jika belum PNS/ASN)</label>
                <input
                  id="modal-teacher-nip"
                  type="text"
                  placeholder="Boleh dikosongkan jika belum PNS/ASN"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                />
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap &amp; Gelar</label>
                <input
                  id="modal-teacher-name"
                  type="text"
                  placeholder="Contoh: Hendra Wijaya, S.Kom."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tugas Utama</label>
                <input
                  id="modal-teacher-subject"
                  type="text"
                  placeholder="Contoh: Guru Mapel, Guru BK, Tenaga Kependidikan"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                />
              </div>

              {/* Contact Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nomor Kontak (WhatsApp / Telp)</label>
                <input
                  id="modal-teacher-contact"
                  type="text"
                  placeholder="Contoh: 081299887766"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                />
              </div>

              {/* Status Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status Penugasan</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="aktif"
                      checked={status === 'aktif'}
                      onChange={() => setStatus('aktif')}
                      className="text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                    />
                    Aktif Mengajar
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="nonaktif"
                      checked={status === 'nonaktif'}
                      onChange={() => setStatus('nonaktif')}
                      className="text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                    />
                    Cuti / Nonaktif
                  </label>
                </div>
              </div>

              {/* Photo Upload Field */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Foto Profil Guru (Opsional)</label>
                <div className="flex items-center gap-3">
                  {photo ? (
                    <div className="relative shrink-0">
                      <img
                        src={photo}
                        alt="Preview Guru"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setPhoto('')}
                        className="absolute -top-1.5 -right-1.5 bg-rose-100 text-rose-600 rounded-full p-0.5 border border-rose-200 hover:bg-rose-200 transition"
                        id="btn-remove-photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}

                  <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg cursor-pointer transition uppercase tracking-wider">
                    Unggah Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024 * 2) {
                            alert('File foto maksimal 2MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">PNG/JPG maks. 2MB. Default adalah inisial nama.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {teacherToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hapus Data Guru?</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Apakah Anda yakin ingin menghapus <strong>{teacherToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan dan semua riwayat absensi guru ini akan disembunyikan.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-2 justify-end border-t border-slate-200">
              <button
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cetak Kartu QR Guru Modal (KTP Size Aspect Ratio) */}
      {selectedTeacherForIdCard && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:bg-white print:p-0 print:overflow-visible print:relative" id="id-card-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:max-w-none print:w-auto">
            {/* Modal Header (Hidden on print) */}
            <div className="p-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600 animate-pulse" />
                Cetak ID Card Guru (Ukuran KTP)
              </h3>
              <button
                onClick={() => setSelectedTeacherForIdCard(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: The Card and Preview */}
            <div className="p-6 space-y-6 flex flex-col items-center justify-center bg-slate-100/50 print:bg-white print:p-0">
              
              {/* The ID Card Container - Set to exactly KTP dimensions (85.6mm x 53.98mm) during printing */}
              <div 
                id="printable-id-card-area"
                className="w-[85.6mm] h-[53.98mm] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700 rounded-2xl p-3.5 text-white flex flex-col justify-between relative shadow-lg overflow-hidden select-none print:shadow-none print:border print:rounded-2xl shrink-0"
              >
                {/* Decorative circuit/geometric mesh accents */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

                {/* Card Header (Formal) */}
                <div className="flex items-center gap-2 border-b border-white/20 pb-1.5 relative z-10 shrink-0">
                  <div className="w-6 h-6 bg-white/15 rounded flex items-center justify-center border border-white/20 shrink-0 overflow-hidden">
                    {schoolProfile?.logoImage ? (
                      <img src={schoolProfile.logoImage} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : schoolProfile?.logoRightImage ? (
                      <img src={schoolProfile.logoRightImage} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[8px] font-black uppercase tracking-wide truncate text-indigo-100">
                      {schoolProfile?.schoolName || 'MTsS MIFTAHUL HUDA'}
                    </h4>
                    <span className="text-[6px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none">
                      KARTU IDENTITAS GURU &amp; ABSENSI QR
                    </span>
                  </div>
                </div>

                {/* Card Body Contents (Photo, details, QR) */}
                <div className="flex-1 flex gap-3.5 items-center my-1.5 relative z-10">
                  {/* Photo Left */}
                  <div className="w-[20mm] h-[26mm] border border-white/20 rounded bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedTeacherForIdCard.photo ? (
                      <img
                        src={selectedTeacherForIdCard.photo}
                        alt="Foto ID Card"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-white/40 flex flex-col items-center">
                        <UserIcon className="w-6 h-6 mb-1" />
                        <span className="text-[5px] font-bold uppercase tracking-wider block">NO PHOTO</span>
                      </div>
                    )}
                  </div>

                  {/* Middle Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                    <div>
                      <span className="text-[5px] font-bold text-indigo-300 block leading-none uppercase tracking-wider">NAMA LENGKAP:</span>
                      <h5 className="text-[9px] font-black text-white leading-tight truncate">
                        {selectedTeacherForIdCard.name}
                      </h5>
                    </div>
                    <div>
                      <span className="text-[5px] font-bold text-indigo-300 block leading-none uppercase tracking-wider">NIP PEGURUS:</span>
                      <span className="text-[7.5px] font-mono font-bold text-indigo-100 leading-none">
                        {selectedTeacherForIdCard.nip || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[5px] font-bold text-indigo-300 block leading-none uppercase tracking-wider">TUGAS UTAMA:</span>
                      <span className="text-[7.5px] font-bold text-slate-300 leading-none truncate block">
                        {selectedTeacherForIdCard.subject}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Right */}
                  <div className="w-[18mm] h-[18mm] bg-white p-1 rounded-lg flex items-center justify-center shrink-0 border border-white/20 shadow-md">
                    {cardQrUrl ? (
                      <img
                        src={cardQrUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 animate-spin"></div>
                    )}
                  </div>
                </div>

                {/* Card Footer (Validates identity) */}
                <div className="flex items-center justify-between border-t border-white/10 pt-1 relative z-10 shrink-0">
                  <span className="text-[5px] font-bold text-slate-400 font-mono">
                    NPSN: {schoolProfile?.npsn || '10293847'}
                  </span>
                  <span className="text-[5px] font-black text-indigo-300 tracking-wider">
                    SISTEM ABSENSI ELEKTRONIK (QR-GATE)
                  </span>
                </div>
              </div>

              {/* ID Card Printing instruction (Hidden on print) */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 font-medium leading-normal w-full print:hidden">
                <strong>Standard ID Card KTP:</strong> Dimensi kartu di atas telah diatur secara presisi sebesar <code>85.6mm x 53.98mm</code>. Klik tombol cetak di bawah untuk mencetak kartu ini secara instant melalui printer kartu atau kertas tebal.
              </div>
            </div>

            {/* Modal Footer Controls (Hidden on print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setSelectedTeacherForIdCard(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Kartu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bulk Excel / CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="import-excel-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-slate-800 animate-bounce" />
                Import Guru Massal dari Excel / CSV
              </h3>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPasteText('');
                  setImportParsedData([]);
                  setImportError('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 leading-normal">
                <strong className="block mb-1">Panduan Penggunaan:</strong>
                Anda dapat menyalin (Copy) kolom data guru dari Microsoft Excel, Google Sheets, atau WPS, lalu menempelkannya (Paste) langsung ke kotak di bawah ini. Aturan susunan kolom:
                <ul className="list-disc pl-4 mt-1.5 space-y-1 font-semibold">
                  <li>Kolom 1: NIP (Opsional, boleh kosong jika belum PNS/ASN)</li>
                  <li>Kolom 2: Nama Guru (Wajib)</li>
                  <li>Kolom 3: Tugas Utama (Wajib, contoh: Guru Mapel, Guru BK, Tenaga Kependidikan)</li>
                  <li>Kolom 4: No HP / Kontak (Wajib, contoh: 0812345678)</li>
                </ul>
                <p className="mt-2 text-[10px] text-slate-500 italic">Sistem akan otomatis mengenali batas baris dan kolom tabulasi.</p>
              </div>

              {/* Upload & Area Selectors */}
              <div className="grid grid-cols-2 gap-3" id="import-type-selectors">
                <label className="border border-slate-200 hover:border-indigo-600 bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition">
                  <Upload className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Pilih File CSV</span>
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
                <div className="border border-indigo-600 bg-indigo-50/20 p-3 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-indigo-700 font-extrabold text-sm">📋 Copy Paste</span>
                  <span className="text-[10px] font-semibold text-indigo-500 mt-1">Tempel langsung dari Excel</span>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempel Data Tabel Excel Di Sini</label>
                <textarea
                  placeholder="Contoh:&#10;197206052003	Ahmad Dahlan, S.Pd.	Fisika	081234567890&#10;198103122005	Siti Aminah, M.Pd.	Bahasa Inggris	085298765432"
                  rows={5}
                  value={importPasteText}
                  onChange={(e) => {
                    setImportPasteText(e.target.value);
                    handleParseImport(e.target.value);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-mono transition outline-none text-slate-800"
                ></textarea>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Data Preview Grid */}
              {importParsedData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pratinjau Data yang Terdeteksi ({importParsedData.length} Guru)</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                          <th className="px-3 py-2">NIP</th>
                          <th className="px-3 py-2">Nama Lengkap</th>
                          <th className="px-3 py-2">Tugas Utama</th>
                          <th className="px-3 py-2">Kontak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {importParsedData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono text-slate-500">{row.nip || '-'}</td>
                            <td className="px-3 py-2 text-slate-800 font-bold">{row.name}</td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">
                                {row.subject}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600 font-mono text-[10px]">{row.contact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPasteText('');
                  setImportParsedData([]);
                  setImportError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importParsedData.length === 0}
                className={`px-4 py-2 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
                  importParsedData.length > 0 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Simpan &amp; Import Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Cetak QR Code Custom Mandiri Modal */}
      {selectedTeacherForCustomQr && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:bg-white print:p-0 print:overflow-visible print:relative" id="custom-qr-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col md:flex-row print:shadow-none print:border-none print:max-w-none print:w-auto">
            {/* Left Side: Customization panel (Hidden on print) */}
            <div className="p-6 border-r border-slate-200 flex-1 space-y-4 print:hidden bg-slate-50 overflow-y-auto max-h-[90vh] md:max-h-none md:w-80 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customizer QR Code</h3>
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded uppercase">MANDIRI</span>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul Kartu</label>
                <input
                  type="text"
                  value={qrCustomTitle}
                  onChange={(e) => setQrCustomTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-indigo-600"
                />
              </div>

              {/* QR Size Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ukuran QR Code ({qrSize}px)</label>
                  <span className="text-[10px] font-mono font-bold text-slate-500">{qrSize} px</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="400"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Style options: Background, Text, Border */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna Kartu</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-7 h-7 p-0 rounded-md border border-slate-300 cursor-pointer overflow-hidden"
                    />
                    <input
                      type="text"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-full px-1.5 py-1 text-[10px] font-mono border border-slate-200 rounded-md uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna Teks</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={qrTextColor}
                      onChange={(e) => setQrTextColor(e.target.value)}
                      className="w-7 h-7 p-0 rounded-md border border-slate-300 cursor-pointer overflow-hidden"
                    />
                    <input
                      type="text"
                      value={qrTextColor}
                      onChange={(e) => setQrTextColor(e.target.value)}
                      className="w-full px-1.5 py-1 text-[10px] font-mono border border-slate-200 rounded-md uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Border Color and Width */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna Bingkai</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={qrBorderColor}
                      onChange={(e) => setQrBorderColor(e.target.value)}
                      className="w-7 h-7 p-0 rounded-md border border-slate-300 cursor-pointer overflow-hidden"
                    />
                    <input
                      type="text"
                      value={qrBorderColor}
                      onChange={(e) => setQrBorderColor(e.target.value)}
                      className="w-full px-1.5 py-1 text-[10px] font-mono border border-slate-200 rounded-md uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ketebalan Bingkai</label>
                  <select
                    value={qrBorderWidth}
                    onChange={(e) => setQrBorderWidth(Number(e.target.value))}
                    className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="0">Tanpa Bingkai</option>
                    <option value="2">Tipis (2px)</option>
                    <option value="4">Sedang (4px)</option>
                    <option value="8">Tebal (8px)</option>
                    <option value="12">Sangat Tebal (12px)</option>
                  </select>
                </div>
              </div>

              {/* Border Style */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gaya Bingkai</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['solid', 'dashed', 'double', 'dotted', 'none'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setQrBorderStyle(style)}
                      className={`px-2 py-1.5 text-[9px] font-extrabold uppercase border rounded-lg transition cursor-pointer ${
                        qrBorderStyle === style 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Hide toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tampilkan Informasi</label>
                
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrShowName}
                    onChange={(e) => setQrShowName(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>Nama Guru</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrShowNip}
                    onChange={(e) => setQrShowNip(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>NIP Guru</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrShowSubject}
                    onChange={(e) => setQrShowSubject(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>Tugas Utama</span>
                </label>
              </div>

              {/* Quick Themes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tema Instan</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQrBgColor('#ffffff');
                      setQrTextColor('#0f172a');
                      setQrBorderColor('#475569');
                      setQrBorderStyle('solid');
                    }}
                    className="p-1 text-[9px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Minimalis Putih
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrBgColor('#0f172a');
                      setQrTextColor('#ffffff');
                      setQrBorderColor('#6366f1');
                      setQrBorderStyle('double');
                    }}
                    className="p-1 text-[9px] font-bold bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-indigo-300 cursor-pointer"
                  >
                    Neon Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrBgColor('#ecfdf5');
                      setQrTextColor('#065f46');
                      setQrBorderColor('#059669');
                      setQrBorderStyle('dashed');
                    }}
                    className="p-1 text-[9px] font-bold bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-emerald-800 cursor-pointer"
                  >
                    Madrasah Hijau
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrBgColor('#fffbeb');
                      setQrTextColor('#78350f');
                      setQrBorderColor('#d97706');
                      setQrBorderStyle('solid');
                    }}
                    className="p-1 text-[9px] font-bold bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 text-amber-800 cursor-pointer"
                  >
                    Retro Gold
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Printable Display Area & Controls */}
            <div className="flex-1 flex flex-col min-h-[50vh] md:min-h-0 bg-slate-100/60 p-6 items-center justify-center print:bg-white print:p-0">
              {/* Toolbar Top for modal (Hidden on print) */}
              <div className="w-full flex justify-between items-center mb-6 print:hidden">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preview Cetak QR Code</span>
                <button
                  onClick={() => setSelectedTeacherForCustomQr(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* The Printable QR Frame container */}
              <div
                id="printable-custom-qr-area"
                className="transition-all duration-300 flex flex-col items-center justify-center p-8 rounded-3xl select-none"
                style={{
                  backgroundColor: qrBgColor,
                  color: qrTextColor,
                  borderWidth: qrBorderStyle !== 'none' ? `${qrBorderWidth}px` : '0px',
                  borderColor: qrBorderColor,
                  borderStyle: qrBorderStyle,
                  width: '100%',
                  maxWidth: '450px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                }}
              >
                {/* School or custom title */}
                {qrCustomTitle && (
                  <h4 className="text-xs font-black uppercase tracking-widest text-center mb-4 opacity-90 leading-relaxed max-w-[280px]">
                    {qrCustomTitle}
                  </h4>
                )}

                {/* QR Code image element */}
                <div 
                  className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-inner border border-slate-200/60 animate-fade-in"
                  style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                >
                  {customQrUrl ? (
                    <img
                      src={customQrUrl}
                      alt="Custom Teacher QR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                  )}
                </div>

                {/* Teacher name & detail displays */}
                {(qrShowName || qrShowNip || qrShowSubject) && (
                  <div className="mt-5 text-center space-y-1.5 w-full">
                    {qrShowName && (
                      <h3 className="text-base font-extrabold tracking-tight leading-tight uppercase">
                        {selectedTeacherForCustomQr.name}
                      </h3>
                    )}
                    {qrShowNip && selectedTeacherForCustomQr.nip && (
                      <span className="text-xs font-mono font-bold opacity-80 block tracking-wider">
                        NIP. {selectedTeacherForCustomQr.nip}
                      </span>
                    )}
                    {qrShowSubject && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-75 inline-block bg-black/5 px-2 py-0.5 rounded-md mt-1 font-sans">
                        Tugas Utama: {selectedTeacherForCustomQr.subject}
                      </span>
                    )}
                  </div>
                )}

                {/* Branding footer */}
                <div className="mt-6 pt-3 border-t border-current/15 text-[8px] font-extrabold opacity-60 uppercase tracking-widest text-center w-full">
                  {schoolProfile?.schoolName || 'MTsS MIFTAHUL HUDA'}
                </div>
              </div>

              {/* Instruction block */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 font-medium leading-normal w-full max-w-md mt-6 print:hidden">
                <strong>Saran Cetak:</strong> Tempel di meja kelas, gantung sebagai name tag, atau laminasi kertas tebal agar awet. Kode QR kompatibel penuh dengan alat pemindai lobby utama.
              </div>

              {/* Action buttons (Hidden on print) */}
              <div className="mt-6 flex justify-end gap-2 w-full max-w-md print:hidden">
                <button
                  onClick={() => setSelectedTeacherForCustomQr(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled Tag injection specifically for ID Card and QR Card full screen print mode */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          
          /* Show Standard ID Card Print elements */
          #id-card-modal, #printable-id-card-area, #printable-id-card-area * {
            visibility: visible;
          }
          #id-card-modal {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            overflow: visible !important;
          }
          #printable-id-card-area {
            border: 1px solid #475569 !important;
            box-shadow: none !important;
            width: 85.6mm !important;
            height: 53.98mm !important;
            background-image: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
            background-color: #0f172a !important;
            color: white !important;
            border-radius: 12px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(1.3) !important;
            transform-origin: center !important;
            box-sizing: border-box !important;
          }
          #printable-id-card-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Show Custom QR Print elements */
          #custom-qr-modal, #printable-custom-qr-area, #printable-custom-qr-area * {
            visibility: visible;
          }
          #custom-qr-modal {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            overflow: visible !important;
          }
          #printable-custom-qr-area {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(1.2) !important;
            transform-origin: center !important;
            box-sizing: border-box !important;
          }
          #printable-custom-qr-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
