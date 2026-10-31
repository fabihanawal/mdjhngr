import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  CitizenReport, 
  Slide, 
  CandidateProfile, 
  NewsItem, 
  ServiceContent, 
  EmergencyContact 
} from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authorized admin email
export const AUTHORIZED_ADMIN_EMAIL = 'rstsbd@gmail.com';

// Error Handler conforming strictly to FirestoreErrorInfo requirement
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
    return false;
  }
}

// ----------------- CRUD & Realtime Subscriptions -----------------

// Citizen Reports
export function subscribeReports(
  onUpdate: (reports: CitizenReport[]) => void, 
  onError?: (err: Error) => void
) {
  const reportsCol = collection(db, 'reports');
  return onSnapshot(reportsCol, (snapshot) => {
    const list: CitizenReport[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CitizenReport);
    });
    // Sort descending by date
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(list);
  }, (err) => {
    try {
      handleFirestoreError(err, OperationType.GET, 'reports');
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  });
}

export async function addReportToDb(report: CitizenReport): Promise<void> {
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${report.id}`);
  }
}

export async function updateReportInDb(id: string, updates: Partial<CitizenReport>): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${id}`);
  }
}

export async function deleteReportFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reports', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `reports/${id}`);
  }
}

// Slides
export function subscribeSlides(
  onUpdate: (slides: Slide[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, 'slides'), (snapshot) => {
    const list: Slide[] = [];
    snapshot.forEach(docSnap => list.push(docSnap.data() as Slide));
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (err) => {
    try {
      handleFirestoreError(err, OperationType.GET, 'slides');
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  });
}

export async function saveSlideToDb(slide: Slide): Promise<void> {
  try {
    await setDoc(doc(db, 'slides', slide.id), slide);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `slides/${slide.id}`);
  }
}

export async function deleteSlideFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'slides', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `slides/${id}`);
  }
}

// Services
export function subscribeServices(
  onUpdate: (services: ServiceContent[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, 'services'), (snapshot) => {
    const list: ServiceContent[] = [];
    snapshot.forEach(docSnap => list.push(docSnap.data() as ServiceContent));
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (err) => {
    try {
      handleFirestoreError(err, OperationType.GET, 'services');
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  });
}

export async function saveServiceToDb(service: ServiceContent): Promise<void> {
  try {
    await setDoc(doc(db, 'services', service.id), service);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `services/${service.id}`);
  }
}

export async function deleteServiceFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
  }
}

// News
export function subscribeNews(
  onUpdate: (news: NewsItem[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, 'news'), (snapshot) => {
    const list: NewsItem[] = [];
    snapshot.forEach(docSnap => list.push(docSnap.data() as NewsItem));
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (err) => {
    try {
      handleFirestoreError(err, OperationType.GET, 'news');
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  });
}

export async function saveNewsToDb(newsItem: NewsItem): Promise<void> {
  try {
    await setDoc(doc(db, 'news', newsItem.id), newsItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `news/${newsItem.id}`);
  }
}

export async function deleteNewsFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'news', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `news/${id}`);
  }
}

// Candidate Profile
export function subscribeCandidateProfile(
  onUpdate: (profile: CandidateProfile) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(doc(db, 'candidateProfile', 'main'), (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as CandidateProfile);
    }
  }, (err) => {
    try {
      handleFirestoreError(err, OperationType.GET, 'candidateProfile/main');
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  });
}

export async function saveCandidateProfileToDb(profile: CandidateProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'candidateProfile', 'main'), profile);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'candidateProfile/main');
  }
}

// Emergency Contacts
export function subscribeEmergencyContacts(
  onUpdate: (contacts: EmergencyContact[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, 'emergencyContacts'), (snapshot) => {
    const list: EmergencyContact[] = [];
    snapshot.forEach(docSnap => list.push(docSnap.data() as EmergencyContact));
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (err) => {
    try {
      handleFirestoreError(err, OperationType.GET, 'emergencyContacts');
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  });
}

export async function saveEmergencyContactToDb(contact: EmergencyContact): Promise<void> {
  try {
    await setDoc(doc(db, 'emergencyContacts', contact.id), contact);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `emergencyContacts/${contact.id}`);
  }
}

export async function deleteEmergencyContactFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'emergencyContacts', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `emergencyContacts/${id}`);
  }
}

// Auth Helpers
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
