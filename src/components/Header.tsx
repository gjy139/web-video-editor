import React from 'react'
import { 
  Film, 
  Sparkles, 
  Download, 
  Undo2, 
  Redo2, 
  Smartphone, 
  Monitor, 
  Square, 
  Tv 
} from 'lucide-react'
import type { AspectRatio } from '../types/editor'
import { ASPECT_RATIOS } from '../types/editor'

interface HeaderProps {
  projectTitle: string
  setProjectTitle: (title: string) => void
  aspectRatio: AspectRatio
  setAspectRatio: (ar: AspectRatio) => void
  onExportClick: () => void
  onLoadSampleProject: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  setProjectTitle,
  aspectRatio,
  setAspectRatio,
  onExportClick,
  onLoadSampleProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const getAspectIcon = (ar: AspectRatio) => {
    switch (ar) {
      case '16:9': return <Monitor className="w-4 h-4" />
      case '9:16': return <Smartphone className="w-4 h-4" />
      case '1:1': return <Square className="w-4 h-4" />
      case '4:3': return <Tv className="w-4 h-4" />
    }
  }

  return (
    <header className="h-14 border-b border-slate-800 bg-[#12141c] px-4 flex items-center justify-between select-none z-30">
      {/* Left: Brand & Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white">OpenCut</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                100% 무료 / 워터마크 無
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Project Title Input */}
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="bg-transparent hover:bg-slate-800/50 focus:bg-slate-800/80 px-2 py-1 rounded text-sm text-slate-200 border border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition w-44 font-medium"
          placeholder="프로젝트 제목"
        />

        {/* Undo / Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="실행 취소 (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="다시 실행 (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Aspect Ratio Switcher */}
      <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ar) => (
          <button
            key={ar}
            onClick={() => setAspectRatio(ar)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              aspectRatio === ar
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title={ASPECT_RATIOS[ar].description}
          >
            {getAspectIcon(ar)}
            <span>{ar}</span>
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onLoadSampleProject}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition shadow-sm hover:border-indigo-500/60"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>샘플 프로젝트 불러오기</span>
        </button>

        <button
          onClick={onExportClick}
          className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>내보내기 (Export)</span>
        </button>
      </div>
    </header>
  )
}
