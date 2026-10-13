import React, { useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Repeat
} from 'lucide-react'
import type { AspectRatio } from '../types/editor'
import { ASPECT_RATIOS } from '../types/editor'

interface PreviewPlayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  currentTime: number
  duration: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSeek: (time: number) => void
  aspectRatio: AspectRatio
  isLooping: boolean
  onToggleLoop: () => void
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  canvasRef,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  aspectRatio,
  isLooping,
  onToggleLoop
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const config = ASPECT_RATIOS[aspectRatio]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  const handleStepFrame = (deltaFrames: number) => {
    const fps = 30
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaFrames / fps))
    onSeek(newTime)
  }

  const handleJump = (deltaSec: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaSec))
    onSeek(newTime)
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b0c10] border-r border-slate-800 overflow-hidden relative">
      {/* Top indicator bar */}
      <div className="h-9 px-4 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 bg-[#0e1017]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">실시간 캔버스 프리뷰</span>
          <span className="text-slate-600">|</span>
          <span>{config.width} × {config.height}</span>
          <span className="text-slate-600">|</span>
          <span>30 FPS</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleLoop}
            className={`p-1 rounded transition ${isLooping ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            title="반복 재생 (Loop)"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
            title="전체 화면"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative bg-radial from-slate-900/40 to-[#08090d]"
      >
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 bg-black flex items-center justify-center transition-all"
          style={{
            aspectRatio: `${config.width} / ${config.height}`,
            maxHeight: '100%',
            maxWidth: '100%',
            height: aspectRatio === '9:16' ? '100%' : 'auto',
            width: aspectRatio === '16:9' ? '100%' : 'auto'
          }}
        >
          <canvas
            ref={canvasRef}
            width={config.width}
            height={config.height}
            className="w-full h-full object-contain block"
          />
        </div>
      </div>

      {/* Transport Controller Bar */}
      <div className="h-12 border-t border-slate-800/80 bg-[#12141c] px-4 flex items-center justify-between select-none">
        {/* Left: Timecode */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-indigo-400 font-semibold text-sm">
            {formatTime(currentTime)}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center space-x-2">
          {/* -5s */}
          <button
            onClick={() => handleJump(-5)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="5초 뒤로"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* -1 frame */}
          <button
            onClick={() => handleStepFrame(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="이전 프레임 (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause button */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            title="재생 / 일시정지 (Space)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* +1 frame */}
          <button
            onClick={() => handleStepFrame(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="다음 프레임 (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* +5s */}
          <button
            onClick={() => handleJump(5)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="5초 앞으로"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right shortcut guide */}
        <div className="text-[11px] text-slate-500 hidden sm:block">
          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono text-slate-400">Space</span> 재생/정지
          <span className="mx-1.5 text-slate-700">•</span>
          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono text-slate-400">S</span> 클립 분할
        </div>
      </div>
    </div>
  )
}
