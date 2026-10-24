import React from "react";
import { X, FolderOpen, Calendar, MapPin, Trash2, ArrowUpRight } from "lucide-react";

interface SavedStudyItem {
  id: string;
  title: string;
  city: string;
  junctionName: string;
  createdAt: string;
  totalReIdentified?: number;
  odMatrixSummary?: string;
}

interface SavedStudiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studies: SavedStudyItem[];
  onLoadStudy: (study: SavedStudyItem) => void;
  onDeleteStudy: (id: string) => void;
  isLoading: boolean;
}

export const SavedStudiesModal: React.FC<SavedStudiesModalProps> = ({
  isOpen,
  onClose,
  studies,
  onLoadStudy,
  onDeleteStudy,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Saved Traffic Studies</h2>
              <p className="text-xs text-slate-400">
                Firestore persistent records of multi-camera vehicle Re-ID runs and OD flows
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

        {/* List Content */}
        <div className="p-6 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading saved studies from Firestore...</div>
          ) : studies.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No studies saved yet. Run the simulation and click "Save Study" in the top bar to record your first study to Firestore!
            </div>
          ) : (
            studies.map((s) => (
              <div
                key={s.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {s.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {s.city || "Urban Corridor"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  {s.odMatrixSummary && (
                    <div className="text-[11px] font-mono text-cyan-300">{s.odMatrixSummary}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadStudy(s)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Load</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteStudy(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Delete Study"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
