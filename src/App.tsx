/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, BookOpen, User, Sparkles, X, Filter, Zap, LogIn, Plus } from "lucide-react";
import CourseCard from "./components/CourseCard";
import CreateCourseModal from "./components/CreateCourseModal";
import { getSemanticSearchFilters, SearchFilters } from "./services/geminiService";
import { Course } from "./types";
import { useAuth } from "./hooks/useAuth";
import { signInWithGoogle } from "./lib/firebase";
import { db } from "./lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [semanticFilters, setSemanticFilters] = useState<SearchFilters | null>(null);

  const categories = ["Semua", "Desain", "Coding", "Musik", "Bahasa", "Akademik", "Lifestyle"];

  // Real-time courses listener
  useEffect(() => {
    const q = query(
      collection(db, "courses"), 
      where("is_active", "==", true), 
      orderBy("created_at", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSemanticFilters(null);
      return;
    }

    setIsLoading(true);
    try {
      const filters = await getSemanticSearchFilters(searchQuery);
      setSemanticFilters(filters);
      if (filters.category) {
        const matched = categories.find(c => c.toLowerCase() === filters.category?.toLowerCase());
        if (matched) setActiveCategory(matched);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Manual Category Filter
      if (activeCategory !== "Semua" && course.category !== activeCategory) return false;

      // Semantic Filters override if they exist
      if (semanticFilters) {
        if (semanticFilters.maxPrice && course.price > semanticFilters.maxPrice) return false;
        if (semanticFilters.location && !course.location_city.toLowerCase().includes(semanticFilters.location.toLowerCase())) return false;
        if (semanticFilters.type && course.type !== semanticFilters.type) return false;
      }

      // Basic text search fallback
      if (searchQuery && !semanticFilters) {
        const queryStr = searchQuery.toLowerCase();
        return (
          course.title.toLowerCase().includes(queryStr) ||
          course.description.toLowerCase().includes(queryStr) ||
          course.category.toLowerCase().includes(queryStr)
        );
      }

      return true;
    });
  }, [courses, activeCategory, searchQuery, semanticFilters]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black text-purple-900 tracking-tight">RITUAL</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button onClick={() => { setActiveCategory("Semua"); setSemanticFilters(null); }} className="text-purple-600">Cari Kursus</button>
            <button onClick={() => user ? setIsCreateModalOpen(true) : signInWithGoogle()} className="hover:text-purple-600 transition-colors">Jadi Mentor</button>
            <a href="#" className="hover:text-purple-600 transition-colors">Tentang Kami</a>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-black text-slate-900 leading-none">{profile?.full_name}</span>
                  <button onClick={() => signOut()} className="text-[10px] text-slate-400 font-bold hover:text-red-500 transition-colors uppercase tracking-widest">Logout</button>
                </div>
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl border-2 border-purple-100" alt="Avatar" />
              </div>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
              >
                <LogIn size={18} />
                Masuk
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
              Pusat Edukasi Sulawesi Selatan
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
              Temukan Ruang <span className="text-purple-600">Intelektualmu</span> Disini.
            </h1>
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Ritual menghubungkan siswa berbakat dengan mentor ahli di Sulawesi Selatan. 
              {user && <span className="block font-bold mt-2 text-purple-700 italic">Selamat datang kembali, {profile?.full_name}!</span>}
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative max-w-2xl mx-auto"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Coba: "les desain murah di makassar"'
                className="w-full pl-16 pr-32 py-5 bg-white border-2 border-purple-100 rounded-2xl shadow-xl shadow-purple-50 focus:border-purple-500 focus:ring-0 transition-all text-slate-700 placeholder:text-slate-400 font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <SlidersHorizontal size={20} />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap size={18} />
                      Cari
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* AI Search Badge */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100">
                <Sparkles size={12} className="text-purple-600" />
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Bertenaga Gemini AI 1.5 Flash</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        {/* Category Filter */}
        <div className="flex items-center justify-between mb-12 overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSemanticFilters(null);
                }}
                className={`px-6 py-2.5 whitespace-nowrap rounded-xl text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-100 scale-105"
                    : "bg-white border border-purple-50 text-slate-500 hover:border-purple-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {user && (
            <button 
              onClick={() => {
                setCourseToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-purple-600 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors ml-4"
            >
              <Plus size={18} />
              Tambah Kursus
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Hasil Pencarian
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-lg">{filteredCourses.length}</span>
            </h2>
            {semanticFilters && (
              <p className="text-sm text-slate-500 mt-1">
                AI merekomendasikan: <span className="font-bold text-purple-600">{semanticFilters.category || activeCategory}</span> 
                {semanticFilters.location && <span className="ml-1">di {semanticFilters.location}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Urutkan:</span>
            <select className="bg-transparent border-none text-sm font-bold text-purple-600 focus:ring-0 p-0 cursor-pointer">
              <option>Populer</option>
              <option>Harga Terendah</option>
              <option>Rating Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, idx) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  index={idx} 
                  onEdit={(c) => {
                    setCourseToEdit(c);
                    setIsCreateModalOpen(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-full mb-6">
              <BookOpen size={40} className="text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada kursus yang tersedia</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {user 
                ? "Jadilah yang pertama untuk membagikan ilmumu! Klik tombol Tambah Kursus di atas."
                : "Masuk sebagai mentor untuk mulai membagikan kursusmu di Sulawesi Selatan."}
            </p>
            {!user && (
              <button 
                onClick={() => signInWithGoogle()}
                className="mt-8 px-6 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 mx-auto"
              >
                <LogIn size={18} />
                Mulai Sebagai Mentor
              </button>
            )}
          </motion.div>
        )}
      </main>

      <CreateCourseModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setCourseToEdit(null);
        }} 
        courseToEdit={courseToEdit}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setCourseToEdit(null);
        }} 
      />

      {/* Filter Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-[70] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Filter Lanjutan</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Tipe Kelas</label>
                  <div className="flex gap-2">
                    {["Semua", "Online", "Offline"].map(type => (
                      <button key={type} className="flex-1 py-1.5 text-sm font-bold border border-purple-100 rounded-lg hover:border-purple-300 transition-colors">
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Rentang Harga</label>
                  <input type="range" className="w-full h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                  <div className="flex justify-between mt-2 text-xs font-bold text-slate-500">
                    <span>IDR 0</span>
                    <span>IDR 1jt+</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Lokasi (Sulsel)</label>
                  <select className="w-full bg-slate-50 border-purple-50 rounded-xl text-sm font-semibold focus:border-purple-500 focus:ring-purple-500">
                    <option>Semua Kota</option>
                    <option>Makassar</option>
                    <option>Gowa</option>
                    <option>Maros</option>
                    <option>Takalar</option>
                  </select>
                </div>

                <div className="pt-8">
                  <button className="w-full py-4 bg-purple-600 text-white font-black rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all uppercase tracking-widest text-xs">
                    Terapkan Filter
                  </button>
                  <button className="w-full py-4 mt-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Bersihkan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Floating Action Button for Mobile */}
      <button className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40">
        <Filter size={24} />
      </button>

      {/* Simple Footer */}
      <footer className="bg-slate-900 py-16 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-black tracking-tight">RITUAL</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-6 leading-relaxed">
              Membangun Ruang Intelektual bagi generasi emas Sulawesi Selatan. 
              Temukan mentor terbaik untuk masa depan gemilangmu.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6">Produk</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><button onClick={() => window.scrollTo({ top: 500, behavior: 'smooth'})} className="hover:text-purple-400 transition-colors">Cari Tutor</button></li>
              <li><button onClick={() => user ? setIsCreateModalOpen(true) : signInWithGoogle()} className="hover:text-purple-400 transition-colors">Gabung Mentor</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6">Kontak</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">WhatsApp</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Email</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
          <p>© 2026 Ritual (Ruang Intelektual). Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-8">
            <a href="#">Privasi</a>
            <a href="#">Ketentuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

