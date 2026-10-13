import type { MediaItem } from '../types/editor'

export async function generateDemoVideo(
  type: 'synthwave' | 'gradient' | 'countdown' | 'greenscreen' = 'synthwave',
  durationSec: number = 6
): Promise<MediaItem> {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')!

  const stream = canvas.captureStream(30)
  
  const audioCtx = new AudioContext()
  const dest = audioCtx.createMediaStreamDestination()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(type === 'synthwave' ? 220 : type === 'greenscreen' ? 440 : 330, audioCtx.currentTime)
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime)
  osc.connect(gain)
  gain.connect(dest)
  osc.start()

  const combinedTracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]
  const combinedStream = new MediaStream(combinedTracks)

  let mimeType = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm'
  }

  const mediaRecorder = new MediaRecorder(combinedStream, { mimeType })
  const chunks: Blob[] = []

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const fps = 30
  const totalFrames = durationSec * fps
  let frame = 0

  const drawFrame = (f: number) => {
    const time = f / fps
    const w = canvas.width
    const h = canvas.height

    if (type === 'greenscreen') {
      // Pure Green Screen background (#00FF00) for Chroma Keying
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2

      // Animated 3D Futuristic Cyber Orb & Energy Rings
      const angle = time * 3
      const bobbing = Math.sin(time * 4) * 20

      // Rotating Outer Ring
      ctx.save()
      ctx.translate(cx, cy + bobbing)
      ctx.rotate(angle)
      ctx.lineWidth = 10
      ctx.strokeStyle = '#38bdf8'
      ctx.shadowColor = '#0284c7'
      ctx.shadowBlur = 25
      ctx.beginPath()
      ctx.ellipse(0, 0, 160, 60, angle * 0.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // Counter Rotating Ring
      ctx.save()
      ctx.translate(cx, cy + bobbing)
      ctx.rotate(-angle * 1.2)
      ctx.lineWidth = 8
      ctx.strokeStyle = '#ec4899'
      ctx.shadowColor = '#db2777'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.ellipse(0, 0, 140, 50, -angle * 0.4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // Glowing Center Orb
      const orbGrad = ctx.createRadialGradient(cx - 20, cy + bobbing - 20, 10, cx, cy + bobbing, 70)
      orbGrad.addColorStop(0, '#ffffff')
      orbGrad.addColorStop(0.3, '#f59e0b')
      orbGrad.addColorStop(0.7, '#ef4444')
      orbGrad.addColorStop(1, '#7f1d1d')

      ctx.save()
      ctx.fillStyle = orbGrad
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 30
      ctx.beginPath()
      ctx.arc(cx, cy + bobbing, 65, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Holographic CG Badge
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#000000'
      ctx.shadowBlur = 10
      ctx.fillText('🛸 크로마키 CG 오브젝트', cx, cy + bobbing + 140)
      ctx.restore()
    } else if (type === 'synthwave') {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#0f051d')
      grad.addColorStop(0.5, '#2b1055')
      grad.addColorStop(1, '#ff007f')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      const sunGrad = ctx.createLinearGradient(w / 2, h / 2 - 120, w / 2, h / 2 + 80)
      sunGrad.addColorStop(0, '#ffff00')
      sunGrad.addColorStop(1, '#ff0055')
      ctx.fillStyle = sunGrad
      ctx.beginPath()
      ctx.arc(w / 2, h / 2 - 20, 100, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#0b0014'
      ctx.fillRect(0, h * 0.6, w, h * 0.4)

      ctx.strokeStyle = '#00ffff'
      ctx.lineWidth = 2
      const gridOffset = (time * 80) % 40
      for (let y = h * 0.6; y < h; y += 15 + (y - h * 0.6) * 0.2) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      for (let x = -w; x < w * 2; x += 60) {
        ctx.beginPath()
        ctx.moveTo(w / 2, h * 0.6)
        ctx.lineTo(x + gridOffset, h)
        ctx.stroke()
      }

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`OpenCut 샘플 영상 #1 (${time.toFixed(1)}s)`, w / 2, 80)
    } else if (type === 'countdown') {
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, w, h)

      const remaining = Math.max(0, Math.ceil(durationSec - time))
      const progress = (time % 1)

      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 14
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 140, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress))
      ctx.stroke()

      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 96px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${remaining}`, w / 2, h / 2)

      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('컷 편집 & 자막 테스트 클립', w / 2, h / 2 + 190)
    } else {
      const angle = time * 0.8
      const x1 = w / 2 + Math.cos(angle) * w * 0.6
      const y1 = h / 2 + Math.sin(angle) * h * 0.6
      const x2 = w / 2 - Math.cos(angle) * w * 0.6
      const y2 = h / 2 - Math.sin(angle) * h * 0.6

      const grad = ctx.createLinearGradient(x1, y1, x2, y2)
      grad.addColorStop(0, '#6366f1')
      grad.addColorStop(0.5, '#ec4899')
      grad.addColorStop(1, '#f59e0b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      for (let i = 0; i < 20; i++) {
        const px = (Math.sin(time + i) * 0.5 + 0.5) * w
        const py = (Math.cos(time * 0.7 + i * 2) * 0.5 + 0.5) * h
        const radius = 10 + (i % 5) * 8
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✨ 화려한 모션 배경 클립', w / 2, h / 2)
    }
  }

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      osc.stop()
      audioCtx.close()
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      const thumbUrl = canvas.toDataURL('image/jpeg', 0.8)

      const names = {
        synthwave: '레트로 신스웨이브 클립',
        gradient: '모션 그라디언트 클립',
        countdown: '카운트다운 타이머 클립',
        greenscreen: '🟢 크로마키 CG 오브젝트'
      }

      resolve({
        id: `sample-${type}-${Date.now()}`,
        name: names[type],
        type: 'video',
        url,
        duration: durationSec,
        thumbnailUrl: thumbUrl,
        width: 1280,
        height: 720,
        isGreenScreen: type === 'greenscreen'
      })
    }

    mediaRecorder.start()

    const interval = setInterval(() => {
      drawFrame(frame)
      frame++
      if (frame >= totalFrames) {
        clearInterval(interval)
        mediaRecorder.stop()
      }
    }, 1000 / fps)
  })
}

export async function generateDemoAudio(durationSec: number = 10): Promise<MediaItem> {
  const sampleRate = 44100
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate)

  const chords = [
    [261.63, 329.63, 392.00, 493.88],
    [220.00, 261.63, 329.63, 392.00],
    [293.66, 349.23, 440.00, 523.25],
    [196.00, 246.94, 293.66, 349.23]
  ]

  const chordDuration = durationSec / chords.length

  chords.forEach((chord, i) => {
    const startTime = i * chordDuration
    chord.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + chordDuration - 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + chordDuration)
    })
  })

  const renderedBuffer = await ctx.startRendering()
  const wavBlob = audioBufferToWavBlob(renderedBuffer)
  const url = URL.createObjectURL(wavBlob)

  return {
    id: `sample-audio-${Date.now()}`,
    name: 'Lo-Fi 칠 감성 BGM',
    type: 'audio',
    url,
    duration: durationSec
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels
  const length = buffer.length * numOfChan * 2 + 44
  const out = new DataView(new ArrayBuffer(length))
  const channels: Float32Array[] = []
  let sample = 0
  let offset = 0
  let pos = 0

  function setUint16(data: number) {
    out.setUint16(pos, data, true)
    pos += 2
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true)
    pos += 4
  }

  setUint32(0x46464952) // "RIFF"
  setUint32(length - 8)
  setUint32(0x45564157) // "WAVE"
  setUint32(0x20746d66) // "fmt " chunk
  setUint32(16)         // length = 16
  setUint16(1)          // PCM
  setUint16(numOfChan)
  setUint32(buffer.sampleRate)
  setUint32(buffer.sampleRate * 2 * numOfChan)
  setUint16(numOfChan * 2)
  setUint16(16)
  setUint32(0x61746164) // "data" - chunk
  setUint32(length - pos - 4)

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]))
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
      out.setInt16(pos, sample, true)
      pos += 2
    }
    offset++
  }

  return new Blob([out.buffer], { type: 'audio/wav' })
}

export function generateDemoImage(type: 'badge' | 'photo' = 'badge'): MediaItem {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 600
  const ctx = canvas.getContext('2d')!

  if (type === 'badge') {
    // Transparent PNG Hologram Sticker Badge
    const cx = 300
    const cy = 300

    ctx.shadowColor = '#6366f1'
    ctx.shadowBlur = 30
    const grad = ctx.createLinearGradient(100, 100, 500, 500)
    grad.addColorStop(0, '#ec4899')
    grad.addColorStop(0.5, '#8b5cf6')
    grad.addColorStop(1, '#3b82f6')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, 220, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(cx, cy, 200, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 50px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⭐ VIP', cx, cy - 30)

    ctx.font = 'bold 36px sans-serif'
    ctx.fillText('OPENCUT', cx, cy + 40)
  } else {
    // Beautiful landscape mock photo
    const grad = ctx.createLinearGradient(0, 0, 0, 600)
    grad.addColorStop(0, '#0284c7')
    grad.addColorStop(0.7, '#f472b6')
    grad.addColorStop(1, '#ea580c')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 600, 600)

    ctx.fillStyle = '#fef08a'
    ctx.beginPath()
    ctx.arc(300, 260, 90, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1e1b4b'
    ctx.beginPath()
    ctx.moveTo(0, 600)
    ctx.lineTo(180, 360)
    ctx.lineTo(360, 600)
    ctx.fill()

    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.moveTo(220, 600)
    ctx.lineTo(440, 320)
    ctx.lineTo(600, 600)
    ctx.fill()
  }

  const url = canvas.toDataURL('image/png')
  return {
    id: `sample-img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: type === 'badge' ? '⭐ 홀로그램 스티커 사진' : '🌅 풍경 일러스트 사진',
    type: 'image',
    url,
    thumbnailUrl: url,
    duration: 4,
    width: 600,
    height: 600
  }
}

