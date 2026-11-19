/** Picks an image, crops it (centre, a bit above the middle for faces), shrinks it and returns a base64 JPEG (no prefix).
 *  The picture is stored directly in Firestore, so it is kept small. Throws 'big' when it cannot be made small enough. */
export async function fileToB64(
  file: File,
  opts: { maxSide?: number; quality?: number; limit?: number; aspect?: number; focusY?: number } = {},
): Promise<string> {
  const { maxSide = 256, quality = 0.72, limit = 150000, aspect, focusY = 0.3 } = opts;
  if (file.size > 12 * 1024 * 1024) throw 'big';
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej('bad');
      i.src = url;
    });
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (aspect) {
      if (sw / sh > aspect) {
        const w = sh * aspect;
        sx = (sw - w) / 2;
        sw = w;
      } else {
        const h = sw / aspect;
        sy = (sh - h) * focusY;
        sh = h;
      }
    }
    let side = maxSide;
    let q = quality;
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = Math.min(1, side / Math.max(sw, sh));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(sw * scale));
      c.height = Math.max(1, Math.round(sh * scale));
      const ctx = c.getContext('2d');
      if (!ctx) throw 'bad';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const b64 = c.toDataURL('image/jpeg', q).split(',')[1] ?? '';
      if (b64.length * 0.75 <= limit) return b64;
      q = Math.max(0.4, q - 0.08);
      side = Math.round(side * 0.85);
    }
    throw 'big';
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const b64Src = (b64: string) => `data:image/jpeg;base64,${b64}`;
