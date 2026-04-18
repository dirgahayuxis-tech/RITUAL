/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { MapPin, Star, MessageCircle, ExternalLink, ShieldCheck, Edit3 } from "lucide-react";
import { Course } from "../types";
import { useAuth } from "../hooks/useAuth";

interface CourseCardProps {
  course: Course;
  index?: number;
  onEdit?: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index = 0, onEdit }) => {
  const { user } = useAuth();
  const isMentor = user?.uid === course.mentor_id;
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(course.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-purple-100/50 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col"
    >
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.image_url || `https://picsum.photos/seed/${course.id}/600/400`}
          alt={course.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-purple-700 text-xs font-semibold rounded-full shadow-sm">
            {course.category}
          </span>
          {course.type === 'online' ? (
            <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-sm">
              Online
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-sm">
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Course Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < Math.floor(course.rating || 4.5) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-xs text-slate-500">({course.review_count || 12})</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-2">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 mb-4 text-slate-500">
          <MapPin size={16} className="text-purple-500" />
          <span className="text-sm">{course.location_city}</span>
        </div>

        {/* Mentor Info */}
        <div className="mt-auto pt-4 border-t border-purple-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={(course as any).mentor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.mentor_id}`}
                alt={(course as any).mentor_name}
                className="w-8 h-8 rounded-full border border-purple-100"
              />
              {course.mentor?.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                  <ShieldCheck size={14} className="text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {(course as any).mentor_name || "Mentor Ahli"}
              </span>
              <span className="text-[10px] text-slate-500">Professional Mentor</span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="block text-xs text-slate-400">Mulai dari</span>
            <span className="text-lg font-black text-purple-700">{formattedPrice}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`mt-5 grid ${isMentor ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
          {isMentor && (
            <button 
              onClick={() => onEdit?.(course)}
              className="flex items-center justify-center p-2 border border-purple-100 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
              title="Edit Kursus"
            >
              <Edit3 size={18} />
            </button>
          )}
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-purple-100 text-purple-700 text-sm font-semibold rounded-xl hover:bg-purple-50 transition-colors">
            Detail
          </button>
          <button 
            onClick={() => window.open(`https://wa.me/${course.mentor?.whatsapp_no || '628123456789'}`, '_blank')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
