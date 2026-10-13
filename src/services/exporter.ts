import { ASPECT_RATIOS } from '../types/editor'
import type { AspectRatio, TimelineClip } from '../types/editor'
import { applyChromaKey } from '../utils/chromaKey'
import { applyMotionTransform, renderVFXOverlay } from '../utils/vfxEffects'

export interface ExportProgress {
  percent: number
  currentTime: number
  totalDuration: number
  status: 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error'
  downloadUrl?: string
  errorMsg?: string
}

export async function exportVideo(
  clips: TimelineClip[],
  duration: number,
  aspectRatio: AspectRatio,
  fps: number = 30,
  onProgress: (progress: ExportProgress) => void
): Promise<string> {
  const config = ASPECT_RATIOS[aspectRatio]
  const width = config.width
  const height = config.height

  onProgress({
    percent: 0,
    currentTime: 0,
    totalDuration: duration,
    status: 'preparing'
  })

  // 1. Prepare Export Canvas & Chroma Canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  const chromaCanvas = document.createElement('canvas')
  const chromaCtx = chromaCanvas.getContext('2d', { willReadFrequently: true })!

  // 2. Prepare Video & Image elements pool
  const videoElements: Map<string, HTMLVideoElement> = new Map()
  const imageElements: Map<string, HTMLImageElement> = new Map()

  for (const clip of clips) {
    if (clip.type === 'video' && clip.sourceUrl && !videoElements.has(clip.id)) {
      const v = document.createElement('video')
      v.src = clip.sourceUrl
      v.crossOrigin = 'anonymous'
      v.muted = true
      v.playsInline = true
      await new Promise<void>((res) => {
        v.onloadeddata = () => res()
        v.onerror = () => res()
      })
      videoElements.set(clip.id, v)
    } else if (clip.type === 'image' && clip.sourceUrl && !imageElements.has(clip.id)) {
      const img = new Image()
      img.src = clip.sourceUrl
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res) => {
        if (img.complete) {
          res()
        } else {
          img.onload = () => res()
          img.onerror = () => res()
        }
      })
      imageElements.set(clip.id, img)
    }
  }

  // 3. Audio & Stream capture
  const audioCtx = new AudioContext()
  const dest = audioCtx.createMediaStreamDestination()
  const canvasStream = canvas.captureStream(fps)

  const combinedTracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]
  const combinedStream = new MediaStream(combinedTracks)

  let mimeType = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm'
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6_000_000
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  return new Promise((resolve, reject) => {
    recorder.onerror = (e) => {
      onProgress({
        percent: 0,
        currentTime: 0,
        totalDuration: duration,
        status: 'error',
        errorMsg: 'MediaRecorder export failed: ' + e
      })
      reject(e)
    }

    recorder.onstop = () => {
      audioCtx.close()
      const blob = new Blob(chunks, { type: mimeType })
      const downloadUrl = URL.createObjectURL(blob)
      onProgress({
        percent: 100,
        currentTime: duration,
        totalDuration: duration,
        status: 'completed',
        downloadUrl
      })
      resolve(downloadUrl)
    }

    recorder.start(100)

    const totalFrames = Math.max(1, Math.ceil(duration * fps))
    let currentFrame = 0

    const stepInterval = setInterval(async () => {
      if (currentFrame >= totalFrames) {
        clearInterval(stepInterval)
        recorder.stop()
        return
      }

      const currentTime = currentFrame / fps

      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.filter = 'none'
      ctx.fillStyle = '#0a0a0c'
      ctx.fillRect(0, 0, width, height)

      const activeClips = clips.filter(
        (c) => (c.type === 'video' || c.type === 'image') && currentTime >= c.startTime && currentTime < c.startTime + c.duration
      )

      for (const clip of activeClips) {
        if (!clip.sourceUrl) continue

        let sourceDrawable: CanvasImageSource | null = null
        let vw = 0
        let vh = 0

        if (clip.type === 'video') {
          const video = videoElements.get(clip.id)
          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            const targetTime = clip.trimStart + (currentTime - clip.startTime) * (clip.playbackRate || 1)
            video.currentTime = targetTime
            
            await new Promise<void>((r) => {
              if (video.seeking) {
                video.onseeked = () => r()
                setTimeout(r, 20)
              } else {
                r()
              }
            })
            sourceDrawable = video
            vw = video.videoWidth
            vh = video.videoHeight
          }
        } else if (clip.type === 'image') {
          const img = imageElements.get(clip.id)
          if (img && img.complete && img.naturalWidth > 0) {
            sourceDrawable = img
            vw = img.naturalWidth
            vh = img.naturalHeight
          }
        }

        if (sourceDrawable && vw > 0 && vh > 0) {
          const scale = Math.min(width / vw, height / vh)
          const dw = vw * scale
          const dh = vh * scale
          const dx = (width - dw) / 2
          const dy = (height - dh) / 2

          ctx.save()

          if (clip.blendMode) {
            ctx.globalCompositeOperation = clip.blendMode
          }

          ctx.globalAlpha = clip.opacity ?? 1

          const filters = clip.filters || {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0
          }
          ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`

          const cx = dx + dw / 2
          const cy = dy + dh / 2

          ctx.translate(cx, cy)

          if (clip.transform) {
            ctx.translate((clip.transform.x / 100) * width, (clip.transform.y / 100) * height)
            ctx.scale(clip.transform.scale || 1, clip.transform.scale || 1)
            ctx.rotate(((clip.transform.rotation || 0) * Math.PI) / 180)
          }

          if (clip.motion) {
            applyMotionTransform(ctx, clip.motion, currentTime, 0, 0)
          }

          ctx.translate(-dw / 2, -dh / 2)

          if (clip.chromaKey && clip.chromaKey.enabled) {
            if (chromaCanvas.width !== vw || chromaCanvas.height !== vh) {
              chromaCanvas.width = vw
              chromaCanvas.height = vh
            }
            chromaCtx.clearRect(0, 0, vw, vh)
            chromaCtx.drawImage(sourceDrawable, 0, 0, vw, vh)
            applyChromaKey(chromaCtx, vw, vh, clip.chromaKey)
            ctx.drawImage(chromaCanvas, 0, 0, dw, dh)
          } else {
            ctx.drawImage(sourceDrawable, 0, 0, dw, dh)
          }

          ctx.restore()

          if (clip.vfxEffect && clip.vfxEffect !== 'none') {
            renderVFXOverlay(ctx, clip.vfxEffect, currentTime, width, height)
          }
        }
      }

      // Draw text clips
      const textClips = clips.filter(
        (c) => c.type === 'text' && currentTime >= c.startTime && currentTime < c.startTime + c.duration
      )

      textClips.forEach((clip) => {
        if (!clip.textProps || !clip.textProps.text) return
        drawText(ctx, clip, width, height, currentTime)
      })

      ctx.restore()

      currentFrame++
      const percent = Math.min(99, Math.round((currentFrame / totalFrames) * 100))
      onProgress({
        percent,
        currentTime,
        totalDuration: duration,
        status: 'rendering'
      })
    }, 1000 / fps)
  })
}

function drawText(ctx: CanvasRenderingContext2D, clip: TimelineClip, cw: number, ch: number, currentTime: number) {
  const props = clip.textProps!
  ctx.save()
  if (clip.blendMode) ctx.globalCompositeOperation = clip.blendMode

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

    if (props.stylePreset === 'youtube') {
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.lineWidth = fontSize * 0.18
      ctx.strokeStyle = '#000000'
      ctx.strokeText(line, x, lineY)

      ctx.fillStyle = props.color || '#facc15'
      ctx.fillText(line, x, lineY)
    } else if (props.stylePreset === 'box') {
      const boxWidth = metrics.width + padding * 2
      const boxHeight = lineHeight
      let boxX = x - boxWidth / 2
      if (props.textAlign === 'left') boxX = x - padding
      if (props.textAlign === 'right') boxX = x - boxWidth + padding

      ctx.fillStyle = props.backgroundColor || 'rgba(0, 0, 0, 0.75)'
      ctx.beginPath()
      ctx.roundRect(boxX, lineY - boxHeight / 2, boxWidth, boxHeight, 8)
      ctx.fill()

      ctx.fillStyle = props.color || '#ffffff'
      ctx.fillText(line, x, lineY)
    } else if (props.stylePreset === 'neon') {
      ctx.shadowColor = props.color || '#00f0ff'
      ctx.shadowBlur = 20
      ctx.strokeStyle = props.color || '#00f0ff'
      ctx.lineWidth = 4
      ctx.strokeText(line, x, lineY)

      ctx.fillStyle = '#ffffff'
      ctx.fillText(line, x, lineY)
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 2
      ctx.fillStyle = props.color || '#ffffff'
      ctx.fillText(line, x, lineY)
    }
  })

  ctx.restore()
}
