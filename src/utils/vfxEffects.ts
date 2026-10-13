import type { VFXEffectType, MotionAnimationType } from '../types/editor'

export function applyMotionTransform(
  ctx: CanvasRenderingContext2D,
  motion: MotionAnimationType,
  time: number,
  cx: number,
  cy: number
) {
  if (!motion || motion === 'none') return

  if (motion === 'shake') {
    // High frequency impact camera shake
    const intensity = 12
    const dx = Math.sin(time * 45) * intensity * (Math.sin(time * 12) > 0.3 ? 1 : 0)
    const dy = Math.cos(time * 50) * intensity * (Math.cos(time * 15) > 0.3 ? 1 : 0)
    ctx.translate(dx, dy)
  } else if (motion === 'pulse') {
    // Rhythmic heartbeat pulse
    const scale = 1 + Math.sin(time * 6) * 0.06
    ctx.translate(cx, cy)
    ctx.scale(scale, scale)
    ctx.translate(-cx, -cy)
  } else if (motion === 'float') {
    // Gentle floating
    const dy = Math.sin(time * 2.5) * 16
    const dx = Math.cos(time * 1.5) * 8
    ctx.translate(dx, dy)
  } else if (motion === 'spin') {
    // Continuous rotation
    ctx.translate(cx, cy)
    ctx.rotate(time * 0.8)
    ctx.translate(-cx, -cy)
  }
}

export function renderVFXOverlay(
  ctx: CanvasRenderingContext2D,
  type: VFXEffectType,
  time: number,
  w: number,
  h: number
) {
  if (!type || type === 'none') return

  ctx.save()

  switch (type) {
    case 'glitch': {
      // 1. Horizontal slice shifts
      const sliceCount = 6
      for (let i = 0; i < sliceCount; i++) {
        const sliceY = (Math.sin(time * 20 + i * 1.7) * 0.5 + 0.5) * h
        const sliceH = 8 + (i % 3) * 12
        const offsetX = (Math.sin(time * 35 + i * 3) > 0.4 ? 1 : -1) * (15 + (i * 5))

        // Duplicate and offset strip
        try {
          ctx.drawImage(ctx.canvas, 0, sliceY, w, sliceH, offsetX, sliceY, w, sliceH)
        } catch (_) {}
      }

      // 2. Cyan / Magenta scanlines
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = 'rgba(255, 0, 100, 0.15)'
      ctx.fillRect(0, (time * 200) % h, w, 20)
      ctx.fillStyle = 'rgba(0, 255, 255, 0.15)'
      ctx.fillRect(0, (time * 150 + 50) % h, w, 15)
      break
    }

    case 'sparks': {
      // Glowing fire embers drifting upwards
      ctx.globalCompositeOperation = 'screen'
      const particleCount = 45
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 137.5
        const speed = 120 + (i % 5) * 40
        const py = h - ((time * speed + seed * 10) % (h + 100))
        const px = ((Math.sin(seed + time * 2) * 0.5 + 0.5) * w) + Math.sin(time * 3 + i) * 30
        const size = 2 + (i % 4) * 2.5
        const alpha = Math.max(0, 1 - (h - py) / h)

        const grad = ctx.createRadialGradient(px, py, 0, px, py, size * 2)
        grad.addColorStop(0, `rgba(255, 240, 150, ${alpha})`)
        grad.addColorStop(0.5, `rgba(255, 100, 20, ${alpha * 0.8})`)
        grad.addColorStop(1, 'rgba(255, 40, 0, 0)')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'snow': {
      // Soft drifting snowflakes
      ctx.globalCompositeOperation = 'screen'
      const flakeCount = 60
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      for (let i = 0; i < flakeCount; i++) {
        const seed = i * 83.1
        const speed = 60 + (i % 6) * 30
        const py = (time * speed + seed * 15) % (h + 50)
        const px = ((seed % w) + Math.sin(time * 1.5 + i) * 40 + w) % w
        const size = 1.5 + (i % 4) * 2

        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'rain': {
      // Cinematic streaks of rain
      ctx.globalCompositeOperation = 'screen'
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.45)'
      ctx.lineWidth = 1.5
      const dropCount = 70
      for (let i = 0; i < dropCount; i++) {
        const seed = i * 97.3
        const speed = 700 + (i % 5) * 150
        const py = (time * speed + seed * 20) % (h + 100)
        const px = (seed * 7) % w
        const length = 20 + (i % 4) * 15

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px - 4, py + length)
        ctx.stroke()
      }
      break
    }

    case 'light_leak': {
      // Warm anamorphic golden & magenta light leak flares
      ctx.globalCompositeOperation = 'screen'
      const flareX = (Math.sin(time * 0.7) * 0.4 + 0.5) * w
      const flareY = (Math.cos(time * 0.5) * 0.3 + 0.3) * h
      const radius = w * 0.65

      const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, radius)
      flareGrad.addColorStop(0, 'rgba(255, 170, 70, 0.45)')
      flareGrad.addColorStop(0.4, 'rgba(255, 60, 140, 0.25)')
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = flareGrad
      ctx.fillRect(0, 0, w, h)
      break
    }

    case 'laser_grid': {
      // Cyberpunk perspective horizon grid
      ctx.globalCompositeOperation = 'screen'
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.3)'
      ctx.lineWidth = 1.5
      const horizonY = h * 0.65
      const gridOffset = (time * 70) % 35

      for (let y = horizonY; y < h; y += 12 + (y - horizonY) * 0.25) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      for (let x = -w; x < w * 2; x += 80) {
        ctx.beginPath()
        ctx.moveTo(w / 2, horizonY)
        ctx.lineTo(x + gridOffset, h)
        ctx.stroke()
      }
      break
    }
  }

  ctx.restore()
}
