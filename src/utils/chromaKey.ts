import type { ChromaKeyConfig } from '../types/editor'

/**
 * Removes background color (e.g. Green Screen) with similarity and smoothness feathering.
 */
export function applyChromaKey(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ChromaKeyConfig
) {
  if (!config.enabled) return

  const targetHex = config.color || '#00ff00'
  const hex = targetHex.replace('#', '')
  const tr = parseInt(hex.substring(0, 2), 16) || 0
  const tg = parseInt(hex.substring(2, 4), 16) || 255
  const tb = parseInt(hex.substring(4, 6), 16) || 0

  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  const similarityThreshold = (config.similarity / 100) * 255
  const smoothnessRange = Math.max(1, (config.smoothness / 100) * 150)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Color distance in RGB space
    const dist = Math.sqrt(
      (r - tr) * (r - tr) +
      (g - tg) * (g - tg) +
      (b - tb) * (b - tb)
    )

    if (dist < similarityThreshold) {
      // Fully transparent
      data[i + 3] = 0
    } else if (dist < similarityThreshold + smoothnessRange) {
      // Soft edge feathering
      const alphaFactor = (dist - similarityThreshold) / smoothnessRange
      data[i + 3] = Math.round(data[i + 3] * alphaFactor)
    }
  }

  ctx.putImageData(imgData, 0, 0)
}
