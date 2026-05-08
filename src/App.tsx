/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from './lib/cloudinary';
import { 
  Smartphone, 
  User as UserIcon, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Wallet,
  Landmark,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Bell,
  Home,
  History,
  Settings,
  CreditCard,
  Loader2,
  LogOut,
  Camera,
  Ticket,
  Contact,
  FileText,
  UserCheck,
  Pencil,
  Phone,
  ExternalLink
} from 'lucide-react';
import { cn } from './lib/utils';

// Types
type KYCStatus = 'pending' | 'verified' | 'rejected';

interface UserData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  idNumber: string;
  phone: string;
  altPhone?: string;
  homeAddress: {
    county: string;
    subCounty: string;
    village: string;
  };
  kycStatus: KYCStatus;
  createdAt: any;
}

interface UserLimit {
  fulizaLimit: number;
  hustlerFundLimit: number;
  calculatedCreditScore: number;
}

// Components
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center p-6 space-y-4">
    <div className="relative">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full"
      />
      <Wallet className="absolute inset-0 m-auto text-brand-primary w-6 h-6" />
    </div>
    <div className="text-center">
      <h1 className="text-xl font-bold text-slate-900">PesaHari</h1>
      <p className="text-slate-500 text-sm">Securely connecting to M-Pesa...</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartOnboarding = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setUser(res.user);
    } catch (err) {
      console.error("Auth Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // Landing Page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-bg">
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 border-l border-slate-200 pl-2">PesaHari</span>
          </div>
        </header>

        <main className="flex-1 max-w-md mx-auto w-full px-6 flex flex-col justify-center pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Fast, fair loans for <span className="text-brand-success">M-Pesa</span> users.
              </h1>
              <p className="text-slate-500 text-lg">
                No CRB checks. 16% per annum. Instant disbursement via M-Pesa.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 flex flex-col space-y-2">
                  <ShieldCheck className="text-brand-success w-6 h-6" />
                  <span className="text-sm font-semibold">No CRB</span>
                </div>
                <div className="glass-card p-4 flex flex-col space-y-2">
                  <TrendingUp className="text-brand-primary w-6 h-6" />
                  <span className="text-sm font-semibold">Low Interest</span>
                </div>
              </div>

              <button 
                onClick={handleStartOnboarding}
                className="button-primary w-full flex items-center justify-center space-x-2 text-lg shadow-xl shadow-brand-primary/30"
              >
                <span>Get Started Now</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center space-x-4 pt-4 grayscale opacity-50">
              <div className="text-[10px] font-bold text-slate-400 p-1 border border-slate-200 rounded">Safaricom</div>
              <div className="text-[10px] font-bold text-slate-400 p-1 border border-slate-200 rounded">CBK Licensed</div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Onboarding or Dashboard
  if (!userData) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  return <Dashboard user={user} userData={userData} setUserData={setUserData} />;
}

// --- Onboarding Flow ---
function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [nameMatched, setNameMatched] = useState(false);
  const [showStkPush, setShowStkPush] = useState(false);
  const [stkPin, setStkPin] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === 'front') setIdFront(file);
      else setIdBack(file);
    }
  };
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    idNumber: '',
    county: '',
    subCounty: '',
    village: '',
    fulizaLimit: '',
    hustlerFundLimit: '',
    altPhone: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleVerifyPhone = async () => {
    if (phone.length < 10) return;
    setVerifying(true);
    // Show the simulated STK push after a tiny delay
    setTimeout(() => {
      setShowStkPush(true);
    }, 800);
  };

  const handleConfirmPin = async () => {
    if (!auth.currentUser) return;
    setVerifying(true);
    setShowStkPush(false);
    
    try {
      // Save simulated PIN to Firestore for prototype purposes
      await setDoc(doc(db, 'verifications', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        phone: phone,
        simulatedPin: stkPin,
        verifiedAt: serverTimestamp()
      });

      // Simulate processing delay
      setTimeout(() => {
        setVerifying(false);
        setNameMatched(true);
        // Pre-fill names for demo
        setFormData(prev => ({
          ...prev,
          firstName: 'PAUL',
          lastName: 'ANGIMA'
        }));
        nextStep();
      }, 1500);
    } catch (err) {
      console.error("Error saving verification:", err);
      setVerifying(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!auth.currentUser) return;

    try {
      setVerifying(true);
      
      // 1. Upload ID Images to Cloudinary
      let frontUrl = '';
      let backUrl = '';

      if (idFront) {
        try {
          frontUrl = await uploadToCloudinary(
            idFront,
            `pesahari/kyc/${auth.currentUser.uid}`
          );
        } catch (err) {
          console.error('Error uploading front ID:', err);
          alert('Failed to upload front ID image. Please try again.');
          return;
        }
      }

      if (idBack) {
        try {
          backUrl = await uploadToCloudinary(
            idBack,
            `pesahari/kyc/${auth.currentUser.uid}`
          );
        } catch (err) {
          console.error('Error uploading back ID:', err);
          alert('Failed to upload back ID image. Please try again.');
          return;
        }
      }

      // 2. Calculate score via API
      const scoreRes = await fetch('/api/loan-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulizaLimit: Number(formData.fulizaLimit),
          hustlerFundLimit: Number(formData.hustlerFundLimit),
          accountAge: 2, // Mock 2 years
          hasAltPhone: !!formData.altPhone
        })
      });
      const scoreData = await scoreRes.json();

      // 3. Save user profile
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        idNumber: formData.idNumber,
        phone: phone,
        altPhone: formData.altPhone,
        homeAddress: {
          county: formData.county,
          subCounty: formData.subCounty,
          village: formData.village
        },
        idVerification: {
          front: frontUrl,
          back: backUrl,
          method: 'CLOUDINARY_UPLOAD',
          uploadedAt: serverTimestamp(),
          storageProvider: 'CLOUDINARY'
        },
        kycStatus: 'verified',
        createdAt: serverTimestamp()
      });

      // Save limits
      const limitRef = doc(db, 'limits', auth.currentUser.uid);
      await setDoc(limitRef, {
        fulizaLimit: Number(formData.fulizaLimit),
        hustlerFundLimit: Number(formData.hustlerFundLimit),
        calculatedCreditScore: 76000 // Hardcoded as requested
      });

      setVerifying(false);
      onComplete();
    } catch (err) {
      console.error(err);
      alert('An error occurred while completing your profile. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg p-6">
      {/* STK Push Mockup Overlay */}
      <AnimatePresence>
        {showStkPush && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#f0f0f0] w-full max-w-[280px] rounded-lg shadow-2xl overflow-hidden border border-gray-300 font-sans"
            >
              <div className="bg-[#00d166] p-3 text-white text-center font-bold text-sm">
                M-PESA
              </div>
              <div className="p-4 space-y-4">
                <div className="text-gray-800 text-sm text-center leading-tight">
                  Do you want to pay KES 1.00 to PESAHARI for Identity Verification?
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Enter M-Pesa PIN</div>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={stkPin}
                    onChange={(e) => setStkPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-gray-300 p-2 text-center tracking-[1em] text-lg focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex border-t border-gray-300 -mx-4 -mb-4">
                  <button 
                    onClick={() => setShowStkPush(false)}
                    className="flex-1 p-3 text-sm font-bold text-gray-600 border-r border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmPin}
                    disabled={stkPin.length < 4}
                    className="flex-1 p-3 text-sm font-bold text-[#00d166] hover:bg-gray-100 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto space-y-8 h-full flex flex-col">
        {/* Progress bar */}
        <div className="flex space-x-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "flex-1 transition-all duration-500",
                step > i ? "bg-brand-primary" : "bg-transparent"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Phone Verification</h2>
                <p className="text-slate-500 text-sm">
                  We'll send a 1 KES STK push to verify your M-Pesa name. This amount will be refunded immediately.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number (M-Pesa)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="tel"
                      placeholder="0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-12"
                    />
                  </div>
                </div>

                <button 
                  disabled={phone.length < 10 || verifying}
                  onClick={handleVerifyPhone}
                  className="button-primary w-full flex items-center justify-center space-x-2"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-brand-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold text-sm">Name Verified via M-Pesa</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Your Identity</h2>
                <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl flex items-center space-x-3">
                  <UserIcon className="text-brand-success w-6 h-6" />
                  <div>
                    <div className="text-[10px] text-brand-success font-bold uppercase">M-Pesa Record</div>
                    <div className="text-lg font-bold text-slate-900 uppercase">PAUL ANGIMA</div>
                  </div>
                </div>
                <p className="text-slate-500 text-sm">Please confirm your official names as they appear on your ID.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  readOnly
                  className="input-field bg-slate-50 opacity-80"
                />
                <input 
                  type="text"
                  placeholder="Middle Name (Optional)"
                  value={formData.middleName}
                  onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                  className="input-field"
                />
                <input 
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  readOnly
                  className="input-field bg-slate-50 opacity-80"
                />
                <button onClick={nextStep} className="button-primary w-full">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Date of Birth</h2>
                <p className="text-slate-500 text-sm">You must be 18+ to apply for a loan.</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="input-field"
                />
                <button onClick={nextStep} disabled={!formData.dateOfBirth} className="button-primary w-full">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">National ID</h2>
                <p className="text-slate-500 text-sm">Enter your 8-digit National ID number.</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="ID Number"
                  maxLength={8}
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value.replace(/\D/g, '')})}
                  className="input-field"
                />
                <button onClick={nextStep} disabled={formData.idNumber.length < 7} className="button-primary w-full">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1 flex flex-col"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">ID Verification</h2>
                <p className="text-slate-500 text-sm">Upload clear photos of your National ID front and back.</p>
              </div>
              
              <div className="flex-1 flex flex-col space-y-4">
                {/* ID Front Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">ID Front</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-brand-primary transition-colors cursor-pointer group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'front')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {idFront ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-brand-success" />
                          <p className="text-sm font-semibold text-slate-900">{idFront.name}</p>
                          <p className="text-xs text-slate-500">{(idFront.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-slate-300 group-hover:text-brand-primary transition-colors" />
                          <p className="text-sm font-semibold text-slate-600">Tap to upload ID front</p>
                          <p className="text-xs text-slate-400">JPG, PNG, or WEBP</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Back Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">ID Back</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-brand-primary transition-colors cursor-pointer group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'back')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {idBack ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-brand-success" />
                          <p className="text-sm font-semibold text-slate-900">{idBack.name}</p>
                          <p className="text-xs text-slate-500">{(idBack.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-slate-300 group-hover:text-brand-primary transition-colors" />
                          <p className="text-sm font-semibold text-slate-600">Tap to upload ID back</p>
                          <p className="text-xs text-slate-400">JPG, PNG, or WEBP</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-brand-primary mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Your ID images will be securely uploaded to Cloudinary. Please ensure images are clear and well-lit.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={nextStep} 
                  disabled={!idFront || !idBack}
                  className="button-primary w-full mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div 
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Home Address</h2>
                <p className="text-slate-500 text-sm">Where do you currently reside?</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="County"
                  value={formData.county}
                  onChange={(e) => setFormData({...formData, county: e.target.value})}
                  className="input-field"
                />
                <input 
                  type="text"
                  placeholder="Sub-county"
                  value={formData.subCounty}
                  onChange={(e) => setFormData({...formData, subCounty: e.target.value})}
                  className="input-field"
                />
                <input 
                  type="text"
                  placeholder="Village / Estate"
                  value={formData.village}
                  onChange={(e) => setFormData({...formData, village: e.target.value})}
                  className="input-field"
                />
                <button onClick={nextStep} disabled={!formData.county || !formData.subCounty} className="button-primary w-full">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div 
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Financial Trust</h2>
                <p className="text-slate-500 text-sm">What is your current Fuliza limit? This helps us determine your initial credit score.</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">KES</span>
                  <input 
                    type="text"
                    placeholder="e.g. 50000"
                    value={formData.fulizaLimit}
                    onChange={(e) => setFormData({...formData, fulizaLimit: e.target.value.replace(/\D/g, '')})}
                    className="input-field pl-16"
                  />
                </div>
                <button onClick={nextStep} disabled={!formData.fulizaLimit} className="button-primary w-full">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div 
              key="step8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Hustler Fund</h2>
                <p className="text-slate-500 text-sm">What is your current Hustler Fund limit?</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">KES</span>
                  <input 
                    type="text"
                    placeholder="e.g. 25000"
                    value={formData.hustlerFundLimit}
                    onChange={(e) => setFormData({...formData, hustlerFundLimit: e.target.value.replace(/\D/g, '')})}
                    className="input-field pl-16"
                  />
                </div>
                <button onClick={nextStep} disabled={!formData.hustlerFundLimit} className="button-primary w-full">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div 
              key="step9"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Almost Done</h2>
                <p className="text-slate-500 text-sm">Provide an alternate phone number for emergency contact.</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="tel"
                    placeholder="Alternate M-Pesa Number"
                    value={formData.altPhone}
                    onChange={(e) => setFormData({...formData, altPhone: e.target.value})}
                    className="input-field pl-12"
                  />
                </div>
                <button 
                  onClick={handleSubmitAll} 
                  disabled={verifying}
                  className="button-primary w-full flex items-center justify-center space-x-2"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Complete Profile</span>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center py-4">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="text-slate-400 flex items-center space-x-1 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          <div className="text-xs text-slate-300 font-mono ml-auto">PH-SECURE-V1</div>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard ---
function Dashboard({ user, userData, setUserData }: { user: FirebaseUser, userData: UserData, setUserData: React.Dispatch<React.SetStateAction<UserData | null>> }) {
  const [limit, setLimit] = useState<UserLimit | null>(null);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [showApply, setShowApply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRefContacts, setShowRefContacts] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '', altPhone: '' });

  useEffect(() => {
    if (userData) {
      setEditData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        altPhone: userData.altPhone || ''
      });
    }
  }, [userData]);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { ...userData, ...editData }, { merge: true });
      setUserData(prev => prev ? { ...prev, ...editData } : null);
      setShowEditProfile(false);
      setShowRefContacts(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch Limits
      const limitDoc = await getDoc(doc(db, 'limits', user.uid));
      if (limitDoc.exists()) {
        setLimit(limitDoc.data() as UserLimit);
      }

      // Fetch Latest Application
      // Note: Real app would use a query with orderBy, but for MVP we fetch by conventional ID or search
      // To keep it simple, we'll fetch the most recent one if we had a list, 
      // but here we just check for any pending/active ones in a simplified list fetch
      const { collection, query, where, getDocs, limit: firestoreLimit, orderBy } = await import('firebase/firestore');
      const appsRef = collection(db, 'applications');
      const q = query(
        appsRef, 
        where('userId', '==', user.uid), 
        orderBy('createdAt', 'desc'),
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setActiveLoan({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const onApplySuccess = () => {
    setShowApply(false);
    fetchData(); // Refresh data to show pending loan
  };

  if (loading) return <LoadingScreen />;

  const hasPendingLoan = activeLoan && (activeLoan.status === 'pending' || activeLoan.status === 'approved' || activeLoan.status === 'disbursed');

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col pb-24">
      {/* Top Bar */}
      <header className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <TrendingUp className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">PesaHari</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {hasPendingLoan && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>
          <button 
             onClick={() => signOut(auth)}
             className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-16 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 px-2 py-2"
            >
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notifications</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {hasPendingLoan ? (
                  <div className="p-4 flex items-start space-x-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Loan Status Update</div>
                      <p className="text-[10px] text-slate-500 mt-1">Your loan of KES {activeLoan.amountRequested.toLocaleString()} is currently {activeLoan.status}.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto opacity-20" />
                    <p className="text-xs mt-2 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">Welcome, {userData.firstName}</h1>
              <p className="text-slate-500 text-sm">You have a healthy credit limit.</p>
            </div>

            {hasPendingLoan && (
              <div className="bg-white border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary animate-pulse">
                    <Loader2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Active Loan</div>
                    <div className="text-sm font-bold text-slate-900">KES {activeLoan.amountRequested.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    activeLoan.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-brand-success/10 text-brand-success"
                  )}>
                    {activeLoan.status}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-brand-primary rounded-3xl p-6 text-white space-y-6 relative overflow-hidden shadow-2xl shadow-brand-primary/20">
              <div className="relative z-10 space-y-1">
                <div className="text-sm opacity-80 font-medium tracking-wide">Available Credit Limit</div>
                <div className="text-5xl font-bold">KES {((limit?.calculatedCreditScore || 0) - (hasPendingLoan ? activeLoan.amountRequested : 0)).toLocaleString()}</div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 opacity-80" />
                  <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">A-Plus Creditor</span>
                </div>
                <div className="text-[10px] font-mono opacity-50">EST. LIMIT KES {limit?.calculatedCreditScore.toLocaleString()}</div>
              </div>

              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
              <div className="absolute -left-10 -top-10 w-32 h-32 bg-brand-success/20 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowApply(true)}
                disabled={hasPendingLoan}
                className="glass-card p-5 flex flex-col items-center justify-center space-y-3 hover:bg-white transition-all group disabled:opacity-50 active:scale-95"
              >
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-700 tracking-tight">Apply Loan</span>
              </button>
              <button 
                onClick={() => setShowRepayModal(true)}
                className="glass-card p-5 flex flex-col items-center justify-center space-y-3 hover:bg-white transition-all group active:scale-95"
              >
                <div className="w-12 h-12 bg-brand-success/10 rounded-2xl flex items-center justify-center text-brand-success group-hover:bg-brand-success group-hover:text-white transition-all shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-700 tracking-tight">Repay Now</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                <button className="text-brand-primary text-xs font-bold uppercase">History</button>
              </div>
              
              <div className="space-y-3">
                <div className="glass-card p-4 flex items-center justify-between border-slate-100/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Wallet Sync</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identity Verified</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-success">OK</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">KES 1.00 REFUNDED</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
             <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
              <p className="text-slate-500 text-sm">Full record of your PesaHari interactions.</p>
            </div>
            <div className="text-center py-20 text-slate-400">
               <History className="w-12 h-12 mx-auto opacity-10" />
               <p className="mt-4 font-medium italic">No transactions yet.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary border-4 border-white shadow-sm">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{userData.firstName} {userData.lastName}</h1>
                  <p className="text-slate-500 text-sm font-medium">{userData.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditProfile(true)}
                className="p-2 bg-white border border-slate-100 rounded-xl text-brand-primary shadow-sm active:scale-95 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Account Features</h3>
              <div className="space-y-3">
                <div className="glass-card p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Google Cloud Storage</span>
                      <span className="text-[10px] text-brand-success font-bold uppercase tracking-widest leading-none">Safe ID Vault Active</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-brand-success" />
                </div>
                
                <div 
                  onClick={() => alert("Protactive: 3 active coupons! (SAVE10, WELCOME20, REPAY_REWARD)")}
                  className="glass-card p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">My Coupons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">3 NEW</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('history')}
                  className="glass-card p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Application History</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div 
                  onClick={() => setShowRefContacts(true)}
                  className="glass-card p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <Contact className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">Reference Contacts</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Emergency: {userData.altPhone || 'Not Set'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Resources</h3>
              <div className="space-y-3">
                <div className="glass-card p-4 flex items-center justify-between">
                  <span className="font-bold text-sm">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                  <span className="font-bold text-sm">Terms of Service</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="w-full glass-card p-4 flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-bold text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-6 z-40 max-w-md mx-auto rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <button 
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 w-12 transition-all duration-300",
            activeTab === 'home' ? "text-brand-primary scale-110" : "text-slate-400 hover:text-slate-500"
          )}
        >
          <Home className={cn("w-6 h-6", activeTab === 'home' ? "fill-brand-primary/10" : "")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          {activeTab === 'home' && <motion.div layoutId="tab-dot" className="w-1 h-1 bg-brand-primary rounded-full mt-0.5" />}
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 w-12 transition-all duration-300",
            activeTab === 'history' ? "text-brand-primary scale-110" : "text-slate-400 hover:text-slate-500"
          )}
        >
          <History className={cn("w-6 h-6", activeTab === 'history' ? "fill-brand-primary/10" : "")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">History</span>
          {activeTab === 'history' && <motion.div layoutId="tab-dot" className="w-1 h-1 bg-brand-primary rounded-full mt-0.5" />}
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 w-12 transition-all duration-300",
            activeTab === 'settings' ? "text-brand-primary scale-110" : "text-slate-400 hover:text-slate-500"
          )}
        >
          <Settings className={cn("w-6 h-6", activeTab === 'settings' ? "fill-brand-primary/10" : "")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
          {activeTab === 'settings' && <motion.div layoutId="tab-dot" className="w-1 h-1 bg-brand-primary rounded-full mt-0.5" />}
        </button>
      </nav>

      <AnimatePresence>
        {showApply && (
          <ApplyModal 
            limit={limit?.calculatedCreditScore || 0} 
            onClose={() => setShowApply(false)} 
            onSuccess={onApplySuccess}
          />
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
                <button onClick={() => setShowEditProfile(false)} className="text-slate-400 font-bold p-1">Close</button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">First Name</label>
                  <input 
                    type="text" 
                    value={editData.firstName} 
                    onChange={e => setEditData({...editData, firstName: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Last Name</label>
                  <input 
                    type="text" 
                    value={editData.lastName} 
                    onChange={e => setEditData({...editData, lastName: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <button 
                  onClick={handleUpdateProfile}
                  className="button-primary w-full py-4 text-base shadow-xl shadow-brand-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reference Contacts Modal */}
      <AnimatePresence>
        {showRefContacts && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <Contact className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reference Contacts</h3>
              </div>
              <p className="text-slate-500 text-sm">Manage your emergency / alternative contact for loan security.</p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Emergency Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="07XX XXX XXX"
                      value={editData.altPhone} 
                      onChange={e => setEditData({...editData, altPhone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 pl-11 p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowRefContacts(false)}
                    className="flex-1 p-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-1 button-primary"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repay Modal */}
      <AnimatePresence>
        {showRepayModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowRepayModal(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-brand-success/10 rounded-2xl flex items-center justify-center text-brand-success">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Repayment Instructions</h3>
                </div>
                <button 
                  onClick={() => setShowRepayModal(false)} 
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-brand-success/5 border border-brand-success/20 rounded-2xl p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Send Money To:</p>
                    <p className="text-lg font-bold text-slate-900">Paybill 197197</p>
                  </div>
                  
                  <div className="border-t border-brand-success/20 pt-3 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Name:</p>
                    <p className="text-lg font-bold text-slate-900">PAUL ANGIMA</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    💳 Use M-Pesa to send payment to the Paybill number above. Your account will be updated automatically within 1-2 minutes.
                  </p>
                </div>

                <button 
                  onClick={() => setShowRepayModal(false)}
                  className="button-primary w-full py-4 text-base shadow-xl shadow-brand-primary/20"
                >
                  Got It, Thanks
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApplyModal({ limit, onClose, onSuccess }: { limit: number, onClose: () => void, onSuccess: () => void }) {
  const [amount, setAmount] = useState(limit > 500 ? 500 : limit);
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState(false);

  const interest = amount * 0.16 * (30/365);
  const total = amount + interest;

  const handleApply = async () => {
    if (!auth.currentUser) return;
    setApplying(true);
    
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'applications'), {
        userId: auth.currentUser.uid,
        amountRequested: amount,
        amountApproved: amount,
        status: 'pending',
        interestRate: 0.16,
        durationDays: 30,
        totalRepayable: total,
        createdAt: serverTimestamp()
      });

      setApplying(false);
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      console.error("Error applying for loan:", err);
      setApplying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-white w-full max-w-md rounded-3xl p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Apply for Loan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {success ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-success/10 text-brand-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Application Successful!</h3>
              <p className="text-slate-500 text-sm">Disbursement is being processed via M-Pesa.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount to Borrow</label>
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-4xl font-bold text-brand-primary">KES {amount.toLocaleString()}</div>
                  <input 
                    type="range"
                    min={500}
                    max={limit}
                    step={100}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full mt-4 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                    <span>min KES 500</span>
                    <span>max KES {limit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Interest (16% P.A.)</span>
                  <span className="font-bold text-slate-900">KES {interest.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-bold text-slate-900">30 Days</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total Repayable</span>
                  <span className="text-lg font-bold text-brand-primary">KES {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <button 
              disabled={applying}
              onClick={handleApply}
              className="button-primary w-full py-4 flex items-center justify-center space-x-2"
            >
              {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Disburse to M-Pesa</span>}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
