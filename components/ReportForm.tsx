import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Send, 
  CheckCircle2, 
  User, 
  UserX, 
  AlertCircle, 
  Info,
  ArrowLeft,
  Copy,
  Check,
  Search,
  Sparkles,
  Phone,
  FileCheck
} from 'lucide-react';
import { CATEGORY_MAP, WARDS_LIST } from '../constants';
import { CitizenReport, ReportCategory } from '../types';
import { addReportToDb } from '../services/firebase';

interface ReportFormProps {
  onSubmit: (report: CitizenReport) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit }) => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Roads' as ReportCategory,
    ward: '১ নং ওয়ার্ড',
    location: '',
    name: '',
    phone: '',
    nid: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট হতে হবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newId = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: CitizenReport = {
      id: newId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      ward: formData.ward,
      location: formData.location.trim(),
      name: isAnonymous ? undefined : (formData.name.trim() || undefined),
      phone: isAnonymous ? undefined : (formData.phone.trim() || undefined),
      nid: isAnonymous ? undefined : (formData.nid.trim() || undefined),
      imageUrl: imagePreview || undefined,
      isAnonymous,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
      adminNotes: 'রিপোর্টটি গ্রহণ করা হয়েছে। মোহাম্মদ জাহাঙ্গীর আলমের সেবাকর্মী দল শীঘ্রই বিষয়টি খতিয়ে দেখবে।'
    };
    
    try {
      await addReportToDb(newReport);
    } catch (err) {
      console.warn('Firestore write fallback to local memory:', err);
    }

    onSubmit(newReport);
    setTrackingId(newId);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4">
        <div className="p-8 sm:p-12 bg-white rounded-3xl shadow-xl border border-emerald-100 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-3">রিপোর্ট সফলভাবে জমা হয়েছে!</h2>
          <p className="text-slate-600 font-medium mb-8 leading-relaxed text-sm sm:text-base">
            ১ নং বদলগাছী ইউনিয়ন পরিষদ নির্বাচনে চেয়ারম্যান পদপ্রার্থী <span className="font-bold text-emerald-800">মুহাম্মদ জাহাঙ্গীর আলমের</span> অভিযোগ ও উন্নয়ন প্রস্তাব সেলে আপনার রিপোর্টটি নথিভুক্ত হয়েছে।
          </p>

          <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200/80 mb-8 text-center">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2">আপনার ট্র্যাকিং কোড</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black text-emerald-700 tracking-wider">{trackingId}</span>
              <button 
                onClick={copyTrackingId}
                className="p-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 transition-colors text-emerald-800"
                title="কপি করুন"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-700 font-semibold mt-2">কোডটি কপি করা হয়েছে!</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/track"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> স্ট্যাটাস ট্র্যাক করুন
            </Link>
            <Link 
              to="/"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 py-3.5 rounded-xl transition-all"
            >
              হোমে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-12 px-4 sm:px-6">
      
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> হোমপেজে ফিরুন
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            নাগরিক অংশগ্রহণ
          </span>
          <span className="text-xs text-slate-500 font-semibold">১ নং বদলগাছী ইউনিয়ন</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          এলাকার সমস্যা বা উন্নয়ন প্রস্তাব জমা দিন
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          রাস্তাঘাট, জলাবদ্ধতা, বিদ্যুৎ, ড্রেনেজ, স্বাস্থ্য বা কৃষি সংক্রান্ত যেকোনো অসুবিধা সম্পর্কে চেয়ারম্যান পদপ্রার্থী মুহাম্মদ জাহাঙ্গীর আলমকে সরাসরি জানান।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl shadow-lg border border-slate-200/80 space-y-6">
            
            {/* Identity Mode Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                রিপোর্টের ধরন বেছে নিন
              </label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    !isAnonymous 
                      ? 'bg-white shadow text-emerald-700 font-black' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>পরিচয়সহ (প্রস্তাবিত)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    isAnonymous 
                      ? 'bg-white shadow text-emerald-700 font-black' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserX className="w-4 h-4" />
                  <span>গোপন / বেনামী</span>
                </button>
              </div>
            </div>

            {/* Category and Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  সমস্যার খাত / ক্যাটাগরি *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ReportCategory })}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  ওয়ার্ড নির্বাচন করুন *
                </label>
                <select
                  required
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {WARDS_LIST.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                নির্দিষ্ট স্থান / গ্রাম / পাড়া *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: চকগোপীনাথ সরকারি স্কুল মোড় / বদলগাছী বাজার"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                সমস্যা বা প্রস্তাবের সংক্ষিপ্ত শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ৩ নং ওয়ার্ডের প্রধান সড়কে ড্রেনেজ সংস্কার প্রয়োজন"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                বিস্তারিত বিবরণ লিখুন *
              </label>
              <textarea
                required
                rows={4}
                placeholder="সমস্যাটি কতদিন ধরে বিদ্যমান, এর ফলে কী ধরণের ভোগান্তি হচ্ছে এবং কীভাবে সমাধান চান তা বিস্তারিত লিখুন..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Optional Photo Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                সমস্যার ছবি সংযুক্ত করুন (ঐচ্ছিক)
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>ছবি আপলোড করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200" 
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Citizen Details if not anonymous */}
            {!isAnonymous && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  যোগাযোগের তথ্য (শুধুমাত্র প্রার্থীর টিম দেখবে)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">আপনার নাম *</label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required={!isAnonymous}
                      placeholder="০১৭১১-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-base"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'জমা হচ্ছে...' : 'রিপোর্ট জমা দিন'}</span>
            </button>

          </form>
        </div>

        {/* Right Side: Information Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <h3 className="text-xl font-black mb-3">মুহাম্মদ জাহাঙ্গীর আলমের অঙ্গীকার</h3>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              "আমি বিশ্বাস করি একটি এলাকা তখনই সুন্দর হয় যখন তার জনগণ সরাসরি সমস্যার কথা নির্ভয়ে বলতে পারে। আপনাদের প্রতিটি তথ্য সরাসরি আমার নজরে আসবে।"
            </p>
            <div className="space-y-3 pt-4 border-t border-emerald-800 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>২৪ থেকে ৭২ ঘণ্টার মধ্যে প্রাথমিক তদন্ত</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ট্র্যাকিং আইডি দিয়ে যেকোনো সময় অগ্রগতি দেখুন</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>জরুরি যোগাযোগ: ০১৭১১-XXXXXX</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-slate-800 text-sm">আগে রিপোর্ট করেছেন?</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              আপনার কাছে থাকা ট্র্যাকিং আইডি দিয়ে রিপোর্টের বর্তমান অবস্থা ও প্রার্থীর টিমের মন্তব্য যাচাই করুন।
            </p>
            <Link
              to="/track"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
            >
              <Search className="w-4 h-4" /> রিপোর্ট ট্র্যাক করুন
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReportForm;
