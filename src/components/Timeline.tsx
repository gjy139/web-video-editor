import React, { useRef, useState } from 'react'
import {
  Scissors,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Magnet,
  Type,
  Video,
  Music,
  Wand2
} from 'lucide-react'
import type { TimelineClip, TimelineTrack } from '../types/editor'

interface TimelineProps {
  tracks: TimelineTrack[]
  clips: TimelineClip[]
  currentTime: number
  totalDuration: number
  selectedClipId: string | null
  onSelectClip: (id: string | null) => void
  onSeek: (time: number) => void
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  onDeleteClip: (clipId: string) => void
  onSplitClip: () => void
  onDuplicateClip: (clipId: string) => void
  onDurationChange: (duration: number) => void
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  clips,
  currentTime,
  totalDuration,
  selectedClipId,
  onSelectClip,
  onSeek,
  onUpdateClip,
  onDeleteClip,
  onSplitClip,
  onDuplicateClip,
  onDurationChange: _onDurationChange
}) => {
  const [zoom, setZoom] = useState(50)
  const [snapping, setSnapping] = useState(true)
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const isDraggingPlayhead = useRef(false)

  const dragAction = useRef<{
    type: 'move' | 'trim-left' | 'trim-right'
    clipId: string
    startX: number
    origStartTime: number
    origDuration: number
    origTrimStart: number
    sourceDuration: number
  } | null>(null)

  const timelineWidth = Math.max(1200, totalDuration * zoom + 300)

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = Math.floor(sec % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (dragAction.current) return
    if (!timelineContentRef.current) return

    const rect = timelineContentRef.current.getBoundingClientRect()
    const scrollLeft = timelineContentRef.current.scrollLeft
    const clickX = e.clientX - rect.left + scrollLeft
    const newTime = Math.max(0, Math.min(totalDuration, clickX / zoom))

    onSeek(newTime)
    isDraggingPlayhead.current = true

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingPlayhead.current || !timelineContentRef.current) return
      const curRect = timelineContentRef.current.getBoundingClientRect()
      const curX = moveEvent.clientX - curRect.left + timelineContentRef.current.scrollLeft
      const t = Math.max(0, Math.min(totalDuration, curX / zoom))
      onSeek(t)
    }

    const handleMouseUp = () => {
      isDraggingPlayhead.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const startClipDrag = (
    e: React.MouseEvent,
    clip: TimelineClip,
    type: 'move' | 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation()
    onSelectClip(clip.id)

    dragAction.current = {
      type,
      clipId: clip.id,
      startX: e.clientX,
      origStartTime: clip.startTime,
      origDuration: clip.duration,
      origTrimStart: clip.trimStart,
      sourceDuration: clip.sourceDuration || 60
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragAction.current) return
      const deltaX = moveEvent.clientX - dragAction.current.startX
      const deltaSec = deltaX / zoom

      const { type, clipId, origStartTime, origDuration, origTrimStart, sourceDuration } = dragAction.current

      if (type === 'move') {
        let newStartTime = Math.max(0, origStartTime + deltaSec)
        if (snapping && Math.abs(newStartTime - currentTime) < 0.2) {
          newStartTime = currentTime
        }
        onUpdateClip(clipId, { startTime: newStartTime })
      } else if (type === 'trim-right') {
        const maxDuration = Math.max(0.2, sourceDuration - origTrimStart)
        const newDuration = Math.max(0.3, Math.min(maxDuration, origDuration + deltaSec))
        onUpdateClip(clipId, { duration: newDuration })
      } else if (type === 'trim-left') {
        const shift = Math.max(-origStartTime, Math.min(origDuration - 0.3, deltaSec))
        const newStartTime = Math.max(0, origStartTime + shift)
        const newDuration = Math.max(0.3, origDuration - shift)
        const newTrimStart = Math.max(0, origTrimStart + shift)

        onUpdateClip(clipId, {
          startTime: newStartTime,
          duration: newDuration,
          trimStart: newTrimStart
        })
      }
    }

    const handleMouseUp = () => {
      dragAction.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const tickInterval = zoom >= 80 ? 1 : zoom >= 40 ? 2 : 5
  const ticksCount = Math.ceil(totalDuration / tickInterval) + 1

  return (
    <div className="h-68 bg-[#11131a] border-t border-slate-800 flex flex-col select-none z-10">
      {/* Top Toolbar */}
      <div className="h-10 px-4 border-b border-slate-800/80 bg-[#141722] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onSplitClip}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition"
            title="현재 위치에서 클립 자르기 (S)"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>자르기 (Split)</span>
          </button>

          <button
            disabled={!selectedClipId}
            onClick={() => selectedClipId && onDeleteClip(selectedClipId)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 text-xs font-semibold disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition"
            title="선택된 클립 삭제 (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제</span>
          </button>

          <button
            disabled={!selectedClipId}
            onClick={() => selectedClipId && onDuplicateClip(selectedClipId)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold disabled:opacity-40 transition"
            title="선택된 클립 복제"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>복제</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setSnapping(!snapping)}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition ${
              snapping
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="자석 스냅 (Snapping)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>스냅 {snapping ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="range"
            min="20"
            max="120"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title="타임라인 확대/축소"
          />
          <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-mono text-slate-500 w-8 text-right">
            {zoom}px
          </span>
        </div>
      </div>

      {/* Tracks & Ruler */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-32 flex-shrink-0 bg-[#0f1118] border-r border-slate-800 flex flex-col pt-7">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-13 border-b border-slate-800/80 px-2.5 flex items-center justify-between text-xs text-slate-400"
            >
              <div className="flex items-center space-x-1.5 truncate">
                {track.type === 'text' && <Type className="w-3.5 h-3.5 text-purple-400" />}
                {track.id === 'track-overlay' && <Wand2 className="w-3.5 h-3.5 text-pink-400" />}
                {track.id === 'track-video' && <Video className="w-3.5 h-3.5 text-indigo-400" />}
                {track.type === 'audio' && <Music className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="font-medium text-slate-300 truncate">{track.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Tracks & Ruler Area */}
        <div
          ref={timelineContentRef}
          onMouseDown={handleTimelineMouseDown}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#0b0c10] cursor-pointer"
        >
          <div
            className="relative h-full"
            style={{ width: `${timelineWidth}px` }}
          >
            {/* Timeline Ruler */}
            <div className="h-7 border-b border-slate-800 bg-[#12141c] flex items-center relative select-none">
              {Array.from({ length: ticksCount }).map((_, i) => {
                const sec = i * tickInterval
                const left = sec * zoom
                return (
                  <div
                    key={i}
                    className="absolute bottom-0 flex flex-col items-center pointer-events-none"
                    style={{ left: `${left}px` }}
                  >
                    <span className="text-[10px] font-mono text-slate-500 transform -translate-x-1/2 -top-1 relative">
                      {formatSeconds(sec)}
                    </span>
                    <div className="w-px h-2 bg-slate-700 mt-0.5" />
                  </div>
                )
              })}
            </div>

            {/* Track Lanes */}
            <div className="flex flex-col">
              {tracks.map((track) => {
                const trackClips = clips.filter((c) => c.trackId === track.id)

                return (
                  <div
                    key={track.id}
                    className="h-13 border-b border-slate-800/60 relative bg-slate-900/10 hover:bg-slate-900/30 transition-colors"
                  >
                    {trackClips.map((clip) => {
                      const isSelected = selectedClipId === clip.id
                      const left = clip.startTime * zoom
                      const width = Math.max(16, clip.duration * zoom)

                      let bgClass = 'bg-indigo-600/80 hover:bg-indigo-600 border-indigo-400/50'
                      if (clip.type === 'image') {
                        bgClass = 'bg-gradient-to-r from-amber-600/90 to-rose-600/90 hover:from-amber-500 hover:to-rose-500 border-amber-400/50'
                      } else if (clip.trackId === 'track-overlay') {
                        bgClass = 'bg-gradient-to-r from-pink-600/90 to-purple-600/90 hover:from-pink-500 hover:to-purple-500 border-pink-400/50'
                      } else if (clip.type === 'text') {
                        bgClass = 'bg-purple-600/80 hover:bg-purple-600 border-purple-400/50'
                      } else if (clip.type === 'audio') {
                        bgClass = 'bg-emerald-600/80 hover:bg-emerald-600 border-emerald-400/50'
                      }

                      return (
                        <div
                          key={clip.id}
                          onMouseDown={(e) => startClipDrag(e, clip, 'move')}
                          className={`absolute top-1 h-11 rounded-md border text-white text-xs px-2 flex items-center justify-between shadow-md transition-shadow group cursor-grab active:cursor-grabbing ${bgClass} ${
                            isSelected
                              ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900 z-10'
                              : 'z-0'
                          }`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`
                          }}
                        >
                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={(e) => startClipDrag(e, clip, 'trim-left')}
                            className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            title="시작 부분 자르기"
                          >
                            <div className="w-0.5 h-4 bg-white/70 rounded" />
                          </div>

                          {/* Clip Label */}
                          <div className="truncate flex items-center space-x-1.5 min-w-0 pr-1 pl-1">
                            {clip.type === 'image' && (
                              <span className="px-1 py-0.2 bg-amber-400 text-slate-950 font-bold rounded text-[9px] flex-shrink-0">
                                사진
                              </span>
                            )}
                            {clip.chromaKey?.enabled && (
                              <span className="px-1 py-0.2 bg-emerald-500 text-slate-950 font-bold rounded text-[9px] flex-shrink-0">
                                크로마키
                              </span>
                            )}
                            {clip.vfxEffect && clip.vfxEffect !== 'none' && (
                              <span className="px-1 py-0.2 bg-indigo-400 text-slate-950 font-bold rounded text-[9px] flex-shrink-0">
                                VFX
                              </span>
                            )}
                            {clip.type === 'text' ? (
                              <span className="font-semibold truncate">
                                💬 {clip.textProps?.text || clip.name}
                              </span>
                            ) : (
                              <span className="font-medium truncate">{clip.name}</span>
                            )}
                            <span className="text-[10px] opacity-75 font-mono">
                              ({clip.duration.toFixed(1)}s)
                            </span>
                          </div>

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={(e) => startClipDrag(e, clip, 'trim-right')}
                            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            title="끝 부분 자르기"
                          >
                            <div className="w-0.5 h-4 bg-white/70 rounded" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 w-px bg-rose-500 pointer-events-none z-30 flex flex-col items-center"
              style={{
                left: `${currentTime * zoom}px`,
                height: `${28 + tracks.length * 52}px`
              }}
            >
              <div className="w-3.5 h-4 bg-rose-500 rounded-b-sm shadow-md shadow-rose-500/50 -mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
