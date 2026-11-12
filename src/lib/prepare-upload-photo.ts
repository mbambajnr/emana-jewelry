"use client"

// Decode locally, so WebP/AVIF input does not require a native server codec.
export async function prepareUploadPhoto(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG, WebP or AVIF photo up to 10 MB.')
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) } catch { throw new Error('Your browser could not read this photo. Try a JPG or PNG copy.') }
  try {
    if (bitmap.width * bitmap.height > 25000000) throw new Error('Choose a photo under 25 megapixels.')
    const scale = Math.min(1, 2048 / bitmap.width, 2048 / bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo processing is unavailable in this browser.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = false
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < 255) { transparent = true; break }
    const type = transparent ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('The photo could not be prepared.')), type, .85))
    if (blob.size > 10 * 1024 * 1024) throw new Error('This photo is still too large. Please choose a smaller copy.')
    return new File([blob], `photo.${transparent ? 'png' : 'jpg'}`, { type: blob.type })
  } finally { bitmap.close() }
}
