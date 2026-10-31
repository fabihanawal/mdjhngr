import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft,
  FileText, 
  Send, 
  CheckCircle2, 
  Star, 
  Quote, 
  Award,
  Search,
  ExternalLink,
  PlusCircle,
  Bell,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  Laptop,
  Sprout,
  Route,
  HandHeart,
  ShieldAlert,
  Users,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';
import { Slide, CandidateProfile, NewsItem, ServiceContent, ServiceCategory, EmergencyContact } from '../types';
import { SERVICE_CAT_MAP } from '../constants';

interface LandingPageProps {
  slides: Slide[];
  mpData: CandidateProfile;
  news: NewsItem[];
  services: ServiceContent[];
  emergencyContacts?: EmergencyContact[];
}

const MANIFESTO_ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
  GraduationCap: <GraduationCap className="w-8 h-8 text-blue-600" />,
  HeartPulse: <HeartPulse className="w-8 h-8 text-rose-600" />,
  Laptop: <Laptop className="w-8 h-8 text-indigo-600" />,
  Sprout: <Sprout className="w-8 h-8 text-green-600" />,
  Route: <Route className="w-8 h-8 text-amber-600" />,
  HandHeart: <HandHeart className="w-8 h-8 text-purple-600" />,
  ShieldAlert: <ShieldAlert className="w-8 h-8 text-red-600" />,
  Users: <Users className="w-8 h-8 text-cyan-600" />
};

const LandingPage: React.FC<LandingPageProps> = ({ 
  slides, 
  mpData, 
  news, 
  services,
  emergencyContacts = []
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<ServiceCategory>('Education');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceContent | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [supportPledges, setSupportPledges] = useState<number>(() => {
    const saved = localStorage.getItem('badalgachhi_pledges');
    return saved ? parseInt(saved, 10) : 1428;
  });
  const [hasPledged, setHasPledged] = useState<boolean>(() => {
    return localStorage.getItem('badalgachhi_has_pledged') === 'true';
  });
  const [citizenPledgeName, setCitizenPledgeName] = useState('');
  const [pledgeVillage, setPledgeVillage] = useState('');
  const [pledgeSubmitted, setPledgeSubmitted] = useState(false);

  // Auto-advance slides smoothly
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides, isPaused]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handlePledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPledged) {
      const nextCount = supportPledges + 1;
      setSupportPledges(nextCount);
      setHasPledged(true);
      localStorage.setItem('badalgachhi_pledges', nextCount.toString());
      localStorage.setItem('badalgachhi_has_pledged', 'true');
      setPledgeSubmitted(true);
      setTimeout(() => setPledgeSubmitted(false), 5000);
    }
  };

  // Filter services by category and search
  const filteredServices = services.filter(s => {
    const matchCat = s.category === activeTab;
    const matchSearch = searchTerm === '' || 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.details && s.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  const hasUpdates = (cat: ServiceCategory) => services.some(s => s.category === cat && s.isNew);

  return (
    <div className="animate-in fade-in duration-500 text-slate-800">
      
      {/* 1. HERO SLIDESHOW SECTION */}
      <section 
        className="relative min-h-[580px] md:h-[680px] w-full overflow-hidden bg-emerald-950 select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
              }`}
            >
              {/* Background with blur and lighting */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/90 to-emerald-900/40">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover mix-blend-overlay opacity-40 transition-transform duration-[6000ms] ease-out"
                  style={{ transform: isActive ? 'scale(1.08)' : 'scale(1.0)' }}
                />
              </div>

              {/* Slide Content */}
              <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center py-12 md:py-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                  
                  {/* Text Column */}
                  <div className="lg:col-span-7 space-y-6 text-white animate-in slide-in-from-left-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800/80 border border-emerald-400/40 backdrop-blur-md text-emerald-300 text-xs font-bold tracking-wider uppercase shadow-lg">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>{slide.badge || '১ নং বদলগাছী ইউনিয়ন পরিষদ নির্বাচন'}</span>
                    </div>

                    <div className="space-y-3">
                      {slide.subtitle && (
                        <p className="text-emerald-300 font-bold text-lg md:text-xl tracking-wide">
                          {slide.subtitle}
                        </p>
                      )}
                      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-md">
                        {slide.title}
                      </h1>
                    </div>

                    <p className="text-base sm:text-lg md:text-xl text-emerald-100/90 max-w-2xl leading-relaxed font-medium">
                      {slide.description}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link 
                        to="/report" 
                        className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-8 py-4 rounded-2xl flex items-center shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-1 active:scale-95 text-base"
                      >
                        <PlusCircle className="mr-2 w-5 h-5 text-emerald-950" />
                        সমস্যা বা উন্নয়ন প্রস্তাব জানান
                      </Link>
                      
                      <a 
                        href="#services" 
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold px-7 py-4 rounded-2xl transition-all shadow-lg flex items-center"
                      >
                        নাগরিক সেবা ও তথ্য <ChevronRight className="ml-1 w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  {/* Candidate Poster Display Column */}
                  <div className="lg:col-span-5 flex justify-center lg:justify-end">
                    <div className="relative group max-w-[320px] sm:max-w-[380px] rounded-3xl overflow-hidden border-4 border-emerald-400/30 shadow-2xl bg-emerald-900/50 backdrop-blur-sm">
                      <img
                        src={slide.imageUrl}
                        alt="মুহাম্মদ জাহাঙ্গীর আলম - চেয়ারম্যান পদপ্রার্থী"
                        className="w-full h-auto object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent p-4 text-center">
                        <p className="text-white font-black text-lg">মুহাম্মদ জাহাঙ্গীর আলম</p>
                        <p className="text-emerald-300 text-xs font-semibold">চেয়ারম্যান পদপ্রার্থী | ১ নং বদলগাছী ইউনিয়ন পরিষদ</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-white flex items-center justify-center border border-emerald-700/50 backdrop-blur-md transition-all shadow-lg hidden sm:flex"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-white flex items-center justify-center border border-emerald-700/50 backdrop-blur-md transition-all shadow-lg hidden sm:flex"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators / Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-emerald-400 w-10' : 'bg-white/30 hover:bg-white/60 w-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. EMERGENCY HOTLINE TICKER STRIP */}
      <section className="bg-emerald-700 text-white py-3 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-2 font-bold">
            <span className="bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase animate-pulse">জরুরি সেবা</span>
            <span>বদলগাছী ২৪ ঘণ্টা হটলাইন:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-600">
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              অ্যাম্বুলেন্স: <a href="tel:01715778899" className="text-amber-200 hover:underline font-bold">০১৭১৫-৭৭৮৮৯৯</a>
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-600">
              <Phone className="w-3.5 h-3.5 text-blue-300" />
              থানা পুলিশ: <a href="tel:01320143522" className="text-blue-200 hover:underline font-bold">০১৩২০-১৪৩৫২২</a>
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-600">
              <Phone className="w-3.5 h-3.5 text-rose-300" />
              জরুরি রক্তদান: <a href="tel:01718445566" className="text-rose-200 hover:underline font-bold">০১৭১৮-৪৪৫৫৬৬</a>
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-600">
              <Phone className="w-3.5 h-3.5 text-emerald-300" />
              হাসপাতাল: <a href="tel:01730324500" className="text-emerald-200 hover:underline font-bold">০১৭৩০-৩২৪৫০০</a>
            </span>
          </div>
        </div>
      </section>

      {/* 3. CANDIDATE PROFILE & INSPIRATION SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Candidate Image Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl blur-2xl opacity-20 -z-10"></div>
                <div className="bg-white p-3 rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
                  <img 
                    src={mpData.image || '/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg'} 
                    alt={mpData.name} 
                    className="w-full h-auto rounded-2xl object-cover shadow-sm"
                  />
                  <div className="p-6 text-center bg-gradient-to-b from-white to-emerald-50/60 rounded-xl mt-3 border border-emerald-100/60">
                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
                      {mpData.designation}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{mpData.name}</h3>
                    <p className="text-emerald-700 font-bold text-sm mt-1">{mpData.union}, {mpData.upazila}, {mpData.district}</p>
                    <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center justify-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{mpData.officeAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Message & Values */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider">
                <Quote className="w-4 h-4 text-emerald-700" />
                <span>জনগণের সেবায় নিবেদিতপ্রাণ</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                "সুখে দুঃখে যাকে পাই,<br />
                <span className="text-emerald-700">সে আমাদের জাহাঙ্গীর আলম ভাই"</span>
              </h2>

              <p className="text-lg text-slate-600 leading-relaxed font-normal">
                {mpData.bio}
              </p>

              <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <Star className="w-64 h-64 -mr-16 -mb-16" />
                </div>
                <h4 className="text-emerald-300 font-black text-sm uppercase tracking-widest mb-2">আমাদের রূপকল্প ও অঙ্গীকার</h4>
                <p className="text-emerald-100 text-base sm:text-lg font-medium leading-relaxed">
                  "{mpData.vision}"
                </p>
              </div>

              {/* Quick Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                  <p className="text-3xl font-black text-emerald-600">৯টি</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">ওয়ার্ডের সমন্বিত উন্নয়ন</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                  <p className="text-3xl font-black text-blue-600">১০০%</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">ঘুষমুক্ত ডিজিটাল সেবা</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                  <p className="text-3xl font-black text-rose-600">২৪/৭</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">জরুরি স্বাস্থ্য সহায়তা</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                  <p className="text-3xl font-black text-purple-600">ফ্রি</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">যুব আইটি ও সেলাই প্রশিক্ষণ</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. NINE-POINT MANIFESTO (নির্বাচনী ইশতেহার) */}
      <section id="manifesto" className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/30 px-4 py-1.5 rounded-full inline-block mb-3">
              ১ নং বদলগাছী ইউনিয়ন পরিষদ নির্বাচন
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              উন্নয়নের ৯ দফা অঙ্গীকার ও ইশতেহার
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              চেয়ারম্যান পদপ্রার্থী মুহাম্মদ জাহাঙ্গীর আলমের নেতৃত্বে আধুনিক, স্বাবলম্বী ও দুর্নীতিমুক্ত বদলগাছী ইউনিয়ন গড়ার সুনির্দিষ্ট রূপরেখা।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mpData.manifestoPoints.map((point, idx) => (
              <div 
                key={idx} 
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 p-6 sm:p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 shadow-lg group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-700/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {MANIFESTO_ICONS[point.icon] || <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                  </div>
                  <span className="text-2xl font-black text-slate-600 group-hover:text-emerald-400 transition-colors">
                    ০{idx + 1}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors mb-3">
                  {point.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {point.details}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
            >
              <PlusCircle className="w-5 h-5" />
              আপনার এলাকার উন্নয়ন প্রস্তাব পাঠান
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CITIZEN SERVICES & FACILITIES HUB (নাগরিক সেবা ও তথ্য ভান্ডার) */}
      <section id="services" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>জনগণের অধিকার ও সেবা</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              শিক্ষা, স্বাস্থ্য, চাকরি ও নাগরিক সেবা ডিরেক্টরি
            </h2>
            <p className="text-slate-600 text-base">
              বদলগাছী ইউনিয়নবাসীর কল্যাণে প্রয়োজনীয় সকল তথ্য, সরকারি সুযোগ-সুবিধা এবং প্রার্থীর বিশেষ সহায়তাসমূহ এক ঠিকানায়।
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-10 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="শিক্ষা বৃত্তি, হাসপাতাল, চাকরি, কৃষি সার বা সনদের তথ্য খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-800 text-sm transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md"
              >
                মুছুন
              </button>
            )}
          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-none mb-8">
            {Object.entries(SERVICE_CAT_MAP).map(([key, value]) => {
              const isSelected = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as ServiceCategory)}
                  className={`flex items-center gap-2 whitespace-nowrap px-6 py-3.5 rounded-2xl font-black text-sm transition-all border shrink-0 ${
                    isSelected 
                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-lg shadow-emerald-700/20 scale-102' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700'
                  } relative`}
                >
                  <span className="text-lg">{value.icon}</span>
                  <span>{value.label}</span>
                  {hasUpdates(key as ServiceCategory) && (
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Service Cards Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
              <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-xl font-black text-slate-800 mb-1">কোনো সেবা তথ্য পাওয়া যায়নি</h4>
              <p className="text-slate-500 text-sm mb-4">অনুগ্রহ করে ভিন্ন কোনো শব্দ দিয়ে অনুসন্ধান করুন।</p>
              <button 
                onClick={() => setSearchTerm('')} 
                className="text-emerald-700 font-bold hover:underline text-sm"
              >
                সকল তথ্য দেখুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div 
                  key={service.id}
                  className="bg-white rounded-3xl p-7 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        {SERVICE_CAT_MAP[service.category]?.icon} {SERVICE_CAT_MAP[service.category]?.label}
                      </span>
                      {service.isNew && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          নতুন আপডেট
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors mb-2 leading-snug">
                      {service.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {service.description}
                    </p>

                    {service.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>স্থান: {service.location}</span>
                      </div>
                    )}

                    {service.contactPhone && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-4">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>হটলাইন: {service.contactPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 group-hover:underline"
                    >
                      বিস্তারিত নিয়মাবলী <ChevronRight className="w-4 h-4" />
                    </button>

                    {service.contactPhone && (
                      <a
                        href={`tel:${service.contactPhone}`}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-2.5 rounded-xl transition-colors"
                        title="সরাসরি কল করুন"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {service.link && (
                      <a
                        href={service.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-colors"
                        title="ওয়েবসাইট লিংক"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 6. CITIZEN PROBLEM REPORTING CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-emerald-800 to-teal-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="bg-emerald-700/70 border border-emerald-400/30 text-emerald-200 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block">
                সরাসরি অভিযোগ ও প্রস্তাব সেল
              </span>
              <h2 className="text-3xl sm:text-4xl font-black">
                আপনার এলাকার রাস্তা, ড্রেন, বিদ্যুৎ বা সামাজিক সমস্যা আছে?
              </h2>
              <p className="text-emerald-100 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
                চেয়ারম্যান পদপ্রার্থী মুহাম্মদ জাহাঙ্গীর আলমের টিম প্রতিটি সমস্যা গুরুত্বের সাথে নথিভুক্ত করে প্রয়োজনীয় প্রতিকারমূলক পদক্ষেপ গ্রহণে অঙ্গীকারবদ্ধ। বেনামেও রিপোর্ট করতে পারেন।
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
              <Link
                to="/report"
                className="bg-white hover:bg-emerald-50 text-emerald-950 font-black px-8 py-5 rounded-2xl flex items-center justify-center gap-2 shadow-2xl transition-all hover:scale-102 text-base text-center"
              >
                <PlusCircle className="w-5 h-5 text-emerald-700" />
                সমস্যা রিপোর্ট করুন
              </Link>
              <Link
                to="/track"
                className="bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-600/50 text-white font-bold px-8 py-5 rounded-2xl flex items-center justify-center gap-2 transition-all text-center"
              >
                <Search className="w-5 h-5 text-emerald-400" />
                জমা দেওয়া রিপোর্ট ট্র্যাক করুন
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CAMPAIGN NEWS & COMMUNITY UPDATES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-emerald-700 font-black text-xs uppercase tracking-widest block mb-2">নির্বাচনী প্রচারণা ও গণসংযোগ</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                তৃণমূলের সংবাদ ও কার্যক্রম
              </h2>
            </div>
            <p className="text-slate-500 text-sm mt-2 md:mt-0 max-w-md">
              ১ নং বদলগাছী ইউনিয়নের ওয়ার্ডে ওয়ার্ডে সাধারণ মানুষের সাথে মতবিনিময় ও উন্নয়ন কর্মকাণ্ডের সর্বশেষ চিত্র।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200/80 hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                onClick={() => setSelectedNews(item)}
              >
                <div className="h-52 w-full overflow-hidden bg-slate-200 relative">
                  <img
                    src={item.imageUrl || '/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.category && (
                    <span className="absolute top-4 left-4 bg-emerald-800/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.date}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors mb-3 line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span>সম্পূর্ণ পড়ুন</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. CITIZEN SUPPORT PLEDGE & INVOLVEMENT SECTION */}
      <section className="py-16 bg-emerald-50 border-t border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-600/30">
            <Heart className="w-8 h-8 fill-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            জাহাঙ্গীর ভাইয়ের সততা ও উন্নয়নের পাশে থাকুন
          </h2>

          <p className="text-slate-600 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            ১ নং বদলগাছী ইউনিয়নকে দুর্নীতিমুক্ত ও একটি আধুনিক মডেল ইউনিয়নে রূপ দিতে আপনার দোয়া, সমর্থন ও একাত্মতা প্রকাশ করুন।
          </p>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-emerald-200/80 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-4xl font-black text-emerald-700">{supportPledges}</span>
              <span className="text-sm font-bold text-slate-600 text-left leading-tight">
                জন ইউনিয়নবাসী<br />ইতিমধ্যে সমর্থন জানিয়েছেন
              </span>
            </div>

            {hasPledged ? (
              <div className="bg-emerald-100 text-emerald-900 p-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>আপনার মূল্যবান সমর্থন ও শুভকামনার জন্য ধন্যবাদ!</span>
              </div>
            ) : (
              <form onSubmit={handlePledge} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="আপনার নাম"
                    value={citizenPledgeName}
                    onChange={(e) => setCitizenPledgeName(e.target.value)}
                    className="p-3.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                  <input
                    type="text"
                    required
                    placeholder="গ্রাম / ওয়ার্ড"
                    value={pledgeVillage}
                    onChange={(e) => setPledgeVillage(e.target.value)}
                    className="p-3.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
                >
                  <Heart className="w-5 h-5" />
                  আমি সমর্থন জানাচ্ছি
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SERVICE DETAILS MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{SERVICE_CAT_MAP[selectedService.category]?.icon}</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {SERVICE_CAT_MAP[selectedService.category]?.label}
                </span>
              </div>
              <button 
                onClick={() => setSelectedService(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">{selectedService.title}</h3>
              <p className="text-slate-600 leading-relaxed text-base">{selectedService.description}</p>
            </div>

            {selectedService.details && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" /> বিস্তারিত নিয়ম ও তথ্য:
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedService.details}
                </p>
              </div>
            )}

            <div className="space-y-2 text-sm text-slate-700">
              {selectedService.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <strong>স্থান / কার্যালয়:</strong> {selectedService.location}
                </p>
              )}
              {selectedService.contactPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <strong>হটলাইন নম্বর:</strong> 
                  <a href={`tel:${selectedService.contactPhone}`} className="text-emerald-700 font-bold hover:underline">
                    {selectedService.contactPhone}
                  </a>
                </p>
              )}
            </div>

            <div className="pt-4 border-t flex flex-wrap gap-3 justify-end">
              {selectedService.contactPhone && (
                <a
                  href={`tel:${selectedService.contactPhone}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> কল করুন
                </a>
              )}
              {selectedService.link && (
                <a
                  href={selectedService.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> আবেদন / ওয়েব লিংক
                </a>
              )}
              <button
                onClick={() => setSelectedService(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEWS DETAILS MODAL */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> {selectedNews.date}
              </span>
              <button 
                onClick={() => setSelectedNews(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {selectedNews.imageUrl && (
              <img
                src={selectedNews.imageUrl}
                alt={selectedNews.title}
                className="w-full h-64 object-cover rounded-2xl"
              />
            )}

            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{selectedNews.title}</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                {selectedNews.content}
              </p>
            </div>

            <div className="pt-4 border-t text-right">
              <button
                onClick={() => setSelectedNews(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl"
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

export default LandingPage;
