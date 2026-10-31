import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  ArrowLeft,
  ChevronRight,
  Filter,
  Eye,
  FileText,
  UserCheck,
  ShieldCheck,
  PhoneCall,
  Activity
} from 'lucide-react';
import { CitizenReport, ReportStatus, CandidateProfile } from '../types';
import { CATEGORY_MAP, STATUS_MAP, STATUS_COLORS } from '../constants';

interface TrackReportProps {
  reports: CitizenReport[];
  candidate?: CandidateProfile;
}

const TrackReport: React.FC<TrackReportProps> = ({ reports, candidate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'All'>('All');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  const searchedReports = reports.filter(r => {
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = query === '' || 
      r.id.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query) ||
      (r.phone && r.phone.includes(query)) ||
      (r.ward && r.ward.toLowerCase().includes(query));

    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchQuery && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto my-12 px-4 sm:px-6">
      
      {/* Header */}
      <div className="mb-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> হোমপেজে ফিরুন
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            স্বচ্ছতা ও জবাবদিহিতা
          </span>
          <span className="text-xs text-slate-500 font-semibold">{candidate?.union || '১ নং বদলগাছী ইউনিয়ন'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          রিপোর্ট ও অভিযোগ ট্র্যাকিং
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          আপনার ট্র্যাকিং আইডি অথবা মোবাইল নম্বর দিয়ে সমস্যার বর্তমান অবস্থা এবং {candidate?.designation || 'চেয়ারম্যান পদপ্রার্থী'} {candidate?.name || 'প্রার্থী'}-র টিমের গৃহীত পদক্ষেপ জানুন।
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200/80 mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ট্র্যাকিং আইডি (যেমন: TRK-2401), ফোন নম্বর অথবা এলাকা দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-semibold text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-md text-slate-700 font-bold"
            >
              রিসেট
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> স্ট্যাটাস ফিল্টার:
            </span>
            {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === status 
                    ? 'bg-emerald-700 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'All' ? 'সকল রিপোর্ট' : STATUS_MAP[status]}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-500">
            মোট ফলাফল: <strong className="text-slate-800">{searchedReports.length}</strong> টি
          </span>
        </div>
      </div>

      {/* Reports Grid / List */}
      {searchedReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800 mb-1">কোনো রিপোর্ট পাওয়া যায়নি</h3>
          <p className="text-slate-500 text-sm mb-4">
            অনুগ্রহ করে ট্র্যাকিং আইডি সঠিকভাবে দিয়েছেন কিনা যাচাই করুন অথবা ফিল্টার পরিবর্তন করুন।
          </p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all"
          >
            নতুন রিপোর্ট জমা দিন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searchedReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                      {report.id}
                    </span>
                    {report.ward && (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {report.ward}
                      </span>
                    )}
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[report.status]}`}>
                    {STATUS_MAP[report.status]}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug">
                  {report.title}
                </h3>

                {/* Description preview */}
                <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                  {report.description}
                </p>

                {/* Meta details */}
                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>স্থান: {report.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>তারিখ: {report.createdAt}</span>
                    <span className="mx-1">•</span>
                    <span>খাত: {CATEGORY_MAP[report.category] || report.category}</span>
                  </div>
                </div>

                {/* Admin Notes Preview */}
                {report.adminNotes && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 mb-4">
                    <p className="font-bold mb-0.5 flex items-center gap-1 text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" /> চেয়ারম্যান প্রার্থীর টিমের মন্তব্য:
                    </p>
                    <p className="line-clamp-2">{report.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Bottom action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {report.isAnonymous ? 'বেনামী নাগরিক' : (report.name || 'নাগরিক')}
                </span>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1"
                >
                  সম্পূর্ণ অগ্রগতি ও বিবরণ <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* REPORT PROGRESS TIMELINE MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {selectedReport.id}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[selectedReport.status]}`}>
                  {STATUS_MAP[selectedReport.status]}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Title & Desc */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedReport.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {selectedReport.location} ({selectedReport.ward || 'বদলগাছী'})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedReport.createdAt}
                </span>
                <span>খাত: {CATEGORY_MAP[selectedReport.category]}</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedReport.description}
              </p>
            </div>

            {/* Attached Photo */}
            {selectedReport.imageUrl && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">সংযুক্ত আলোকচিত্র</p>
                <img
                  src={selectedReport.imageUrl}
                  alt={selectedReport.title}
                  className="max-h-60 w-auto rounded-2xl object-cover border border-slate-200"
                />
              </div>
            )}

            {/* Progressive Resolution Timeline */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-4 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" /> সমাধানের অগ্রগতি ধাপসমূহ
              </h4>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">রিপোর্ট সফলভাবে গৃহীত</p>
                    <p className="text-[11px] text-slate-500">
                      নাগরিক পোর্টালের মাধ্যমে রিপোর্টটি সিস্টেমে নিবন্ধিত হয়েছে ({selectedReport.createdAt})।
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    selectedReport.status !== 'Pending' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-400 text-slate-900'
                  }`}>
                    {selectedReport.status !== 'Pending' ? '✓' : '২'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">প্রাথমিক মূল্যায়ন ও ওয়ার্ড পরিদর্শন</p>
                    <p className="text-[11px] text-slate-500">
                      {selectedReport.status === 'Pending' 
                        ? 'প্রার্থী জাহাঙ্গীর আলমের স্বেচ্ছাসেবক টিম সরেজমিনে পরিদর্শনের প্রক্রিয়ায় রয়েছে।' 
                        : 'স্থানীয় প্রতিনিধির মাধ্যমে বিষয়টির গুরুত্ব ও প্রয়োজনীয় বাজেট/পরিকল্পনা চূড়ান্ত করা হয়েছে।'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    selectedReport.status === 'Resolved' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {selectedReport.status === 'Resolved' ? '✓' : '৩'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">পদক্ষেপ গ্রহণ ও সমাধান</p>
                    <p className="text-[11px] text-slate-500">
                      {selectedReport.status === 'Resolved' 
                        ? 'সমস্যাটির সফল সমাধান হয়েছে অথবা নির্বাচনী অগ্রাধিকার প্রকল্পে স্থায়ীভাবে অন্তর্ভুক্ত করা হয়েছে।' 
                        : 'পরিকল্পনা অনুযায়ী কাজ চলমান বা প্রক্রিয়াধীন।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Response Note */}
            {selectedReport.adminNotes && (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" /> চেয়ারম্যান প্রার্থীর কার্যালয়ের বক্তব্য:
                </h4>
                <p className="text-emerald-800 text-sm leading-relaxed whitespace-pre-line">
                  {selectedReport.adminNotes}
                </p>
              </div>
            )}

            <div className="pt-4 border-t text-right">
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TrackReport;
