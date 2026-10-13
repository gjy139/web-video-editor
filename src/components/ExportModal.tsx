import React, { useEffect } from 'react'
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film
} from 'lucide-react'
import confetti from 'canvas-confetti'
import type { ExportProgress } from '../services/exporter'
import type { AspectRatio } from '../types/editor'
import { ASPECT_RATIOS } from '../types/editor'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onStartExport: () => void
  isExporting: boolean
  progress: ExportProgress | null
  aspectRatio: AspectRatio
  projectTitle: string
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onStartExport,
  isExporting,
  progress,
  aspectRatio,
  projectTitle
}) => {
  const config = ASPECT_RATIOS[aspectRatio]

  useEffect(() => {
    if (progress?.status === 'completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [progress?.status])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161822] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#12141d]">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              비디오 내보내기 (Export)
            </h3>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {!isExporting && !progress?.downloadUrl ? (
            <div className="space-y-4">
              {/* Export details */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">파일명</span>
                  <span className="font-semibold text-slate-200">{projectTitle || '무제_비디오'}.webm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">해상도</span>
                  <span className="font-mono text-indigo-400 font-semibold">
                    {config.width} × {config.height} ({aspectRatio})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">프레임레이트</span>
                  <span className="font-mono text-slate-300">30 FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">워터마크</span>
                  <span className="text-emerald-400 font-semibold">없음 (100% 무료)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">인코딩 방식</span>
                  <span className="text-slate-300">브라우저 내장 WebM/VP9</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-2.5">
                💡 영상은 서버로 전송되지 않고 사용자의 컴퓨터 브라우저에서 안전하게 직접 렌더링됩니다.
              </div>

              <button
                onClick={onStartExport}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/30 transition transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>렌더링 및 내보내기 시작</span>
              </button>
            </div>
          ) : isExporting ? (
            /* Exporting progress view */
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">
                  동영상을 렌더링하고 있습니다...
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {progress?.percent || 0}% 완료 (
                  {progress?.currentTime?.toFixed(1) || 0}s / {progress?.totalDuration?.toFixed(1) || 0}s)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2.5 rounded-full transition-all duration-150"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                렌더링 중에는 탭을 닫지 마세요.
              </p>
            </div>
          ) : progress?.status === 'completed' && progress.downloadUrl ? (
            /* Completed view */
            <div className="py-4 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">
                  렌더링이 완료되었습니다! 🎉
                </h4>
                <p className="text-xs text-slate-400">
                  완성된 고화질 비디오를 컴퓨터에 저장하세요.
                </p>
              </div>

              <a
                href={progress.downloadUrl}
                download={`${projectTitle || 'opencut_video'}.webm`}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>비디오 파일 다운로드 (.webm)</span>
              </a>

              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                닫기
              </button>
            </div>
          ) : (
            /* Error view */
            <div className="py-4 flex flex-col items-center justify-center space-y-3 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">
                  내보내기 중 문제가 발생했습니다
                </h4>
                <p className="text-xs text-rose-400">
                  {progress?.errorMsg || '알 수 없는 오류'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
