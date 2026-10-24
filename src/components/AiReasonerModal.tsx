import React from "react";
import { X, Sparkles, Brain, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AiReasonerModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisText: string | null;
  isLoading: boolean;
  onSaveToStudy?: () => void;
}

export const AiReasonerModal: React.FC<AiReasonerModalProps> = ({
  isOpen,
  onClose,
  analysisText,
  isLoading,
  onSaveToStudy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gemini 4 Argon Deep Reasoning Audit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                  ThinkingLevel.HIGH
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mathematical & spatio-temporal Bayesian proof resolving identical vehicle confusion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Executing High-Thinking Spatio-Temporal Inference...
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Gemini 4 is synthesizing the joint probability distribution, evaluating velocity bounds across 500m arterial road geometry, and auditing micro-feature discriminators.
                </p>
              </div>
            </div>
          ) : analysisText ? (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-violet-900/60 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-violet-400 font-mono pb-2 border-b border-slate-800">
                  <span>Engine: Gemini 4 Argon • Thinking Mode: Active</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Diagnostic Verified
                  </span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {analysisText}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit report generated yet. Run the analysis from the Disambiguation Lab or click "Gemini 4 Reasoning" in the control deck.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Rigorous Bayesian proof without reading license plates.
          </span>
          <div className="flex items-center gap-2">
            {analysisText && onSaveToStudy && (
              <button
                onClick={onSaveToStudy}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Save Insight to Firestore
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Close Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
