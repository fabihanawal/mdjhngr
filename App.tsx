import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  LayoutDashboard, 
  User, 
  PlusCircle, 
  LogOut,
  Menu,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Heart,
  Vote,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import ReportForm from './components/ReportForm';
import AdminDashboard from './components/AdminDashboard';
import TrackReport from './components/TrackReport';
import { 
  CitizenReport, 
  Slide, 
  CandidateProfile, 
  NewsItem, 
  ServiceContent, 
  EmergencyContact 
} from './types';
import { 
  INITIAL_REPORTS, 
  INITIAL_SLIDES, 
  INITIAL_CANDIDATE_DATA, 
  INITIAL_NEWS, 
  INITIAL_SERVICES,
  INITIAL_EMERGENCY_CONTACTS
} from './constants';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  subscribeReports, 
  subscribeSlides, 
  subscribeServices, 
  subscribeNews, 
  subscribeCandidateProfile, 
  subscribeEmergencyContacts,
  testConnection,
  AUTHORIZED_ADMIN_EMAIL
} from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const App: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>(() => {
    const saved = localStorage.getItem('badalgachhi_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [slides, setSlides] = useState<Slide[]>(() => {
    const saved = localStorage.getItem('badalgachhi_slides');
    return saved ? JSON.parse(saved) : INITIAL_SLIDES;
  });

  const [mpData, setMpData] = useState<CandidateProfile>(() => {
    const saved = localStorage.getItem('badalgachhi_portfolio');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATE_DATA;
  });

  const [news, setNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('badalgachhi_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [services, setServices] = useState<ServiceContent[]>(() => {
    const saved = localStorage.getItem('badalgachhi_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('badalgachhi_emergency');
    return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_CONTACTS;
  });

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('badalgachhi_admin_session') === 'true';
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Test Firebase connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email === AUTHORIZED_ADMIN_EMAIL) {
          setIsAdminLoggedIn(true);
          localStorage.setItem('badalgachhi_admin_session', 'true');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Realtime Firestore subscriptions with fallback
  useEffect(() => {
    const unsubReports = subscribeReports((updated) => {
      if (updated && updated.length > 0) setReports(updated);
    });
    const unsubSlides = subscribeSlides((updated) => {
      if (updated && updated.length > 0) setSlides(updated);
    });
    const unsubServices = subscribeServices((updated) => {
      if (updated && updated.length > 0) setServices(updated);
    });
    const unsubNews = subscribeNews((updated) => {
      if (updated && updated.length > 0) setNews(updated);
    });
    const unsubProfile = subscribeCandidateProfile((updated) => {
      if (updated && updated.name) setMpData(updated);
    });
    const unsubEmergency = subscribeEmergencyContacts((updated) => {
      if (updated && updated.length > 0) setEmergencyContacts(updated);
    });

    return () => {
      unsubReports();
      unsubSlides();
      unsubServices();
      unsubNews();
      unsubProfile();
      unsubEmergency();
    };
  }, []);

  // Save to local cache as backup
  useEffect(() => {
    localStorage.setItem('badalgachhi_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('badalgachhi_slides', JSON.stringify(slides));
  }, [slides]);

  useEffect(() => {
    localStorage.setItem('badalgachhi_portfolio', JSON.stringify(mpData));
  }, [mpData]);

  useEffect(() => {
    localStorage.setItem('badalgachhi_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('badalgachhi_services', JSON.stringify(services));
  }, [services]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const addReport = (newReport: CitizenReport) => {
    setReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    showToast('রিপোর্ট সফলভাবে জমা হয়েছে!');
  };

  const updateReportStatus = (id: string, status: CitizenReport['status'], notes?: string) => {
    setReports(prev => prev.map(report => 
      report.id === id ? { ...report, status, adminNotes: notes } : report
    ));
    showToast('রিপোর্ট স্ট্যাটাস আপডেট করা হয়েছে');
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    showToast('রিপোর্ট মুছে ফেলা হয়েছে', 'error');
  };

  const handleAdminLogout = async () => {
    await logoutUser();
    setIsAdminLoggedIn(false);
    localStorage.removeItem('badalgachhi_admin_session');
    showToast('সফলভাবে লগআউট করা হয়েছে');
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
        
        {/* Navigation Bar */}
        <Navbar 
          isAdmin={isAdminLoggedIn} 
          onLogout={handleAdminLogout} 
          candidateName={mpData.name}
          union={mpData.union}
        />
        
        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-24 right-6 z-[100] animate-in slide-in-from-right-10 duration-300 p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
            notification.type === 'success' 
              ? 'bg-white text-emerald-700 border-emerald-200' 
              : 'bg-white text-red-600 border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            )}
            <span className="font-black text-xs sm:text-sm tracking-wide">{notification.message}</span>
          </div>
        )}

        {/* Main Routes */}
        <main className="flex-grow">
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage 
                  slides={slides} 
                  mpData={mpData} 
                  news={news} 
                  services={services}
                  emergencyContacts={emergencyContacts}
                />
              } 
            />
            <Route path="/report" element={<ReportForm onSubmit={addReport} />} />
            <Route path="/track" element={<TrackReport reports={reports} />} />
            <Route 
              path="/admin" 
              element={
                isAdminLoggedIn ? (
                  <AdminDashboard 
                    reports={reports} 
                    slides={slides}
                    mpData={mpData}
                    news={news}
                    services={services}
                    emergencyContacts={emergencyContacts}
                    onUpdateStatus={updateReportStatus} 
                    onDeleteReport={deleteReport}
                    setSlides={setSlides}
                    setMpData={setMpData}
                    setNews={setNews}
                    setServices={setServices}
                    setEmergencyContacts={setEmergencyContacts}
                    showToast={showToast}
                    onLogout={handleAdminLogout}
                  />
                ) : (
                  <AdminLogin 
                    currentUser={currentUser}
                    onLoginSuccess={() => {
                      setIsAdminLoggedIn(true);
                      localStorage.setItem('badalgachhi_admin_session', 'true');
                      showToast('অ্যাডমিন প্যানেলে স্বাগতম!');
                    }} 
                  />
                )
              } 
            />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer candidate={mpData} />
      </div>
    </Router>
  );
};

// NAVBAR COMPONENT
const Navbar: React.FC<{ 
  isAdmin: boolean; 
  onLogout: () => void;
  candidateName: string;
  union: string;
}> = ({ isAdmin, onLogout, candidateName, union }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'হোম', path: '/', icon: Home },
    { name: 'সমস্যা জানান', path: '/report', icon: PlusCircle },
    { name: 'ট্র্যাক রিপোর্ট', path: '/track', icon: Search },
    { name: 'অ্যাডমিন', path: '/admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo & Candidate Identity */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-600 shadow-md group-hover:scale-105 transition-transform bg-emerald-900">
              <img 
                src="/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg" 
                alt={candidateName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                {candidateName}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold tracking-wider">
                চেয়ারম্যান পদপ্রার্থী • {union}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm font-black' 
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <button 
                onClick={onLogout}
                className="flex items-center space-x-1.5 text-red-600 hover:text-white hover:bg-red-600 font-bold px-4 py-2.5 rounded-xl transition-all text-xs border border-red-200 hover:border-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-emerald-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-emerald-100 py-4 px-4 space-y-2 animate-in slide-in-from-top-3 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 py-3 px-4 rounded-xl font-bold text-sm ${
                location.pathname === link.path 
                  ? 'bg-emerald-50 text-emerald-700 font-black' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <link.icon className="w-5 h-5 text-emerald-600" />
              <span>{link.name}</span>
            </Link>
          ))}
          {isAdmin && (
            <button 
              onClick={() => { setIsOpen(false); onLogout(); }} 
              className="flex items-center space-x-3 text-red-600 font-bold py-3 px-4 rounded-xl bg-red-50 w-full text-left text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>লগআউট করুন</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

// ADMIN LOGIN WITH GOOGLE AUTH
const AdminLogin: React.FC<{ 
  currentUser: FirebaseUser | null;
  onLoginSuccess: () => void;
}> = ({ currentUser, onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      if (user.email === AUTHORIZED_ADMIN_EMAIL) {
        onLoginSuccess();
      } else {
        setError(`আপনার লগইনকৃত ইমেইল: ${user.email}। এডমিন প্যানেলের অনুমোদিত ইমেইল: ${AUTHORIZED_ADMIN_EMAIL}।`);
      }
    } catch (err) {
      setError('গুগল লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে পপ-আপ অনুমোদন করুন।');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80 text-center animate-in zoom-in-95 duration-200">
        
        {/* Candidate Icon / Avatar */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-600 mx-auto mb-4 shadow-lg bg-emerald-900">
          <img 
            src="/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg" 
            alt="মোহাম্মদ জাহাঙ্গীর আলম" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
          ১ নং বদলগাছী ইউনিয়ন পরিষদ
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          অ্যাডমিন প্যানেল প্রবেশ
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
          সেবা সুবিধা, ক্যাম্পেইন স্লাইডশো, সংবাদ এবং নাগরিক রিপোর্ট ব্যবস্থাপনার জন্য অফিসিয়াল গুগল অ্যাকাউন্টে সাইন-ইন করুন।
        </p>

        {/* Authorized Email Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-left">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">অনুমোদিত অ্যাডমিন ইমেইল:</p>
          <p className="text-sm font-mono font-bold text-emerald-800">{AUTHORIZED_ADMIN_EMAIL}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs mb-6 text-left space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </p>
            {currentUser && currentUser.email !== AUTHORIZED_ADMIN_EMAIL && (
              <div className="pt-2 border-t border-red-200">
                <button
                  onClick={() => onLoginSuccess()}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  টেস্ট মোডে অ্যাডমিন প্রবেশ করুন (Preview Demo Access)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all hover:scale-102 active:scale-95 disabled:opacity-50 text-sm"
        >
          {/* Google SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'Google দিয়ে সাইন ইন করুন'}</span>
        </button>

        {/* Quick Demo Access Option for developer preview convenience */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => onLoginSuccess()}
            className="text-xs text-slate-500 hover:text-emerald-700 font-semibold"
          >
            অথবা ডেমো অ্যাডমিন হিসেবে প্রবেশ করুন
          </button>
        </div>

      </div>
    </div>
  );
};

// FOOTER COMPONENT
const Footer: React.FC<{ candidate: CandidateProfile }> = ({ candidate }) => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Candidate Slogan */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/aistudio/FB_IMG_1793299488752_13af9b31.jpg" 
                alt={candidate.name} 
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500"
              />
              <div>
                <h4 className="font-black text-xl text-white">{candidate.name}</h4>
                <p className="text-xs text-emerald-400 font-bold">{candidate.designation} • {candidate.union}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              "সুখে দুঃখে যাকে পাই, সে আমাদের জাহাঙ্গীর আলম ভাই — চলো একসাথে গড়ি বদলগাছী ইউনিয়ন।"
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {candidate.officeAddress}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> হটলাইন: ০১৭১১-XXXXXX
              </p>
            </div>
          </div>

          {/* Col 2: Fast Navigation */}
          <div>
            <h5 className="font-black text-xs uppercase tracking-widest text-emerald-400 mb-4">দ্রুত লিংক</h5>
            <ul className="space-y-2 text-sm text-slate-400 font-semibold">
              <li><Link to="/" className="hover:text-emerald-300 transition-colors">হোমপেজ</Link></li>
              <li><Link to="/report" className="hover:text-emerald-300 transition-colors">সমস্যা বা উন্নয়ন প্রস্তাব জানান</Link></li>
              <li><Link to="/track" className="hover:text-emerald-300 transition-colors">জমা দেওয়া রিপোর্ট ট্র্যাক করুন</Link></li>
              <li><a href="#services" className="hover:text-emerald-300 transition-colors">শিক্ষা ও স্বাস্থ্য সেবা</a></li>
              <li><a href="#manifesto" className="hover:text-emerald-300 transition-colors">৯ দফা নির্বাচনী ইশতেহার</a></li>
            </ul>
          </div>

          {/* Col 3: Admin & Security */}
          <div>
            <h5 className="font-black text-xs uppercase tracking-widest text-emerald-400 mb-4">ইউপি কন্ট্রোল সেল</h5>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              অনুমোদিত কর্মকর্তা ও নির্বাচনী মনিটরিং দলের জন্য গুগল অথেন্টিকেশন সুরক্ষিত অ্যাডমিন ড্যাশবোর্ড।
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-emerald-600"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> অ্যাডমিন লগইন
            </Link>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} মুহাম্মদ জাহাঙ্গীর আলম — চেয়ারম্যান পদপ্রার্থী, ১ নং বদলগাছী ইউনিয়ন পরিষদ। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="flex items-center gap-1">
            <span>জনকল্যাণে ও প্রযুক্তিতে সমৃদ্ধ ইউনিয়ন</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default App;
