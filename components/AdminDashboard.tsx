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
  LogOut,
  Rocket,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Info
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
import { CATEGORY_MAP, STATUS_MAP, STATUS_COLORS, SERVICE_CAT_MAP, WARDS_LIST, INITIAL_CANDIDATE_DATA } from '../constants';
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
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);

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
    badge: 'উন্নয়নের অঙ্গীকার'
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
  const [editingEmergencyId, setEditingEmergencyId] = useState<string | null>(null);
  const [emergencyForm, setEmergencyForm] = useState<Partial<EmergencyContact>>({
    title: '',
    category: 'Ambulance',
    phone: '',
    availableHours: '২৪ ঘণ্টা',
    location: ''
  });

  // Candidate Profile Temp State (Full Customizability)
  const [profileForm, setProfileForm] = useState<CandidateProfile>(mpData);
  const [wardsString, setWardsString] = useState<string>((mpData.wards || WARDS_LIST).join(', '));
  const [emailsString, setEmailsString] = useState<string>((mpData.authorizedEmails || ['rstsbd@gmail.com']).join(', '));

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
      badge: 'উন্নয়নের অঙ্গীকার'
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

  // EMERGENCY HOTLINES CRUD
  const handleSaveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.title || !emergencyForm.phone) {
      return showToast('সেবার নাম ও ফোন নম্বর প্রদান করুন', 'error');
    }

    const emId = editingEmergencyId || `em-${Date.now()}`;
    const newEmObj: EmergencyContact = {
      id: emId,
      title: emergencyForm.title.trim(),
      category: emergencyForm.category as any || 'Ambulance',
      phone: emergencyForm.phone.trim(),
      availableHours: emergencyForm.availableHours?.trim() || '২৪ ঘণ্টা',
      location: emergencyForm.location?.trim()
    };

    if (setEmergencyContacts) {
      setEmergencyContacts(prev => {
        const exists = prev.some(e => e.id === emId);
        if (exists) return prev.map(e => e.id === emId ? newEmObj : e);
        return [...prev, newEmObj];
      });
    }

    try {
      await saveEmergencyContactToDb(newEmObj);
    } catch (e) {
      console.warn('Firestore emergency sync error:', e);
    }

    setEditingEmergencyId(null);
    setEmergencyForm({
      title: '',
      category: 'Ambulance',
      phone: '',
      availableHours: '২৪ ঘণ্টা',
      location: ''
    });
    showToast(editingEmergencyId ? 'জরুরি নম্বর আপডেট হয়েছে' : 'নতুন জরুরি নম্বর যুক্ত হয়েছে');
  };

  const handleDeleteEmergency = async (id: string) => {
    if (window.confirm('জরুরি নম্বরটি মুছে ফেলতে চান?')) {
      if (setEmergencyContacts) {
        setEmergencyContacts(prev => prev.filter(e => e.id !== id));
      }
      try {
        await deleteEmergencyContactFromDb(id);
      } catch (e) {
        console.warn('Firestore emergency delete error:', e);
      }
      showToast('জরুরি নম্বর মুছে ফেলা হয়েছে', 'error');
    }
  };

  // PROFILE SAVE (Multi-Candidate White-Label Setup)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse wards list
    const parsedWards = wardsString
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    // Parse authorized admin emails
    const parsedEmails = emailsString
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    const updatedProfile: CandidateProfile = {
      ...profileForm,
      wards: parsedWards.length > 0 ? parsedWards : WARDS_LIST,
      authorizedEmails: parsedEmails.length > 0 ? parsedEmails : ['rstsbd@gmail.com']
    };

    setMpData(updatedProfile);
    try {
      await saveCandidateProfileToDb(updatedProfile);
    } catch (e) {
      console.warn('Firestore profile sync error:', e);
    }
    showToast('প্রার্থীর তথ্য, এলাকা ও ইশতেহার সফলভাবে সংরক্ষিত হয়েছে');
  };

  // Template loader for showing clients / new candidates
  const loadPresetTemplate = (type: 'badalgachhi' | 'radhanagar' | 'custom') => {
    if (type === 'badalgachhi') {
      setProfileForm(INITIAL_CANDIDATE_DATA);
      setWardsString((INITIAL_CANDIDATE_DATA.wards || WARDS_LIST).join(', '));
      setEmailsString((INITIAL_CANDIDATE_DATA.authorizedEmails || ['rstsbd@gmail.com']).join(', '));
      showToast('১ নং বদলগাছী ইউনিয়নের তথ্য লোড করা হয়েছে');
    } else if (type === 'radhanagar') {
      const demoCandidate: CandidateProfile = {
        ...INITIAL_CANDIDATE_DATA,
        name: 'মোঃ আব্দুল করিম',
        designation: 'চেয়ারম্যান পদপ্রার্থী',
        union: '২ নং রাধানগর ইউনিয়ন পরিষদ',
        upazila: 'সিংড়া',
        district: 'নাটোর',
        slogan: 'জনগণের সেবায় সৎ ও নিষ্ঠাবান আব্দুল করিম ভাই',
        sloganSecondary: 'চলো গড়ি একটি আলোকিত ও নিরাপদ রাধানগর',
        officeAddress: 'নির্বাচনী প্রধান কার্যালয়: রাধানগর বাজার মোড়, সিংড়া',
        wards: ['১ নং ওয়ার্ড', '২ নং ওয়ার্ড', '৩ নং ওয়ার্ড', '৪ নং ওয়ার্ড', '৫ নং ওয়ার্ড', '৬ নং ওয়ার্ড', '৭ নং ওয়ার্ড', '৮ নং ওয়ার্ড', '৯ নং ওয়ার্ড']
      };
      setProfileForm(demoCandidate);
      setWardsString(demoCandidate.wards!.join(', '));
      setEmailsString('rstsbd@gmail.com, client@gmail.com');
      showToast('২ নং রাধানগর ইউনিয়নের ডেমো তথ্য লোড করা হয়েছে');
    } else {
      const blankCandidate: CandidateProfile = {
        ...INITIAL_CANDIDATE_DATA,
        name: '',
        designation: 'চেয়ারম্যান পদপ্রার্থী',
        union: 'নতুন ইউনিয়ন পরিষদ',
        upazila: '',
        district: '',
        slogan: '',
        sloganSecondary: '',
        officeAddress: ''
      };
      setProfileForm(blankCandidate);
      setWardsString('১ নং ওয়ার্ড, ২ নং ওয়ার্ড, ৩ নং ওয়ার্ড, ৪ নং ওয়ার্ড, ৫ নং ওয়ার্ড, ৬ নং ওয়ার্ড, ৭ নং ওয়ার্ড, ৮ নং ওয়ার্ড, ৯ নং ওয়ার্ড');
      showToast('নতুন প্রার্থীর জন্য খালি ফরম তৈরি করা হয়েছে');
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Title with Vercel & Multi-Candidate Action Buttons */}
      <div className="bg-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800 flex items-center justify-center border border-emerald-600 shadow-inner shrink-0">
            <Layout className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200">
                হোয়াইট-লেবেল ইউপি অ্যাডমিন
              </span>
              <span className="text-xs text-emerald-300 font-semibold">{mpData.union}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              {mpData.name || 'চেয়ারম্যান প্রার্থী'} — ডিজিটাল নাগরিক পোর্টাল
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
              যেকোনো প্রার্থীর জন্য কাস্টমাইজযোগ্য • ফায়ারবেস ডাটাবেজ • ভারসেল রেডি
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowVercelModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md"
          >
            <Rocket className="w-4 h-4" /> ভারসেলে ডিপ্লয় নির্দেশিকা
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow"
            >
              <LogOut className="w-4 h-4" /> লগআউট
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
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
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'profile' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>প্রার্থী ও এলাকা কনফিগারেশন</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'emergency' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>জরুরি হটলাইন নম্বর ({emergencyContacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'services' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>সেবা ও সুবিধাসমূহ ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('slideshow')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'news' 
              ? 'bg-emerald-700 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>প্রচারণা সংবাদ ({news.length})</span>
        </button>
      </div>

      {/* TAB 1: CITIZEN REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
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

      {/* TAB 2: CANDIDATE PROFILE & MULTI-AREA WHITE-LABEL SETTINGS */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                প্রার্থী, এলাকা ও হোয়াইট-লেবেল কনফিগারেশন
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                যেকোনো ইউনিয়নের চেয়ারম্যান প্রার্থীর তথ্য এখানে বসিয়ে সেভ করলেই পুরো পোর্টালটি নতুন প্রার্থীর তথ্যে রূপান্তর হবে।
              </p>
            </div>

            {/* Template Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">প্রিসেট টেমপ্লেট:</span>
              <button
                type="button"
                onClick={() => loadPresetTemplate('badalgachhi')}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-200"
              >
                ১ নং বদলগাছী
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('radhanagar')}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-3 py-1.5 rounded-lg border border-blue-200"
              >
                ২ নং রাধানগর
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('custom')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-300"
              >
                নতুন খালি ফরম
              </button>
            </div>
          </div>

          {/* Section 1: Candidate Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">
              ১. প্রার্থীর মৌলিক পরিচিতি ও নির্বাচনী এলাকা
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  প্রার্থীর পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মুহাম্মদ জাহাঙ্গীর আলম"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  পদবী *
                </label>
                <input
                  type="text"
                  required
                  placeholder="চেয়ারম্যান পদপ্রার্থী"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  ইউনিয়ন পরিষদের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ১ নং বদলগাছী ইউনিয়ন পরিষদ"
                  value={profileForm.union}
                  onChange={(e) => setProfileForm({ ...profileForm, union: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  উপজেলা
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বদলগাছী"
                  value={profileForm.upazila}
                  onChange={(e) => setProfileForm({ ...profileForm, upazila: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  জেলা
                </label>
                <input
                  type="text"
                  placeholder="যেমন: নওগাঁ"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Campaign Slogans & Photos */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">
              ২. নির্বাচনী স্লোগান ও ছবি
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  প্রধান নির্বাচনী স্লোগান *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সুখে দুঃখে যাকে পাই, সে আমাদের জাহাঙ্গীর আলম ভাই"
                  value={profileForm.slogan}
                  onChange={(e) => setProfileForm({ ...profileForm, slogan: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  দ্বিতীয় স্লোগান বা আহ্বান
                </label>
                <input
                  type="text"
                  placeholder="যেমন: চলো একসাথে গড়ি বদলগাছী ইউনিয়ন"
                  value={profileForm.sloganSecondary || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, sloganSecondary: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  প্রার্থীর ছবির URL বা পাথ *
                </label>
                <input
                  type="text"
                  placeholder="/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg"
                  value={profileForm.image}
                  onChange={(e) => setProfileForm({ ...profileForm, image: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  পোস্টার / ব্যানারের ছবির URL
                </label>
                <input
                  type="text"
                  placeholder="/assets/aistudio/FB_IMG_1793299504888_0c7f0cbb.jpg"
                  value={profileForm.bannerImage || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, bannerImage: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bio & Vision */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">
              ৩. প্রার্থীর জীবনবৃত্তান্ত ও রূপকল্প
            </h4>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                জীবনবৃত্তান্ত ও সেবামূলক কাজের ইতিহাস (Bio)
              </label>
              <textarea
                rows={3}
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
                rows={2}
                value={profileForm.vision}
                onChange={(e) => setProfileForm({ ...profileForm, vision: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: 9-Point Manifesto Editor */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">
              ৪. উন্নয়নের ৯ দফা নির্বাচনী অঙ্গীকার ও ইশতেহার
            </h4>
            <p className="text-xs text-slate-500">
              প্রতিটি ওয়ার্ড ও ইউনিয়নের জন্য প্রার্থীর অগ্রাধিকার অনুযায়ী ৯টি অঙ্গীকারের শিরোনাম ও বিস্তারিত পরিবর্তন করুন:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profileForm.manifestoPoints.map((point, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    অঙ্গীকার {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={point.title}
                    onChange={(e) => {
                      const updated = [...profileForm.manifestoPoints];
                      updated[idx].title = e.target.value;
                      setProfileForm({ ...profileForm, manifestoPoints: updated });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-emerald-600"
                    placeholder="অঙ্গীকারের শিরোনাম"
                  />
                  <textarea
                    rows={3}
                    value={point.details}
                    onChange={(e) => {
                      const updated = [...profileForm.manifestoPoints];
                      updated[idx].details = e.target.value;
                      setProfileForm({ ...profileForm, manifestoPoints: updated });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-emerald-600 leading-relaxed"
                    placeholder="অঙ্গীকারের বিস্তারিত"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Ward List & Authorized Admin Emails */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">
              ৫. নির্বাচনী ওয়ার্ডসমূহ ও ক্লায়েন্ট অ্যাডমিন ইমেইল
            </h4>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                ইউনিয়নের ওয়ার্ড বা এলাকার তালিকা (কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={wardsString}
                onChange={(e) => setWardsString(e.target.value)}
                placeholder="১ নং ওয়ার্ড, ২ নং ওয়ার্ড, ৩ নং ওয়ার্ড, ৪ নং ওয়ার্ড, ৫ নং ওয়ার্ড, ৬ নং ওয়ার্ড, ৭ নং ওয়ার্ড, ৮ নং ওয়ার্ড, ৯ নং ওয়ার্ড"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                নাগরিকরা সমস্যা রিপোর্ট করার সময় এই তালিকা থেকে তাদের ওয়ার্ড বেছে নিতে পারবেন।
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                অনুমোদিত অ্যাডমিন গুগল ইমেইলসমূহ (কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={emailsString}
                onChange={(e) => setEmailsString(e.target.value)}
                placeholder="rstsbd@gmail.com, client@gmail.com"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                এখানে যেসকল জিমেইল অ্যাড্রেস যোগ করবেন, তারা গুগল সাইন-ইন দিয়ে সরাসরি অ্যাডমিন প্যানেলে লগইন করতে পারবেন।
              </span>
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
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-5 h-5" /> সম্পূর্ণ পোর্টাল সেভ ও লাইভ আপডেট করুন
          </button>
        </form>
      )}

      {/* TAB 3: EMERGENCY HOTLINES MANAGER */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Hotline Form */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              {editingEmergencyId ? 'জরুরি নম্বর সম্পাদনা' : 'নতুন জরুরি হটলাইন যোগ করুন'}
            </h3>
            <p className="text-xs text-slate-500">
              এলাকার অ্যাম্বুলেন্স, থানা পুলিশ, হাসপাতাল, ফায়ার সার্ভিস বা বিদ্যুৎ হেল্পলাইন নম্বর যোগ করুন:
            </p>

            <form onSubmit={handleSaveEmergency} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সেবার ধরন / ক্যাটাগরি *
                </label>
                <select
                  value={emergencyForm.category}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, category: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                >
                  <option value="Ambulance">🚑 অ্যাম্বুলেন্স (Ambulance)</option>
                  <option value="Hospital">🏥 উপজেলা হাসপাতাল / স্বাস্থ্যকেন্দ্র</option>
                  <option value="Police">🚓 থানা পুলিশ (Police)</option>
                  <option value="Fire">🚒 ফায়ার সার্ভিস ও সিভিল ডিফেন্স</option>
                  <option value="Blood">🩸 জরুরি রক্তদান সমন্বয়ক</option>
                  <option value="Electricity">⚡ পল্লী বিদ্যুৎ অভিযোগ কেন্দ্র</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  সেবা বা প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বদলগাছী থানা পুলিশ (ডিউটি অফিসার)"
                  value={emergencyForm.title}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  মোবাইল / হটলাইন ফোন নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="০১৭১১-XXXXXX"
                  value={emergencyForm.phone}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    উপলব্ধতা / সময়
                  </label>
                  <input
                    type="text"
                    placeholder="২৪ ঘণ্টা"
                    value={emergencyForm.availableHours || ''}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, availableHours: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    কার্যালয় / অবস্থান
                  </label>
                  <input
                    type="text"
                    placeholder="বদলগাছী সদর"
                    value={emergencyForm.location || ''}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, location: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{editingEmergencyId ? 'আপডেট করুন' : 'হটলাইন যোগ করুন'}</span>
              </button>
            </form>
          </div>

          {/* Hotline List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              বর্তমান জরুরি হটলাইনসমূহ ({emergencyContacts.length})
            </h3>

            <div className="space-y-3">
              {emergencyContacts.map((em) => (
                <div
                  key={em.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:border-emerald-400 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {em.category}
                      </span>
                      <span className="text-xs text-slate-400">{em.availableHours}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base">{em.title}</h4>
                    <p className="text-sm font-mono font-bold text-emerald-700">{em.phone}</p>
                    {em.location && <p className="text-xs text-slate-500">অবস্থান: {em.location}</p>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingEmergencyId(em.id);
                        setEmergencyForm(em);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmergency(em.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

      {/* TAB 4: SERVICES MANAGER */}
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
                  placeholder="যেমন: অসচ্ছল ছাত্রছাত্রীদের মেধা বৃত্তি"
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
                    placeholder="যেমন: পরিষদ কার্যালয়"
                    value={serviceForm.location || ''}
                    onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  অনলাইন লিংক বা আবেদন লিঙ্ক
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

      {/* TAB 5: SLIDESHOW MANAGER */}
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
                  placeholder="স্লাইডের আকর্ষণীয় স্লোগান বা শিরোনাম"
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
                  placeholder="যেমন: ইউনিয়ন পরিষদ নির্বাচন"
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

      {/* TAB 6: NEWS & ANNOUNCEMENTS */}
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
                  placeholder="নির্বাচনী গণসংযোগ বা সংবাদ শিরোনাম"
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
                  placeholder="বিস্তারিত খবর ও কর্মসূচির বিবরণ..."
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
                    placeholder="প্রচারণা / মতবিনিময়"
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

      {/* VERCEL DEPLOYMENT & CLIENT SHOWCASE MODAL */}
      {showVercelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Vercel Deployment & Client Setup Guide</h3>
                  <p className="text-xs text-slate-500 font-semibold">ভারসেলে লাইভ করা এবং ক্লায়েন্টকে দেখানোর গাইড</p>
                </div>
              </div>
              <button
                onClick={() => setShowVercelModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Vercel কনফিগারেশন অলরেডি রেডি!
                </h4>
                <p className="text-emerald-800 text-xs">
                  প্রজেক্টে <code>vercel.json</code> ফাইল তৈরি করা হয়েছে যা SPA রাউটিং সমর্থন করে। যেকোনো গিথাব অ্যাকাউন্ট থেকে ২ মিনিটে লাইভ করা যাবে।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">১. GitHub ও Vercel দিয়ে ডিপ্লয় (প্রস্তাবিত):</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>কোডগুলো আপনার GitHub রিপোজিটরিতে Push করুন।</li>
                  <li><a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">vercel.com/new</a> তে গিয়ে আপনার GitHub রিপোজিটরিটি Import করুন।</li>
                  <li>Framework: <strong>Vite</strong> সিলেক্ট থাকবে, Build Command: <code>npm run build</code>, Output: <code>dist</code>।</li>
                  <li><strong>Deploy</strong> বাটনে চাপ দিন। ২ মিনিটে আপনার কাস্টম ডোমেইন বা <code>.vercel.app</code> লাইভ লিঙ্ক তৈরি হয়ে যাবে!</li>
                </ol>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">২. Vercel CLI দিয়ে এক কমান্ডে ডিপ্লয়:</h4>
                <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                  <span>npx vercel --prod</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npx vercel --prod');
                      setCopiedVercel(true);
                      setTimeout(() => setCopiedVercel(false), 2000);
                    }}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedVercel ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedVercel ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">৩. অন্য ক্লায়েন্ট বা প্রার্থীর কাছে কীভাবে হস্তান্তর করবেন?</h4>
                <p className="text-xs text-slate-600">
                  অ্যাডমিন প্যানেলের <strong>'প্রার্থী ও এলাকা কনফিগারেশন'</strong> ট্যাবে গিয়ে শুধু প্রার্থীর নাম, ইউনিয়ন, স্লোগান এবং ক্লায়েন্টের জিমেইল অ্যাড্রেস বসিয়ে 'সেভ' করে দিন। সাইটের সব তথ্য তাৎক্ষণিক সেই প্রার্থীর নামে রূপান্তর হয়ে যাবে!
                </p>
              </div>
            </div>

            <div className="pt-3 border-t text-right">
              <button
                onClick={() => setShowVercelModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                ঠিক আছে
              </button>
            </div>

          </div>
        </div>
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
