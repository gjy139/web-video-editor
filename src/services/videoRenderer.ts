import { ASPECT_RATIOS } from '../types/editor'
import type { AspectRatio, TimelineClip } from '../types/editor'
import { applyChromaKey } from '../utils/chromaKey'
import { applyMotionTransform, renderVFXOverlay } from '../utils/vfxEffects'

export class VideoRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private videoPool: Map<string, HTMLVideoElement> = new Map()
  private audioPool: Map<string, HTMLAudioElement> = new Map()
  private imagePool: Map<string, HTMLImageElement> = new Map()
  private chromaCanvas: HTMLCanvasElement = document.createElement('canvas')
  private chromaCtx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!
    this.chromaCtx = this.chromaCanvas.getContext('2d', { willReadFrequently: true })!
  }

  public setAspectRatio(aspectRatio: AspectRatio) {
    const config = ASPECT_RATIOS[aspectRatio]
    if (config) {
      this.canvas.width = config.width
      this.canvas.height = config.height
    }
  }

  public getVideoElement(clipId: string, url: string): HTMLVideoElement {
    let el = this.videoPool.get(clipId)
    if (!el) {
      el = document.createElement('video')
      el.src = url
      el.crossOrigin = 'anonymous'
      el.preload = 'auto'
      el.muted = true
      el.playsInline = true
      this.videoPool.set(clipId, el)
    }
    return el
  }

  public getImageElement(clipId: string, url: string): HTMLImageElement {
    let el = this.imagePool.get(clipId)
    if (!el) {
      el = new Image()
      el.src = url
      el.crossOrigin = 'anonymous'
      this.imagePool.set(clipId, el)
    }
    return el
  }

  public getAudioElement(clipId: string, url: string): HTMLAudioElement {
    let el = this.audioPool.get(clipId)
    if (!el) {
      el = new Audio(url)
      el.preload = 'auto'
      this.audioPool.set(clipId, el)
    }
    return el
  }

  public cleanup(activeClipIds: string[]) {
    const activeSet = new Set(activeClipIds)
    for (const [id, el] of this.videoPool.entries()) {
      if (!activeSet.has(id)) {
        el.pause()
        el.src = ''
        this.videoPool.delete(id)
      }
    }
    for (const [id, el] of this.imagePool.entries()) {
      if (!activeSet.has(id)) {
        el.src = ''
        this.imagePool.delete(id)
      }
    }
    for (const [id, el] of this.audioPool.entries()) {
      if (!activeSet.has(id)) {
        el.pause()
        el.src = ''
        this.audioPool.delete(id)
      }
    }
  }

  public syncPlayback(clips: TimelineClip[], currentTime: number, isPlaying: boolean) {
    clips.forEach((clip) => {
      const isClipActive = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration

      if (clip.type === 'video' && clip.sourceUrl) {
        const video = this.getVideoElement(clip.id, clip.sourceUrl)
        if (isClipActive) {
          const rate = clip.playbackRate || 1
          const targetTime = clip.trimStart + (currentTime - clip.startTime) * rate
          if (Math.abs(video.currentTime - targetTime) > 0.15) {
            video.currentTime = targetTime
          }
          video.playbackRate = rate
          if (isPlaying && video.paused) {
            video.play().catch(() => {})
          } else if (!isPlaying && !video.paused) {
            video.pause()
          }
        } else {
          if (!video.paused) video.pause()
        }
      }

      if (clip.type === 'audio' && clip.sourceUrl) {
        const audio = this.getAudioElement(clip.id, clip.sourceUrl)
        if (isClipActive) {
          const targetTime = clip.trimStart + (currentTime - clip.startTime)
          if (Math.abs(audio.currentTime - targetTime) > 0.15) {
            audio.currentTime = targetTime
          }
          audio.volume = (clip.volume ?? 1) * (clip.muted ? 0 : 1)
          if (isPlaying && audio.paused) {
            audio.play().catch(() => {})
          } else if (!isPlaying && !audio.paused) {
            audio.pause()
          }
        } else {
          if (!audio.paused) audio.pause()
        }
      }
    })
  }

  public render(clips: TimelineClip[], currentTime: number) {
    const ctx = this.ctx
    const cw = this.canvas.width
    const ch = this.canvas.height

    // 1. Clear background
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.filter = 'none'
    ctx.fillStyle = '#0a0a0c'
    ctx.fillRect(0, 0, cw, ch)

    // 2. Render Visual clips (Video and Image) sorted by tracks
    const visualClips = clips.filter(
      (c) => (c.type === 'video' || c.type === 'image') && currentTime >= c.startTime && currentTime < c.startTime + c.duration
    )

    visualClips.forEach((clip) => {
      if (!clip.sourceUrl) return

      let sourceDrawable: CanvasImageSource | null = null
      let vw = 0
      let vh = 0

      if (clip.type === 'video') {
        const video = this.getVideoElement(clip.id, clip.sourceUrl)
        if (video.videoWidth <= 0 || video.videoHeight <= 0) return
        sourceDrawable = video
        vw = video.videoWidth
        vh = video.videoHeight
      } else if (clip.type === 'image') {
        const img = this.getImageElement(clip.id, clip.sourceUrl)
        if (!img.complete || img.naturalWidth <= 0) return
        sourceDrawable = img
        vw = img.naturalWidth
        vh = img.naturalHeight
      }

      if (!sourceDrawable || vw <= 0 || vh <= 0) return

      // Fit dimensions
      const scale = Math.min(cw / vw, ch / vh)
      const dw = vw * scale
      const dh = vh * scale
      const dx = (cw - dw) / 2
      const dy = (ch - dh) / 2

      ctx.save()

      // Blend Mode
      if (clip.blendMode) {
        ctx.globalCompositeOperation = clip.blendMode
      }

      // Opacity
      ctx.globalAlpha = clip.opacity ?? 1

      // CSS Color Filters
      const filters = clip.filters || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0
      }
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`

      // Transform (Position, Scale, Rotation)
      const cx = dx + dw / 2
      const cy = dy + dh / 2

      ctx.translate(cx, cy)

      if (clip.transform) {
        ctx.translate((clip.transform.x / 100) * cw, (clip.transform.y / 100) * ch)
        ctx.scale(clip.transform.scale || 1, clip.transform.scale || 1)
        ctx.rotate(((clip.transform.rotation || 0) * Math.PI) / 180)
      }

      // Motion Animation (Camera Shake, Pulse, Float, Spin)
      if (clip.motion) {
        applyMotionTransform(ctx, clip.motion, currentTime, 0, 0)
      }

      ctx.translate(-dw / 2, -dh / 2)

      // Chroma Key handling
      if (clip.chromaKey && clip.chromaKey.enabled) {
        if (this.chromaCanvas.width !== vw || this.chromaCanvas.height !== vh) {
          this.chromaCanvas.width = vw
          this.chromaCanvas.height = vh
        }
        this.chromaCtx.clearRect(0, 0, vw, vh)
        this.chromaCtx.drawImage(sourceDrawable, 0, 0, vw, vh)
        applyChromaKey(this.chromaCtx, vw, vh, clip.chromaKey)
        ctx.drawImage(this.chromaCanvas, 0, 0, dw, dh)
      } else {
        ctx.drawImage(sourceDrawable, 0, 0, dw, dh)
      }

      ctx.restore()

      // VFX overlay on clip
      if (clip.vfxEffect && clip.vfxEffect !== 'none') {
        renderVFXOverlay(ctx, clip.vfxEffect, currentTime, cw, ch)
      }
    })

    // 3. Render Text / Subtitle Clips
    const textClips = clips.filter(
      (c) => c.type === 'text' && currentTime >= c.startTime && currentTime < c.startTime + c.duration
    )

    textClips.forEach((clip) => {
      if (!clip.textProps || !clip.textProps.text) return
      this.renderTextClip(ctx, clip, cw, ch, currentTime)
    })

    ctx.restore()
  }

  private renderTextClip(ctx: CanvasRenderingContext2D, clip: TimelineClip, cw: number, ch: number, currentTime: number) {
    const props = clip.textProps!
    ctx.save()
    ctx.globalCompositeOperation = clip.blendMode || 'source-over'
    ctx.filter = 'none'

    const fontSize = (props.fontSize || 48) * (cw / 1280)
    const font = `bold ${fontSize}px ${props.fontFamily || 'Pretendard, sans-serif'}`
    ctx.font = font
    ctx.textAlign = props.textAlign || 'center'
    ctx.textBaseline = 'middle'

    const x = ((props.posX ?? 50) / 100) * cw
    const y = ((props.posY ?? 80) / 100) * ch

    if (clip.motion) {
      applyMotionTransform(ctx, clip.motion, currentTime, x, y)
    }

    const lines = String(props.text).split('\n')
    const lineHeight = fontSize * 1.3
    const totalBlockHeight = lines.length * lineHeight

    lines.forEach((line, index) => {
      const lineY = y - totalBlockHeight / 2 + (index + 0.5) * lineHeight
      const metrics = ctx.measureText(line)
      const padding = fontSize * 0.35

      switch (props.stylePreset) {
        case 'youtube': {
          ctx.lineJoin = 'round'
          ctx.miterLimit = 2
          ctx.lineWidth = fontSize * 0.18
          ctx.strokeStyle = '#000000'
          ctx.strokeText(line, x, lineY)

          ctx.fillStyle = props.color || '#facc15'
          ctx.fillText(line, x, lineY)
          break
        }
        case 'box': {
          const boxWidth = metrics.width + padding * 2
          const boxHeight = lineHeight
          let boxX = x - boxWidth / 2
          if (props.textAlign === 'left') boxX = x - padding
          if (props.textAlign === 'right') boxX = x - boxWidth + padding

          ctx.fillStyle = props.backgroundColor || 'rgba(0, 0, 0, 0.75)'
          this.roundRect(ctx, boxX, lineY - boxHeight / 2, boxWidth, boxHeight, 8)
          ctx.fill()

          ctx.fillStyle = props.color || '#ffffff'
          ctx.fillText(line, x, lineY)
          break
        }
        case 'neon': {
          ctx.shadowColor = props.color || '#00f0ff'
          ctx.shadowBlur = 20
          ctx.strokeStyle = props.color || '#00f0ff'
          ctx.lineWidth = 4
          ctx.strokeText(line, x, lineY)

          ctx.fillStyle = '#ffffff'
          ctx.fillText(line, x, lineY)
          break
        }
        case 'meme': {
          ctx.font = `900 ${fontSize}px Impact, sans-serif`
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = fontSize * 0.16
          ctx.strokeText(line, x, lineY)
          ctx.fillStyle = '#ffffff'
          ctx.fillText(line, x, lineY)
          break
        }
        default: {
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetY = 2
          ctx.fillStyle = props.color || '#ffffff'
          ctx.fillText(line, x, lineY)
          break
        }
      }
    })

    ctx.restore()
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2
    if (h < 2 * r) r = h / 2
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
}
