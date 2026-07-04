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

export default function TeacherManagement({ teachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher }: TeacherManagementProps) {
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
    return teachers.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.nip.includes(searchQuery);
      const matchesSubject = subjectFilter === 'Semua' || t.subject === subjectFilter;
      const matchesStatus = statusFilter === 'Semua' || t.status === statusFilter;
      
      return matchesSearch && matchesSubject && matchesStatus;
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
      setFormError('Mata pelajaran wajib diisi.');
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
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Kelola data induk pendidik, mata pelajaran, dan informasi kontak.</p>
        </div>
        <button
          id="btn-tambah-guru"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Guru Baru
        </button>
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
                <option key={subj} value={subj}>{subj === 'Semua' ? 'Mata Pelajaran: Semua' : subj}</option>
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
                  <th className="px-6 py-4">Mata Pelajaran</th>
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
                            title="Cetak Kartu KTP Guru"
                          >
                            <QrCode className="w-4 h-4" />
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mata Pelajaran Utama</label>
                <input
                  id="modal-teacher-subject"
                  type="text"
                  placeholder="Contoh: Informatika, Matematika, Kimia"
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
                      <span className="text-[5px] font-bold text-indigo-300 block leading-none uppercase tracking-wider">MATA PELAJARAN:</span>
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

      {/* Styled Tag injection specifically for ID Card full screen print mode */}
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
          /* Ensure all child elements are adjusted correctly for color output */
          #printable-id-card-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
