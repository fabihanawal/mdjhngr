import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  List, 
  Filter, 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  Layout,
  User as UserIcon,
  X,
  Newspaper,
  Calendar,
  Save,
  Layers,
  MapPin,
  Phone,
  ExternalLink,
  ShieldAlert,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  LogOut
} from 'lucide-react';
import { 
  CitizenReport, 
  ReportStatus, 
  Slide, 
  CandidateProfile, 
  NewsItem, 
  ServiceContent, 
  ServiceCategory,
  EmergencyContact 
} from '../types';
import { CATEGORY_MAP, STATUS_MAP, STATUS_COLORS, SERVICE_CAT_MAP, WARDS_LIST } from '../constants';
import { summarizeReport, getActionPlan } from '../services/geminiService';
import { 
  saveSlideToDb, 
  deleteSlideFromDb, 
  saveServiceToDb, 
  deleteServiceFromDb, 
  saveNewsToDb, 
  deleteNewsFromDb, 
  updateReportInDb, 
  deleteReportFromDb,
  saveCandidateProfileToDb,
  saveEmergencyContactToDb,
  deleteEmergencyContactFromDb
} from '../services/firebase';

interface AdminDashboardProps {
  reports: CitizenReport[];
  slides: Slide[];
  mpData: CandidateProfile;
  news: NewsItem[];
  services: ServiceContent[];
  emergencyContacts?: EmergencyContact[];
  onUpdateStatus: (id: string, status: ReportStatus, notes?: string) => void;
  onDeleteReport: (id: string) => void;
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
  setMpData: React.Dispatch<React.SetStateAction<CandidateProfile>>;
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  setServices: React.Dispatch<React.SetStateAction<ServiceContent[]>>;
  setEmergencyContacts?: React.Dispatch<React.SetStateAction<EmergencyContact[]>>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  reports, 
  slides, 
  mpData, 
  news, 
  services, 
  emergencyContacts = [],
  onUpdateStatus, 
  onDeleteReport, 
  setSlides, 
  setMpData, 
  setNews, 
  setServices,
  setEmergencyContacts,
  showToast,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'services' | 'slideshow' | 'news' | 'profile' | 'emergency'>('reports');
  const [filter, setFilter] = useState<ReportStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiAction, setAiAction] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Service Editor State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<ServiceContent>>({
    category: 'Education',
    title: '',
    description: '',
    details: '',
    contactPhone: '',
    location: '',
    link: '',
    isNew: true
  });

  // Slide Editor State
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState<Partial<Slide>>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg',
    badge: '১ নং বদলগাছী ইউনিয়ন'
  });

  // News Editor State
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({
    title: '',
    content: '',
    date: new Date().toLocaleDateString('bn-BD'),
    imageUrl: '/assets/aistudio/FB_IMG_1793299504888_0c7f0cbb.jpg',
    category: 'নির্বাচনী প্রচারণা',
    isPinned: false
  });

  // Emergency Contact Form State
  const [emergencyForm, setEmergencyForm] = useState<Partial<EmergencyContact>>({
    title: '',
    category: 'Hospital',
    phone: '',
    availableHours: '২৪ ঘণ্টা',
    location: 'বদলগাছী'
  });

  // Candidate Profile Temp State
  const [profileForm, setProfileForm] = useState<CandidateProfile>(mpData);

  // Stats calculation
  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    inProgress: reports.filter(r => r.status === 'In Progress').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  }), [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesFilter = filter === 'All' || r.status === filter;
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          r.id.toLowerCase().includes(search.toLowerCase()) ||
                          r.location.toLowerCase().includes(search.toLowerCase()) ||
                          (r.ward && r.ward.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [reports, filter, search]);

  const handleAiInsights = async (report: CitizenReport) => {
    setIsLoadingAi(true);
    try {
      const [summary, action] = await Promise.all([
        summarizeReport(report.title, report.description),
        getActionPlan(report.category, report.description)
      ]);
      setAiSummary(summary);
      setAiAction(action);
    } catch {
      setAiSummary('এআই বিশ্লেষণ প্রস্তুত করা সম্ভব হয়নি।');
      setAiAction('ওয়ার্ড প্রতিনিধি মারফত সরেজমিন তদন্ত করে দ্রুত সমাধান করুন।');
    }
    setIsLoadingAi(false);
  };

  const handleUpdateReportStatus = async (status: ReportStatus) => {
    if (selectedReport) {
      const updatedNotes = adminNote || selectedReport.adminNotes || '';
      onUpdateStatus(selectedReport.id, status, updatedNotes);
      try {
        await updateReportInDb(selectedReport.id, { status, adminNotes: updatedNotes });
      } catch (e) {
        console.warn('Firebase update fallback:', e);
      }
      setSelectedReport(null);
      setAdminNote('');
      showToast('রিপোর্ট স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই রিপোর্টটি মুছে ফেলতে চান?')) {
      onDeleteReport(id);
      try {
        await deleteReportFromDb(id);
      } catch (e) {
        console.warn('Firebase delete fallback:', e);
      }
      if (selectedReport?.id === id) setSelectedReport(null);
      showToast('রিপোর্ট মুছে ফেলা হয়েছে', 'error');
    }
  };

  // SERVICES CRUD
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title || !serviceForm.description) {
      return showToast('শিরোনাম ও বিবরণ প্রদান করুন', 'error');
    }

    const serviceId = editingServiceId || `svc-${Date.now()}`;
    const newServiceObj: ServiceContent = {
      id: serviceId,
      category: serviceForm.category as ServiceCategory || 'Education',
      title: serviceForm.title.trim(),
      description: serviceForm.description.trim(),
      details: serviceForm.details?.trim(),
      contactPhone: serviceForm.contactPhone?.trim(),
      location: serviceForm.location?.trim(),
      link: serviceForm.link?.trim(),
      isNew: serviceForm.isNew ?? true
    };

    setServices(prev => {
      const exists = prev.some(s => s.id === serviceId);
      if (exists) {
        return prev.map(s => s.id === serviceId ? newServiceObj : s);
      }
      return [newServiceObj, ...prev];
    });

    try {
      await saveServiceToDb(newServiceObj);
    } catch (e) {
      console.warn('Firestore service sync error:', e);
    }

    setEditingServiceId(null);
    setServiceForm({
      category: 'Education',
      title: '',
      description: '',
      details: '',
      contactPhone: '',
      location: '',
      link: '',
      isNew: true
    });
    showToast(editingServiceId ? 'সেবা তথ্য আপডেট হয়েছে' : 'নতুন সেবা সফলভাবে সংযোজন করা হয়েছে');
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('এই সেবা তথ্যটি মুছে ফেলতে চান?')) {
      setServices(prev => prev.filter(s => s.id !== id));
      try {
        await deleteServiceFromDb(id);
      } catch (e) {
        console.warn('Firestore service delete error:', e);
      }
      showToast('সেবা তথ্য মুছে ফেলা হয়েছে', 'error');
    }
  };

  // SLIDES CRUD
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title || !slideForm.imageUrl) {
      return showToast('স্লাইডের শিরোনাম ও ছবির লিংক দিন', 'error');
    }

    const slideId = editingSlideId || `s-${Date.now()}`;
    const newSlideObj: Slide = {
      id: slideId,
      title: slideForm.title.trim(),
      subtitle: slideForm.subtitle?.trim(),
      description: slideForm.description?.trim() || '',
      imageUrl: slideForm.imageUrl.trim(),
      badge: slideForm.badge?.trim() || 'উন্নয়নের অঙ্গীকার'
    };

    setSlides(prev => {
      const exists = prev.some(s => s.id === slideId);
      if (exists) return prev.map(s => s.id === slideId ? newSlideObj : s);
      return [...prev, newSlideObj];
    });

    try {
      await saveSlideToDb(newSlideObj);
    } catch (e) {
      console.warn('Firestore slide sync error:', e);
    }

    setEditingSlideId(null);
    setSlideForm({
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg',
      badge: '১ নং বদলগাছী ইউনিয়ন'
    });
    showToast(editingSlideId ? 'স্লাইড আপডেট হয়েছে' : 'নতুন স্লাইড যুক্ত হয়েছে');
  };

  const handleDeleteSlide = async (id: string) => {
    if (slides.length <= 1) {
      return showToast('কমপক্ষে একটি স্লাইড থাকা আবশ্যক', 'error');
    }
    if (window.confirm('স্লাইডটি মুছে ফেলতে চান?')) {
      setSlides(prev => prev.filter(s => s.id !== id));
      try {
        await deleteSlideFromDb(id);
      } catch (e) {
        console.warn('Firestore slide delete error:', e);
      }
      showToast('স্লাইড মুছে ফেলা হয়েছে', 'error');
    }
  };

  // NEWS CRUD
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) {
      return showToast('সংবাদের শিরোনাম ও বিষয়বস্তু দিন', 'error');
    }

    const newsId = editingNewsId || `news-${Date.now()}`;
    const newNewsObj: NewsItem = {
      id: newsId,
      title: newsForm.title.trim(),
      content: newsForm.content.trim(),
      date: newsForm.date?.trim() || new Date().toLocaleDateString('bn-BD'),
      imageUrl: newsForm.imageUrl?.trim() || '/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg',
      category: newsForm.category?.trim() || 'প্রচারণা',
      isPinned: newsForm.isPinned ?? false
    };

    setNews(prev => {
      const exists = prev.some(n => n.id === newsId);
      if (exists) return prev.map(n => n.id === newsId ? newNewsObj : n);
      return [newNewsObj, ...prev];
    });

    try {
      await saveNewsToDb(newNewsObj);
    } catch (e) {
      console.warn('Firestore news sync error:', e);
    }

    setEditingNewsId(null);
    setNewsForm({
      title: '',
      content: '',
      date: new Date().toLocaleDateString('bn-BD'),
      imageUrl: '/assets/aistudio/FB_IMG_1793299504888_0c7f0cbb.jpg',
      category: 'নির্বাচনী প্রচারণা',
      isPinned: false
    });
    showToast(editingNewsId ? 'সংবাদ আপডেট হয়েছে' : 'নতুন প্রচারণা সংবাদ প্রকাশিত হয়েছে');
  };

  const handleDeleteNews = async (id: string) => {
    if (window.confirm('সংবাদটি মুছে ফেলতে চান?')) {
      setNews(prev => prev.filter(n => n.id !== id));
      try {
        await deleteNewsFromDb(id);
      } catch (e) {
        console.warn('Firestore news delete error:', e);
      }
      showToast('সংবাদ মুছে ফেলা হয়েছে', 'error');
    }
  };

  // PROFILE SAVE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpData(profileForm);
    try {
      await saveCandidateProfileToDb(profileForm);
    } catch (e) {
      console.warn('Firestore profile sync error:', e);
    }
    showToast('প্রার্থী প্রোফাইল ও ইশতেহার সফলভাবে সংরক্ষিত হয়েছে');
  };

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Title */}
      <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800 flex items-center justify-center border border-emerald-600 shadow-inner">
            <Layout className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200">
                অ্যাডমিন নিয়ন্ত্রণ কক্ষ
              </span>
              <span className="text-xs text-emerald-300 font-semibold">rstsbd@gmail.com</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              ১ নং বদলগাছী ইউনিয়ন পরিষদ নির্বাচন পোর্টাল
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
              চেয়ারম্যান পদপ্রার্থী: মুহাম্মদ জাহাঙ্গীর আলম • ফায়ারবেস রিয়েলটাইম ডাটাবেজ
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow"
          >
            <LogOut className="w-4 h-4" /> লগআউট করুন
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'reports' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>নাগরিক রিপোর্ট ({stats.total})</span>
          {stats.pending > 0 && (
            <span className="bg-amber-400 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'services' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>শিক্ষা, স্বাস্থ্য ও সেবা সুবিধা ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('slideshow')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'slideshow' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>ক্যাম্পেইন স্লাইডশো ({slides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'news' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>প্রচারণা সংবাদ ও নোটিশ ({news.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'profile' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>প্রার্থী প্রোফাইল ও ইশতেহার</span>
        </button>
      </div>

      {/* TAB 1: CITIZEN REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">মোট আবেদন / রিপোর্ট</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">অপেক্ষমান (Pending)</span>
              <p className="text-3xl font-black text-amber-700 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">তদন্ত / কাজ চলমান</span>
              <p className="text-3xl font-black text-blue-700 mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">সমাধানকৃত (Resolved)</span>
              <p className="text-3xl font-black text-emerald-700 mt-1">{stats.resolved}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="রিপোর্ট আইডি, বিষয় বা এলাকা দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filter === s 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'All' ? 'সকল' : STATUS_MAP[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Table / List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4">ট্র্যাকিং আইডি</th>
                    <th className="p-4">সমস্যার শিরোনাম ও স্থান</th>
                    <th className="p-4">ক্যাটাগরি</th>
                    <th className="p-4">নাগরিকের তথ্য</th>
                    <th className="p-4">স্ট্যাটাস</th>
                    <th className="p-4 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-mono font-black text-emerald-800 text-xs">
                        {report.id}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 line-clamp-1">{report.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {report.location} ({report.ward || 'ওয়ার্ড'})
                        </p>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-700">
                        {CATEGORY_MAP[report.category] || report.category}
                      </td>
                      <td className="p-4 text-xs">
                        {report.isAnonymous ? (
                          <span className="text-slate-400 font-semibold italic">বেনামী নাগরিক</span>
                        ) : (
                          <div>
                            <p className="font-bold text-slate-800">{report.name || 'নাগরিক'}</p>
                            {report.phone && <p className="text-slate-500">{report.phone}</p>}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[report.status]}`}>
                          {STATUS_MAP[report.status]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNote(report.adminNotes || '');
                              setAiSummary('');
                              setAiAction('');
                            }}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="বিস্তারিত দেখুন ও আপডেট করুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReports.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>কোনো রিপোর্ট পাওয়া যায়নি</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SERVICES MANAGER */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">
                {editingServiceId ? 'সেবা তথ্য সম্পাদনা করুন' : 'নতুন সেবা বা সুবিধা যোগ করুন'}
              </h3>
              {editingServiceId && (
                <button
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceForm({ category: 'Education', title: '', description: '', isNew: true });
                  }}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  বাতিল
                </button>
              )}
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সেবার ক্যাটাগরি *
                </label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as ServiceCategory })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                >
                  {Object.entries(SERVICE_CAT_MAP).map(([catKey, catVal]) => (
                    <option key={catKey} value={catKey}>{catVal.icon} {catVal.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সেবার শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অসচ্ছল ছাত্রছাত্রীদের জাহাঙ্গীর আলম শিক্ষাবৃত্তি"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সংক্ষিপ্ত বিবরণ *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="কাদের জন্য, কী সুবিধা এবং প্রধান তথ্য..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  আবেদন পদ্ধতি বা বিস্তারিত তথ্য
                </label>
                <textarea
                  rows={3}
                  placeholder="প্রয়োজনীয় কাগজপত্র, সময়সূচি এবং নিয়মাবলী..."
                  value={serviceForm.details || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, details: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    হটলাইন / ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="০১৭১১-XXXXXX"
                    value={serviceForm.contactPhone || ''}
                    onChange={(e) => setServiceForm({ ...serviceForm, contactPhone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    স্থান বা কার্যালয়
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: বদলগাছী বাজার মোড়"
                    value={serviceForm.location || ''}
                    onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  অনলাইন লিংক বা আবেদন ওয়েব লিঙ্ক
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={serviceForm.link || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, link: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isNew"
                  checked={serviceForm.isNew ?? true}
                  onChange={(e) => setServiceForm({ ...serviceForm, isNew: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="isNew" className="text-xs font-bold text-slate-700">
                  'নতুন আপডেট' ব্যাজ প্রদর্শন করুন
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{editingServiceId ? 'আপডেট সংরক্ষণ করুন' : 'সেবা যোগ করুন'}</span>
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              বর্তমান সেবা ও সুবিধাসমূহ ({services.length})
            </h3>

            <div className="space-y-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4 hover:border-emerald-400 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {SERVICE_CAT_MAP[svc.category]?.label || svc.category}
                      </span>
                      {svc.isNew && (
                        <span className="text-[10px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full">
                          নতুন
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 text-base">{svc.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{svc.description}</p>
                    {svc.contactPhone && (
                      <p className="text-xs text-emerald-700 font-bold">ফোন: {svc.contactPhone}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingServiceId(svc.id);
                        setServiceForm(svc);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                      title="সম্পাদনা"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(svc.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: SLIDESHOW MANAGER */}
      {activeTab === 'slideshow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              {editingSlideId ? 'স্লাইড সম্পাদনা' : 'হোমপেজ স্লাইড যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveSlide} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  স্লাইডের মূল শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সুখে দুঃখে যাকে পাই, সে আমাদের জাহাঙ্গীর আলম ভাই"
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  উপ-শিরোনাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ১ নং বদলগাছী ইউনিয়ন পরিষদ নির্বাচন"
                  value={slideForm.subtitle || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  বিবরণ
                </label>
                <textarea
                  rows={3}
                  placeholder="স্লাইডের বিস্তারিত বার্তা বা স্লোগান..."
                  value={slideForm.description || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  ছবির URL বা পাথ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg"
                  value={slideForm.imageUrl}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 font-mono text-xs"
                />
                
                {/* Fast presets with candidate images */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, imageUrl: '/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg' })}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-bold"
                  >
                    পোস্টার ১ (সুখে দুঃখে যাকে পাই)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, imageUrl: '/assets/aistudio/FB_IMG_1793299504888_0c7f0cbb.jpg' })}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-bold"
                  >
                    পোস্টার ২ (চলো একসাথে গড়ি)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  ব্যাজ টেক্সট
                </label>
                <input
                  type="text"
                  placeholder="যেমন: উন্নয়নের অঙ্গীকার"
                  value={slideForm.badge || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{editingSlideId ? 'স্লাইড আপডেট করুন' : 'স্লাইড যোগ করুন'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              বর্তমান স্লাইডসমূহ ({slides.length})
            </h3>

            <div className="space-y-4">
              {slides.map((s, idx) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row hover:border-emerald-400 transition-colors"
                >
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="w-full sm:w-44 h-36 object-cover bg-emerald-950"
                  />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          স্লাইড {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {s.badge}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base line-clamp-1">{s.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.description}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                      <button
                        onClick={() => {
                          setEditingSlideId(s.id);
                          setSlideForm(s);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs text-slate-600 hover:text-emerald-700 font-bold px-2 py-1 rounded"
                      >
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(s.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: NEWS & RALLY UPDATES */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              {editingNewsId ? 'সংবাদ সম্পাদনা' : 'নতুন প্রচারণা সংবাদ প্রকাশ করুন'}
            </h3>

            <form onSubmit={handleSaveNews} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সংবাদের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ১ নং বদলগাছীর বিভিন্ন ওয়ার্ডে উঠান বৈঠক ও গণসংযোগ"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সংবাদের বিষয়বস্তু *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="গণসংযোগ, আলোচনা সভা বা জনকল্যাণমূলক কর্মকাণ্ডের বিস্তারিত খবর..."
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    তারিখ
                  </label>
                  <input
                    type="text"
                    value={newsForm.date || ''}
                    onChange={(e) => setNewsForm({ ...newsForm, date: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: প্রচারণা / মতবিনিময়"
                    value={newsForm.category || ''}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  ছবির URL
                </label>
                <input
                  type="text"
                  placeholder="/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg"
                  value={newsForm.imageUrl || ''}
                  onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{editingNewsId ? 'সংবাদ আপডেট করুন' : 'সংবাদ প্রকাশ করুন'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              প্রকাশিত সংবাদ ও নোটিশ ({news.length})
            </h3>

            <div className="space-y-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{item.category}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingNewsId(item.id);
                        setNewsForm(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-slate-600 hover:text-emerald-700 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="p-2 text-slate-600 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: CANDIDATE PROFILE & MANIFESTO */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-xl font-black text-slate-900">
              চেয়ারম্যান পদপ্রার্থী পরিচিতি ও ৯ দফা নির্বাচনী ইশতেহার
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              প্রার্থীর নাম, নির্বাচনী স্লোগান, বায়ো এবং রূপকল্পের তথ্য সম্পাদনা করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                প্রার্থীর নাম *
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                পদবী ও নির্বাচনী এলাকা *
              </label>
              <input
                type="text"
                required
                value={profileForm.designation}
                onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              নির্বাচনী মূল স্লোগান
            </label>
            <input
              type="text"
              value={profileForm.slogan}
              onChange={(e) => setProfileForm({ ...profileForm, slogan: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              জীবনবৃত্তান্ত ও সেবামূলক কাজের ইতিহাস (Bio)
            </label>
            <textarea
              rows={4}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              উন্নয়নের রূপকল্প ও ভিশন (Vision)
            </label>
            <textarea
              rows={3}
              value={profileForm.vision}
              onChange={(e) => setProfileForm({ ...profileForm, vision: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                নির্বাচনী প্রধান কার্যালয়ের ঠিকানা
              </label>
              <input
                type="text"
                value={profileForm.officeAddress}
                onChange={(e) => setProfileForm({ ...profileForm, officeAddress: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                অফিসিয়াল যোগাযোগ ইমেইল
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" /> প্রোফাইল ও ইশতেহার সংরক্ষণ করুন
          </button>
        </form>
      )}

      {/* REPORT DETAILS & ACTION MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 text-sm">
                  {selectedReport.id}
                </span>
                <span className="text-xs text-slate-500 ml-3">তারিখ: {selectedReport.createdAt}</span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{selectedReport.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{selectedReport.location} ({selectedReport.ward || 'ওয়ার্ড'})</span>
                <span>•</span>
                <span>খাত: {CATEGORY_MAP[selectedReport.category]}</span>
              </p>
              <p className="text-slate-700 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line">
                {selectedReport.description}
              </p>
            </div>

            {selectedReport.imageUrl && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">নাগরিক কর্তৃক প্রদত্ত ছবি</p>
                <img
                  src={selectedReport.imageUrl}
                  alt={selectedReport.title}
                  className="max-h-52 rounded-xl object-cover border"
                />
              </div>
            )}

            {/* Citizen Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border text-xs space-y-1">
              <p className="font-bold text-slate-700">নাগরিকের তথ্য:</p>
              {selectedReport.isAnonymous ? (
                <p className="text-slate-500 italic">বেনামী অভিযোগ (গোপনীয়তা সংরক্ষিত)</p>
              ) : (
                <div className="space-y-0.5 text-slate-600">
                  <p><strong>নাম:</strong> {selectedReport.name || 'তথ্য নেই'}</p>
                  <p><strong>ফোন:</strong> <a href={`tel:${selectedReport.phone}`} className="text-emerald-700 font-bold hover:underline">{selectedReport.phone || 'তথ্য নেই'}</a></p>
                  {selectedReport.nid && <p><strong>এনআইডি:</strong> {selectedReport.nid}</p>}
                </div>
              )}
            </div>

            {/* AI Assistant Action Insights */}
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> এআই স্মার্ট বিশ্লেষণ ও সমাধান রূপরেখা
                </span>
                <button
                  type="button"
                  onClick={() => handleAiInsights(selectedReport)}
                  disabled={isLoadingAi}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1 rounded-lg border border-purple-200 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                  {isLoadingAi ? 'বিশ্লেষণ হচ্ছে...' : 'জেনারেট করুন'}
                </button>
              </div>

              {aiSummary && (
                <div className="text-xs text-purple-900 space-y-1 pt-1">
                  <p><strong>সংক্ষেপ:</strong> {aiSummary}</p>
                  <p><strong>প্রস্তাবিত পদক্ষেপ:</strong> {aiAction}</p>
                </div>
              )}
            </div>

            {/* Admin Response Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                চেয়ারম্যান প্রার্থীর টিমের মন্তব্য বা পদক্ষেপের নোট
              </label>
              <textarea
                rows={3}
                placeholder="গৃহীত ব্যবস্থা বা তদন্তের ফলাফল লিখুন (নাগরিকরা ট্র্যাকিং পেজে এটি দেখতে পাবেন)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteReport(selectedReport.id)}
                className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> রিপোর্ট মুছুন
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateReportStatus('Pending')}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs px-4 py-2.5 rounded-xl border border-amber-300"
                >
                  অপেক্ষমান
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReportStatus('In Progress')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
                >
                  তদন্ত চলমান
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReportStatus('Resolved')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
                >
                  সমাধানকৃত চিহ্নিত করুন
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
