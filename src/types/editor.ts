export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3'

export interface AspectRatioConfig {
  label: string
  width: number
  height: number
  description: string
}

export const ASPECT_RATIOS: Record<AspectRatio, AspectRatioConfig> = {
  '16:9': { label: '16:9 유튜브/일반', width: 1920, height: 1080, description: '가로 영상 (YouTube, TV)' },
  '9:16': { label: '9:16 쇼츠/릴스', width: 1080, height: 1920, description: '세로 영상 (Shorts, Reels, TikTok)' },
  '1:1': { label: '1:1 인스타그램', width: 1080, height: 1080, description: '정사각형 피드' },
  '4:3': { label: '4:3 클래식', width: 1440, height: 1080, description: '전통 비디오 비율' }
}

export type ClipType = 'video' | 'text' | 'audio' | 'image' | 'vfx'
export type TrackType = 'video' | 'text' | 'audio' | 'overlay'

export interface MediaItem {
  id: string
  name: string
  type: 'video' | 'audio' | 'image'
  url: string
  duration: number
  thumbnailUrl?: string
  width?: number
  height?: number
  isGreenScreen?: boolean
}

export interface VideoFilters {
  brightness: number // 100 default
  contrast: number   // 100 default
  saturation: number // 100 default
  grayscale: number  // 0 default
  sepia: number      // 0 default
  blur: number       // 0 default
}

export type TextStylePreset = 'simple' | 'youtube' | 'box' | 'neon' | 'meme' | 'minimal'

export interface TextProperties {
  text: string
  fontFamily: string
  fontSize: number
  color: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  textAlign: 'left' | 'center' | 'right'
  stylePreset: TextStylePreset
  posX: number // 0-100%
  posY: number // 0-100%
}

// CG & VFX specific definitions
export type BlendMode = 'source-over' | 'screen' | 'multiply' | 'lighter' | 'overlay' | 'difference'
export type VFXEffectType = 'none' | 'glitch' | 'sparks' | 'snow' | 'rain' | 'light_leak' | 'laser_grid'
export type MotionAnimationType = 'none' | 'shake' | 'pulse' | 'float' | 'spin'

export interface ChromaKeyConfig {
  enabled: boolean
  color: string       // e.g. '#00ff00'
  similarity: number  // 10 to 100
  smoothness: number  // 0 to 50
}

export interface TransformConfig {
  x: number        // -50% to 50%
  y: number        // -50% to 50%
  scale: number    // 0.2 to 3.0
  rotation: number // -180 to 180 deg
}

export interface TimelineClip {
  id: string
  trackId: string
  type: ClipType
  name: string
  startTime: number       // In timeline seconds
  duration: number        // On timeline duration in seconds
  trimStart: number       // Offset inside source media
  sourceDuration: number  // Original media duration
  mediaId?: string
  sourceUrl?: string
  
  // Video / Image adjustments
  filters?: VideoFilters
  playbackRate?: number   // 0.5, 1, 1.5, 2
  volume?: number         // 0 to 1
  muted?: boolean
  opacity?: number        // 0 to 1

  // CG & VFX Properties
  chromaKey?: ChromaKeyConfig
  blendMode?: BlendMode
  vfxEffect?: VFXEffectType
  motion?: MotionAnimationType
  transform?: TransformConfig

  // Text / Subtitle properties
  textProps?: TextProperties
}

export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  color: string
  isMuted?: boolean
  isLocked?: boolean
}

export interface ProjectState {
  id: string
  title: string
  aspectRatio: AspectRatio
  duration: number
  fps: number
  tracks: TimelineTrack[]
  clips: TimelineClip[]
  mediaLibrary: MediaItem[]
}
