import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { PreviewPlayer } from './components/PreviewPlayer'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { Inspector } from './components/Inspector'
import { ExportModal } from './components/ExportModal'
import type { 
  AspectRatio, 
  TimelineClip, 
  TimelineTrack, 
  MediaItem 
} from './types/editor'
import { VideoRenderer } from './services/videoRenderer'
import { exportVideo } from './services/exporter'
import type { ExportProgress } from './services/exporter'
import { generateDemoVideo, generateDemoAudio } from './utils/sampleGenerator'

const DEFAULT_TRACKS: TimelineTrack[] = [
  { id: 'track-text', name: '자막 / 텍스트', type: 'text', color: '#a855f7' },
  { id: 'track-overlay', name: '🛸 CG / 오버레이', type: 'video', color: '#ec4899' },
  { id: 'track-video', name: '🎬 메인 비디오', type: 'video', color: '#6366f1' },
  { id: 'track-audio', name: '🎵 오디오 / BGM', type: 'audio', color: '#10b981' }
]

export const App: React.FC = () => {
  // Project State
  const [projectTitle, setProjectTitle] = useState('CG 비디오 프로젝트')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [duration, setDuration] = useState<number>(12)
  const [tracks] = useState<TimelineTrack[]>(DEFAULT_TRACKS)
  const [clips, setClips] = useState<TimelineClip[]>([])
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)

  // Playback State
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isLooping, setIsLooping] = useState<boolean>(false)

  // History for Undo / Redo
  const [history, setHistory] = useState<TimelineClip[][]>([])
  const [future, setFuture] = useState<TimelineClip[][]>([])

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)

  // Canvas & Renderer
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<VideoRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  // Save history state before changes
  const pushHistory = useCallback((newClips: TimelineClip[]) => {
    setHistory((prev) => [...prev.slice(-20), clips])
    setFuture([])
    setClips(newClips)
  }, [clips])

  // Initialize Renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new VideoRenderer(canvasRef.current)
      rendererRef.current.setAspectRatio(aspectRatio)
    }
  }, [])

  // Update Aspect Ratio in renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setAspectRatio(aspectRatio)
      rendererRef.current.render(clips, currentTime)
    }
  }, [aspectRatio, clips, currentTime])

  // Playback & Animation Loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      if (isPlaying) {
        setCurrentTime((prev) => {
          let nextTime = prev + delta
          if (nextTime >= duration) {
            if (isLooping) {
              nextTime = 0
            } else {
              setIsPlaying(false)
              nextTime = duration
            }
          }
          return nextTime
        })
      }

      animationFrameRef.current = requestAnimationFrame(loop)
    }

    animationFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, duration, isLooping])

  // Synchronize and Render Canvas on currentTime or clips change
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.syncPlayback(clips, currentTime, isPlaying)
      rendererRef.current.render(clips, currentTime)
    }
  }, [currentTime, clips, isPlaying])

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (currentTime >= duration) {
      setCurrentTime(0)
    }
    setIsPlaying(!isPlaying)
  }

  // Seek Playhead
  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  // Add Media Item to Library
  const handleAddMedia = (media: MediaItem) => {
    setMediaLibrary((prev) => [media, ...prev])
  }

  // Delete Media Item from Library
  const handleDeleteMedia = (id: string) => {
    setMediaLibrary((prev) => prev.filter((m) => m.id !== id))
  }

  // Add Clip to Timeline
  const handleAddClipToTimeline = (type: 'video' | 'text' | 'audio' | 'image', options?: any) => {
    let newClip: TimelineClip

    if ((type === 'video' || type === 'image') && options?.media) {
      const media = options.media as MediaItem
      const isImg = media.type === 'image' || type === 'image'
      const targetTrackId = isImg ? 'track-overlay' : (media.isGreenScreen ? 'track-overlay' : 'track-video')

      newClip = {
        id: `clip-${isImg ? 'image' : 'video'}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        trackId: targetTrackId,
        type: isImg ? 'image' : 'video',
        name: isImg ? `🖼️ ${media.name}` : media.name,
        startTime: currentTime,
        duration: isImg ? 4 : Math.min(media.duration, 5),
        trimStart: 0,
        sourceDuration: isImg ? 60 : media.duration,
        mediaId: media.id,
        sourceUrl: media.url,
        filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 },
        playbackRate: 1,
        volume: 1,
        opacity: 1,
        chromaKey: media.isGreenScreen ? {
          enabled: true,
          color: '#00ff00',
          similarity: 45,
          smoothness: 15
        } : undefined,
        motion: 'none',
        vfxEffect: 'none',
        transform: { x: 0, y: 0, scale: isImg ? 0.7 : 1, rotation: 0 }
      }
    } else if (type === 'audio' && options?.media) {
      const media = options.media as MediaItem
      newClip = {
        id: `clip-audio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        trackId: 'track-audio',
        type: 'audio',
        name: media.name,
        startTime: currentTime,
        duration: media.duration,
        trimStart: 0,
        sourceDuration: media.duration,
        mediaId: media.id,
        sourceUrl: media.url,
        volume: 0.8
      }
    } else {
      // Text Clip
      newClip = {
        id: `clip-text-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        trackId: 'track-text',
        type: 'text',
        name: options?.text || '새 자막',
        startTime: currentTime,
        duration: 3,
        trimStart: 0,
        sourceDuration: 3,
        textProps: {
          text: options?.text || '자막 내용을 입력하세요',
          fontFamily: 'Pretendard, sans-serif',
          fontSize: 48,
          color: options?.preset === 'youtube' ? '#facc15' : '#ffffff',
          textAlign: 'center',
          stylePreset: options?.preset || 'youtube',
          posX: 50,
          posY: 80
        }
      }
    }

    const clipEnd = newClip.startTime + newClip.duration
    if (clipEnd > duration) {
      setDuration(Math.ceil(clipEnd + 2))
    }

    pushHistory([...clips, newClip])
    setSelectedClipId(newClip.id)
  }

  // Update Clip
  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    const updated = clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
    setClips(updated)
  }

  // Delete Clip
  const handleDeleteClip = (clipId: string) => {
    pushHistory(clips.filter((c) => c.id !== clipId))
    if (selectedClipId === clipId) {
      setSelectedClipId(null)
    }
  }

  // Split Clip at Playhead (S)
  const handleSplitClip = () => {
    let target = clips.find(
      (c) => c.id === selectedClipId && currentTime > c.startTime + 0.1 && currentTime < c.startTime + c.duration - 0.1
    )
    if (!target) {
      target = clips.find(
        (c) => currentTime > c.startTime + 0.1 && currentTime < c.startTime + c.duration - 0.1
      )
    }

    if (!target) return

    const splitOffset = currentTime - target.startTime
    const firstDuration = splitOffset
    const secondDuration = target.duration - splitOffset

    const firstClip: TimelineClip = {
      ...target,
      duration: firstDuration
    }

    const secondClip: TimelineClip = {
      ...target,
      id: `${target.type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${target.name} (파트 2)`,
      startTime: currentTime,
      duration: secondDuration,
      trimStart: target.trimStart + splitOffset * (target.playbackRate || 1)
    }

    const newClips = clips.map((c) => (c.id === target!.id ? firstClip : c)).concat(secondClip)
    pushHistory(newClips)
    setSelectedClipId(secondClip.id)
  }

  // Duplicate Clip
  const handleDuplicateClip = (clipId: string) => {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip) return

    const dupClip: TimelineClip = {
      ...clip,
      id: `${clip.type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${clip.name} (복사본)`,
      startTime: clip.startTime + clip.duration
    }

    const clipEnd = dupClip.startTime + dupClip.duration
    if (clipEnd > duration) {
      setDuration(Math.ceil(clipEnd + 2))
    }

    pushHistory([...clips, dupClip])
    setSelectedClipId(dupClip.id)
  }

  // Undo / Redo
  const handleUndo = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setFuture((f) => [clips, ...f])
    setHistory((h) => h.slice(0, -1))
    setClips(prev)
  }

  const handleRedo = () => {
    if (future.length === 0) return
    const next = future[0]
    setHistory((h) => [...h, clips])
    setFuture((f) => f.slice(1))
    setClips(next)
  }

  // Load Sample Project with full CG & VFX compositing demonstration!
  const handleLoadSampleProject = async () => {
    try {
      const sampleBg = await generateDemoVideo('synthwave', 6)
      const sampleGreen = await generateDemoVideo('greenscreen', 5)
      const sampleCountdown = await generateDemoVideo('countdown', 4)
      const sampleBgm = await generateDemoAudio(10)

      setMediaLibrary([sampleBg, sampleGreen, sampleCountdown, sampleBgm])

      const sampleClips: TimelineClip[] = [
        // 1. Main Background Video (Track 3)
        {
          id: `clip-video-bg`,
          trackId: 'track-video',
          type: 'video',
          name: sampleBg.name,
          startTime: 0,
          duration: 6,
          trimStart: 0,
          sourceDuration: 6,
          sourceUrl: sampleBg.url,
          filters: { brightness: 100, contrast: 105, saturation: 110, grayscale: 0, sepia: 0, blur: 0 },
          playbackRate: 1,
          volume: 1,
          opacity: 1
        },
        // 2. Main Background Video Part 2 (Countdown)
        {
          id: `clip-video-countdown`,
          trackId: 'track-video',
          type: 'video',
          name: sampleCountdown.name,
          startTime: 6,
          duration: 4,
          trimStart: 0,
          sourceDuration: 4,
          sourceUrl: sampleCountdown.url,
          filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 },
          playbackRate: 1,
          volume: 1,
          opacity: 1
        },
        // 3. CG Overlay Layer (Green Screen removal + Float Motion + Fire Sparks!)
        {
          id: `clip-overlay-cg`,
          trackId: 'track-overlay',
          type: 'video',
          name: '🛸 3D 사이버 오브젝트 (크로마키)',
          startTime: 0.5,
          duration: 5,
          trimStart: 0,
          sourceDuration: 5,
          sourceUrl: sampleGreen.url,
          chromaKey: {
            enabled: true,
            color: '#00ff00',
            similarity: 45,
            smoothness: 15
          },
          motion: 'float',
          vfxEffect: 'sparks',
          transform: { x: 0, y: -5, scale: 0.85, rotation: 0 },
          playbackRate: 1,
          volume: 0,
          opacity: 1
        },
        // 4. Subtitle 1
        {
          id: `clip-text-1`,
          trackId: 'track-text',
          type: 'text',
          name: 'CG 타이틀',
          startTime: 0.5,
          duration: 4.5,
          trimStart: 0,
          sourceDuration: 4.5,
          textProps: {
            text: '🛸 브라우저 실시간 크로마키 & CG VFX',
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 46,
            color: '#facc15',
            textAlign: 'center',
            stylePreset: 'youtube',
            posX: 50,
            posY: 82
          }
        },
        // 5. Subtitle 2
        {
          id: `clip-text-2`,
          trackId: 'track-text',
          type: 'text',
          name: '안내 자막',
          startTime: 6,
          duration: 3.5,
          trimStart: 0,
          sourceDuration: 3.5,
          textProps: {
            text: '✨ 불꽃 파티클 • 글리치 • 카메라 쉐이크 지원',
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 42,
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            textAlign: 'center',
            stylePreset: 'box',
            posX: 50,
            posY: 82
          }
        },
        // 6. Audio
        {
          id: `clip-audio-1`,
          trackId: 'track-audio',
          type: 'audio',
          name: sampleBgm.name,
          startTime: 0,
          duration: 10,
          trimStart: 0,
          sourceDuration: 10,
          sourceUrl: sampleBgm.url,
          volume: 0.7
        }
      ]

      setDuration(10.5)
      setCurrentTime(1)
      setClips(sampleClips)
      setSelectedClipId(sampleClips[2].id) // Select the CG clip so the inspector shows its ChromaKey settings!
    } catch (e) {
      console.error('Failed to load sample project', e)
    }
  }

  // Load sample on first mount
  useEffect(() => {
    handleLoadSampleProject()
  }, [])

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      } else if (e.code === 'KeyS') {
        e.preventDefault()
        handleSplitClip()
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault()
          handleDeleteClip(selectedClipId)
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 1 / 30
        setCurrentTime((t) => Math.max(0, t - step))
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 1 / 30
        setCurrentTime((t) => Math.min(duration, t + step))
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, duration, selectedClipId, clips, history, future])

  // Start Export Process
  const handleStartExport = async () => {
    setIsExporting(true)
    setIsPlaying(false)

    try {
      await exportVideo(clips, duration, aspectRatio, 30, (p) => {
        setExportProgress(p)
      })
    } catch (err) {
      console.error('Export error', err)
    } finally {
      setIsExporting(false)
    }
  }

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f1117] text-slate-100 overflow-hidden select-none">
      {/* 1. Header Bar */}
      <Header
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onExportClick={() => {
          setExportProgress(null)
          setIsExportModalOpen(true)
        }}
        onLoadSampleProject={handleLoadSampleProject}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 2. Middle Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          mediaLibrary={mediaLibrary}
          onAddMedia={handleAddMedia}
          onDeleteMedia={handleDeleteMedia}
          onAddClipToTimeline={handleAddClipToTimeline}
          selectedClip={selectedClip}
          onUpdateClip={handleUpdateClip}
        />

        {/* Center Canvas Preview Player */}
        <PreviewPlayer
          canvasRef={canvasRef}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          aspectRatio={aspectRatio}
          isLooping={isLooping}
          onToggleLoop={() => setIsLooping(!isLooping)}
        />

        {/* Right Inspector */}
        {selectedClip && (
          <Inspector
            clip={selectedClip}
            onClose={() => setSelectedClipId(null)}
            onUpdateClip={handleUpdateClip}
          />
        )}
      </div>

      {/* 3. Bottom Timeline */}
      <Timeline
        tracks={tracks}
        clips={clips}
        currentTime={currentTime}
        totalDuration={duration}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        onSeek={handleSeek}
        onUpdateClip={handleUpdateClip}
        onDeleteClip={handleDeleteClip}
        onSplitClip={handleSplitClip}
        onDuplicateClip={handleDuplicateClip}
        onDurationChange={setDuration}
      />

      {/* 4. Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onStartExport={handleStartExport}
        isExporting={isExporting}
        progress={exportProgress}
        aspectRatio={aspectRatio}
        projectTitle={projectTitle}
      />
    </div>
  )
}

export default App
