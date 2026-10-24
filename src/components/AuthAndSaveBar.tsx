import React, { useState } from "react";
import {
  User,
  LogIn,
  LogOut,
  Save,
  FolderOpen,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  Radio,
  Moon,
  Sun,
  ShieldAlert,
  Cpu,
  Video,
  Layers,
  BarChart3,
  Sliders,
  Wrench,
  Activity,
} from "lucide-react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  config,
  AppUser,
} from "../lib/firebase";

export type AppViewMode = "corridor" | "phase2" | "od_matrix" | "disambiguation" | "models";

interface AuthAndSaveBarProps {
  user: AppUser | null;
  onUserChange: (user: AppUser | null) => void;
  onSaveStudy: () => void;
  onLoadSavedStudies: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  currentViewMode?: AppViewMode;
  onSelectViewMode?: (mode: AppViewMode) => void;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  hasActiveOutage?: boolean;
  onToggleOutage?: () => void;
  isCpuMode?: boolean;
  onToggleCpuMode?: () => void;
}

export const AuthAndSaveBar: React.FC<AuthAndSaveBarProps> = ({
  user,
  onUserChange,
  onSaveStudy,
  onLoadSavedStudies,
  isSaving,
  saveSuccess,
  currentViewMode = "corridor",
  onSelectViewMode,
  isNightMode = false,
  onToggleNightMode,
  hasActiveOutage = false,
  onToggleOutage,
  isCpuMode = false,
  onToggleCpuMode,
}) => {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDomainNotice, setShowDomainNotice] = useState(false);
  const [copiedHostname, setCopiedHostname] = useState(false);

  const currentHostname =
    typeof window !== "undefined" ? window.location.hostname : "ais-dev.run.app";
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${config.projectId}/authentication/settings`;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onUserChange({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          isDemo: false,
        });
      }
      setIsSignInModalOpen(false);
      setShowDomainNotice(false);
    } catch (err: any) {
      console.warn("Sign-in error intercepted:", err);
      if (
        err?.code === "auth/unauthorized-domain" ||
        err?.message?.includes("unauthorized-domain")
      ) {
        setShowDomainNotice(true);
        setAuthError(
          `Domain "${currentHostname}" is not yet in Firebase Console's authorized domains list.`
        );
      } else {
        setAuthError(err.message || "Failed to sign in via Google.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoOperatorSignIn = () => {
    const demoUser: AppUser = {
      uid: "operator_adit_jain",
      email: "jainadit04@gmail.com",
      displayName: "Adit Jain",
      photoURL: null,
      isDemo: true,
    };
    try {
      localStorage.setItem("netraflow_operator_session", JSON.stringify(demoUser));
    } catch {}
    onUserChange(demoUser);
    setIsSignInModalOpen(false);
    setShowDomainNotice(false);
    setAuthError(null);
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("netraflow_operator_session");
      if (!user?.isDemo) {
        await signOut(auth);
      }
      onUserChange(null);
    } catch (err: any) {
      console.error("Sign-out error:", err);
      onUserChange(null);
    }
  };

  const handleCopyHostname = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedHostname(true);
      setTimeout(() => setCopiedHostname(false), 2500);
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "min(1360px, 98vw)",
          zIndex: 40,
        }}
        className="w-full flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl px-3.5 py-2 text-slate-200 select-none backdrop-blur-md"
      >
        {/* Brand & Mission Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-950/50">
            NF
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight">NetraFlow</h1>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Phase 1 + 2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xl:block">
              Multi-Camera Vehicle Re-ID • Non-Plate Dense Traffic
            </p>
          </div>
        </div>

        {/* Center Primary View Switcher */}
        {onSelectViewMode && (
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => onSelectViewMode("corridor")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentViewMode === "corridor"
                  ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>3D Twin & CCTV</span>
            </button>

            <button
              onClick={() => onSelectViewMode("phase2")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentViewMode === "phase2"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 2 Compliance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => onSelectViewMode("od_matrix")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentViewMode === "od_matrix"
                  ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>OD Matrix</span>
            </button>

            <button
              onClick={() => onSelectViewMode("disambiguation")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentViewMode === "disambiguation"
                  ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Disambiguation Lab</span>
            </button>

            <button
              onClick={() => onSelectViewMode("models")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentViewMode === "models"
                  ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Models</span>
            </button>
          </div>
        )}

        {/* Persistence, Mode Quick Toggles & User Session */}
        <div className="flex items-center gap-2">
          {/* Quick Night Toggle */}
          {onToggleNightMode && (
            <button
              onClick={onToggleNightMode}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isNightMode
                  ? "bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm shadow-indigo-900/50"
                  : "bg-slate-900 text-amber-300 border border-slate-800 hover:border-amber-500/50"
              }`}
              title="Toggle Night Mode (IDF1: 83.8% with RetinexNet)"
            >
              {isNightMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Night (IDF1 83.8%)</span>
                  <span className="sm:hidden">Night</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Day (IDF1 89.2%)</span>
                  <span className="sm:hidden">Day</span>
                </>
              )}
            </button>
          )}

          {/* Quick CPU / GPU Low-Power Toggle */}
          {onToggleCpuMode && (
            <button
              onClick={onToggleCpuMode}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCpuMode
                  ? "bg-amber-950 text-amber-300 border border-amber-600 shadow-sm shadow-amber-900/50"
                  : "bg-slate-900 text-cyan-300 border border-slate-800 hover:border-cyan-500/50"
              }`}
              title="Toggle Low-Power CPU Mode (YOLO26n / yolo26n.pt)"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isCpuMode ? "YOLO26n CPU" : "YOLO26s GPU"}</span>
            </button>
          )}

          {/* Save Study */}
          <button
            onClick={onSaveStudy}
            disabled={isSaving}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              saveSuccess
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50"
            }`}
            title="Save Current Corridor & OD Flow Study to Firestore"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </>
            )}
          </button>

          {/* Load Saved Studies */}
          <button
            onClick={onLoadSavedStudies}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Load Previous Studies from Firestore"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studies</span>
          </button>

          {/* Authentication Badge / Trigger */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-6 h-6 rounded-full border border-cyan-500/50"
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border ${
                    user.isDemo
                      ? "bg-amber-600/30 border-amber-500/60 text-amber-300"
                      : "bg-cyan-600/30 border-cyan-500/60 text-cyan-300"
                  }`}
                  title={user.isDemo ? "ITS Controller Mode" : "Authenticated User"}
                >
                  {user.isDemo ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-cyan-600/20"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Sign-In Dialog Modal */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">NetraFlow Access Portal</h3>
                  <p className="text-[11px] text-slate-400">Authenticate for persistent studies & cloud sync</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSignInModalOpen(false);
                  setShowDomainNotice(false);
                  setAuthError(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {authError && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{authError}</p>
                    <p className="text-[11px] text-amber-300/80">
                      You can instantly proceed using the <strong>Lead Traffic Operator</strong> option below
                      without needing domain allowlisting.
                    </p>
                  </div>
                </div>
              )}

              {/* Fast Option: Demo Operator Access */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Instant Access (Recommended)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    One-Click
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Log in as <strong>Adit Jain (Lead ITS Operator)</strong> to access all multi-camera Re-ID
                  diagnostics, Bayesian outage imputation, and save persistent OD flow studies immediately.
                </p>
                <button
                  onClick={handleDemoOperatorSignIn}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-200" />
                  <span>Continue as Adit Jain (Lead ITS Controller)</span>
                </button>
              </div>

              {/* Option 2: Google Sign In */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Firebase Google Auth</span>
                  <span className="text-[10px] font-mono text-slate-400">OAuth 2.0</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Direct Firebase OAuth popup. Requires this preview domain to be listed in Firebase Console
                  Authorized Domains.
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>{isSigningIn ? "Signing in..." : "Sign in with Google"}</span>
                </button>
              </div>

              {/* Domain Notice Guide if popup triggered unauthorized-domain */}
              {showDomainNotice && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300">How to authorize this domain:</span>
                    <button
                      onClick={handleCopyHostname}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedHostname ? "Copied!" : "Copy Domain"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 break-all">
                    {currentHostname}
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                    <li>Open Firebase Console Settings for project <code className="text-cyan-400">{config.projectId}</code></li>
                    <li>Under "Authorized domains", click "Add domain" and paste the copied hostname</li>
                  </ol>
                  <a
                    href={firebaseSettingsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>Open Firebase Console Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
