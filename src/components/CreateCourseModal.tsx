/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { validateContent } from '../services/geminiService';
import { Course } from '../types';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseToEdit?: Course | null;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess, courseToEdit }: CreateCourseModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: courseToEdit?.title || '',
    description: courseToEdit?.description || '',
    category: courseToEdit?.category || 'Desain',
    price: courseToEdit?.price || 0,
    type: (courseToEdit?.type || 'online') as 'online' | 'offline',
    location_city: courseToEdit?.location_city || 'Makassar',
    image_url: courseToEdit?.image_url || ''
  });

  // Update form if courseToEdit changes
  React.useEffect(() => {
    if (courseToEdit) {
      setFormData({
        title: courseToEdit.title,
        description: courseToEdit.description,
        category: courseToEdit.category,
        price: courseToEdit.price,
        type: courseToEdit.type,
        location_city: courseToEdit.location_city,
        image_url: courseToEdit.image_url
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Desain',
        price: 0,
        type: 'online',
        location_city: 'Makassar',
        image_url: ''
      });
    }
  }, [courseToEdit, isOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const safety = await validateContent(`${formData.title} ${formData.description}`);
      if (!safety.isValid) {
        setError(`Konten ditolak: ${safety.reason}`);
        setIsLoading(false);
        return;
      }

      if (courseToEdit) {
        // Update
        const courseRef = doc(db, 'courses', courseToEdit.id);
        await updateDoc(courseRef, {
          ...formData,
          updated_at: serverTimestamp()
        });
      } else {
        // Create
        await addDoc(collection(db, 'courses'), {
          ...formData,
          mentor_id: user.uid,
          mentor_name: user.displayName || 'Mentor Ritual',
          mentor_avatar: user.photoURL || '',
          is_active: true,
          rating: 5.0,
          review_count: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Operasi gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-6 top-[10%] max-w-2xl mx-auto bg-white rounded-3xl z-[110] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-purple-50 flex items-center justify-between bg-purple-600">
              <h2 className="text-xl font-black text-white tracking-tight">Buat Kursus Baru</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Judul Kursus</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: Belajar UI/UX dari Dasar"
                    className="w-full px-4 py-3 bg-slate-50 border border-purple-50 rounded-xl focus:border-purple-500 focus:ring-0 text-sm font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi Pelajaran</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-purple-50 rounded-xl focus:border-purple-500 focus:ring-0 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-purple-50 rounded-xl focus:border-purple-500 focus:ring-0 text-sm font-medium"
                  >
                    {["Desain", "Coding", "Musik", "Bahasa", "Akademik", "Lifestyle"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Harga (IDR)</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-purple-50 rounded-xl focus:border-purple-500 focus:ring-0 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-purple-50 rounded-xl focus:border-purple-500 focus:ring-0 text-sm font-medium"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kota</label>
                  <input
                    type="text"
                    value={formData.location_city}
                    onChange={e => setFormData({...formData, location_city: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-purple-50 rounded-xl focus:border-purple-500 focus:ring-0 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-purple-600 text-white font-black rounded-xl shadow-xl shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Publikasikan Kursus
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
