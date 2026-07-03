/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolProfile } from '../types';
import { Building2, User, FileText, Upload, Trash2, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface SchoolProfileEditorProps {
  profile: SchoolProfile;
  onUpdateProfile: (profile: SchoolProfile) => void;
}

export default function SchoolProfileEditor({ profile, onUpdateProfile }: SchoolProfileEditorProps) {
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [foundationName, setFoundationName] = useState(profile.foundationName);
  const [address, setAddress] = useState(profile.address);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [npsn, setNpsn] = useState(profile.npsn);
  
  // Signee Left (e.g., Principal)
  const [signeeTitleLeft, setSigneeTitleLeft] = useState(profile.signeeTitleLeft || 'Kepala Sekolah');
  const [signeeNameLeft, setSigneeNameLeft] = useState(profile.signeeNameLeft || profile.principalName || '');
  const [signeeNipLeft, setSigneeNipLeft] = useState(profile.signeeNipLeft || profile.principalNip || '');

  // Signee Right (e.g., Head of Admin)
  const [signeeTitleRight, setSigneeTitleRight] = useState(profile.signeeTitleRight || 'Kepala Tata Usaha');
  const [signeeNameRight, setSigneeNameRight] = useState(profile.signeeNameRight || '');
  const [signeeNipRight, setSigneeNipRight] = useState(profile.signeeNipRight || '');

  const [signatureImage, setSignatureImage] = useState(profile.signatureImage || '');
  const [logoImage, setLogoImage] = useState(profile.logoImage || '');
  const [logoRightImage, setLogoRightImage] = useState(profile.logoRightImage || '');
  const [showSignature, setShowSignature] = useState(profile.showSignature !== false);
  const [message, setMessage] = useState('');

  // Handle logo image upload & conversion to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB Limit
        alert('File gambar terlalu besar. Maksimal ukuran file adalah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoImage('');
  };

  // Handle logo right image upload & conversion to base64
  const handleLogoRightUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB Limit
        alert('File gambar terlalu besar. Maksimal ukuran file adalah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoRightImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogoRight = () => {
    setLogoRightImage('');
  };

  // Handle signature image upload & conversion to base64
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB Limit
        alert('File gambar terlalu besar. Maksimal ukuran file adalah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setSignatureImage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SchoolProfile = {
      schoolName: schoolName.trim(),
      foundationName: foundationName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      npsn: npsn.trim(),
      principalName: signeeNameLeft.trim(), // Keep legacy fields updated
      principalNip: signeeNipLeft.trim(),
      signeeTitleLeft: signeeTitleLeft.trim(),
      signeeNameLeft: signeeNameLeft.trim(),
      signeeNipLeft: signeeNipLeft.trim(),
      signeeTitleRight: signeeTitleRight.trim(),
      signeeNameRight: signeeNameRight.trim(),
      signeeNipRight: signeeNipRight.trim(),
      signatureImage,
      logoImage,
      logoRightImage,
      showSignature
    };
    onUpdateProfile(updated);
    setMessage('Perubahan berhasil disimpan!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6" id="school-profile-editor">
      {/* Header Panel */}
      <div className="flex items-center justify-between" id="profile-editor-header">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight uppercase">PROFIL SEKOLAH &amp; SETTING TANDA TANGAN</h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Atur kop surat laporan kepegawaian, nama kepala sekolah, dan data tanda tangan resmi PDF.</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2 animate-fade-in" id="profile-success-alert">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="profile-form">
        {/* Left/Middle Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Identitas Sekolah */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4" id="section-school-identity">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Identitas &amp; Kop Surat Sekolah
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Yayasan / Instansi Atas</label>
                <input
                  type="text"
                  value={foundationName}
                  onChange={(e) => setFoundationName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                  placeholder="YAYASAN PENDIDIKAN NASIONAL"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Sekolah (Lembaga)</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-bold transition outline-none text-slate-700"
                  placeholder="SMA INDONESIA MANDIRI"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alamat Lengkap Sekolah</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                  placeholder="Jl. Pendidikan Raya No. 45, Jakarta Pusat"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nomor Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                  placeholder="(021) 555-0199"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Resmi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                  placeholder="info@sekolah.sch.id"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">NPSN (Nomor Pokok Sekolah Nasional)</label>
                <input
                  type="text"
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-xs font-semibold transition outline-none text-slate-700"
                  placeholder="10293847"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Struktur Tanda Tangan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4" id="section-school-signees">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              Struktur Penandatangan Laporan (PDF)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Signee (Principal) */}
              <div className="space-y-3.5 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">PIHAK KIRI (Mengetahui / Kepala Sekolah)</span>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={signeeTitleLeft}
                    onChange={(e) => setSigneeTitleLeft(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded text-xs font-semibold outline-none"
                    placeholder="Kepala Sekolah SMA Indonesia Mandiri"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Kepala Sekolah / Pihak Kiri</label>
                  <input
                    type="text"
                    value={signeeNameLeft}
                    onChange={(e) => setSigneeNameLeft(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded text-xs font-bold outline-none"
                    placeholder="Dr. H. Mulyadi, M.Si."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">NIP Kepala Sekolah / Pihak Kiri</label>
                  <input
                    type="text"
                    value={signeeNipLeft}
                    onChange={(e) => setSigneeNipLeft(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded text-xs font-semibold outline-none font-mono"
                    placeholder="196812241994031002"
                  />
                </div>
              </div>

              {/* Right Signee (Head of Admin) */}
              <div className="space-y-3.5 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PIHAK KANAN (Pembuat Laporan / Tata Usaha)</span>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={signeeTitleRight}
                    onChange={(e) => setSigneeTitleRight(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded text-xs font-semibold outline-none"
                    placeholder="Kepala Tata Usaha / Kepegawaian"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Tata Usaha / Pihak Kanan</label>
                  <input
                    type="text"
                    value={signeeNameRight}
                    onChange={(e) => setSigneeNameRight(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded text-xs font-bold outline-none"
                    placeholder="Dra. Endang Lestari"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">NIP Tata Usaha / Pihak Kanan</label>
                  <input
                    type="text"
                    value={signeeNipRight}
                    onChange={(e) => setSigneeNipRight(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded text-xs font-semibold outline-none font-mono"
                    placeholder="197205151999082001"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signature and Logo upload */}
        <div className="space-y-6">
          {/* Section 3: Logo Madrasah (Dual Logo - Kiri & Kanan) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6" id="section-logo-media">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Logo Cetak Absen (Kiri &amp; Kanan)
            </h3>

            {/* Logo Kiri / Utama */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logo Posisi Kiri (Utama / Logo Depag)</label>
              
              {logoImage ? (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center min-h-[140px] relative">
                    <img
                      src={logoImage}
                      alt="Logo Madrasah Kiri"
                      className="max-h-[120px] object-contain animate-fade-in"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Logo Kiri
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-600 transition duration-200">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="block text-xs font-bold text-slate-600">Unggah Logo Kiri (Kop Kiri)</span>
                  <span className="block text-[10px] text-slate-400 mt-1">Gunakan gambar rasio 1:1 transparan. Maksimal 2MB.</span>
                  
                  <label className="mt-4 inline-block px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg transition uppercase tracking-wider cursor-pointer font-sans">
                    Pilih File Logo Kiri
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Logo Kanan / Tambahan */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logo Posisi Kanan (Sekunder / Logo Madrasah)</label>
              
              {logoRightImage ? (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center min-h-[140px] relative">
                    <img
                      src={logoRightImage}
                      alt="Logo Madrasah Kanan"
                      className="max-h-[120px] object-contain animate-fade-in"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogoRight}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Logo Kanan
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-600 transition duration-200">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="block text-xs font-bold text-slate-600">Unggah Logo Kanan (Kop Kanan)</span>
                  <span className="block text-[10px] text-slate-400 mt-1">Gunakan gambar rasio 1:1 transparan. Maksimal 2MB.</span>
                  
                  <label className="mt-4 inline-block px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg transition uppercase tracking-wider cursor-pointer font-sans">
                    Pilih File Logo Kanan
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoRightUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4" id="section-signature-media">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              Tanda Tangan &amp; Stempel
            </h3>

            {/* Checkbox status */}
            <div className="flex items-center gap-2" id="toggle-signature-visibility">
              <input
                type="checkbox"
                id="show-signature-checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600"
              />
              <label htmlFor="show-signature-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                Tampilkan TTD/Stempel di Laporan PDF
              </label>
            </div>

            {/* Upload Area */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Gambar TTD / Stempel Basah</label>
              
              {signatureImage ? (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center min-h-[140px] relative">
                    <img
                      src={signatureImage}
                      alt="Uploaded Signature"
                      className="max-h-[120px] object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Tanda Tangan
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-600 transition duration-200">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="block text-xs font-bold text-slate-600">Unggah Gambar PNG/JPG</span>
                  <span className="block text-[10px] text-slate-400 mt-1">Gunakan latar belakang transparan (PNG) untuk hasil draf terbaik. Maksimal 2MB.</span>
                  
                  <label className="mt-4 inline-block px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg transition uppercase tracking-wider cursor-pointer">
                    Pilih File Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Informational preview note */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-800 leading-normal" id="sign-stamp-help">
              <strong>Tips Tanda Tangan Resmi:</strong> Anda dapat mengunggah tanda tangan yang digabungkan dengan stempel resmi sekolah. Sistem akan memposisikannya secara otomatis di atas nama Kepala Sekolah pada laporan bulanan PDF.
            </div>
          </div>

          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              Simpan Semua Perubahan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
