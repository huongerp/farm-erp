import type { jsPDF } from 'jspdf';

/** Tên font đã đăng ký trong jsPDF (dùng cho autoTable `styles.font`). */
export const JSPDF_VI_FONT_FAMILY = 'NotoSans';

const VFS_REGULAR = 'NotoSans-Regular.ttf';
const VFS_BOLD = 'NotoSans-Bold.ttf';

let fontB64Promise: Promise<{ regular: string; bold: string }> | null = null;
const docsWithViFont = new WeakSet<jsPDF>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

function loadFontBase64(): Promise<{ regular: string; bold: string }> {
  if (!fontB64Promise) {
    fontB64Promise = (async () => {
      const rawBase = import.meta.env.BASE_URL;
      const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
      const regUrl = `${base}/fonts/NotoSans-Regular.ttf`;
      const boldUrl = `${base}/fonts/NotoSans-Bold.ttf`;
      const [regRes, boldRes] = await Promise.all([fetch(regUrl), fetch(boldUrl)]);
      if (!regRes.ok) {
        throw new Error(`Không tải được font PDF (${regUrl}): ${regRes.status}`);
      }
      if (!boldRes.ok) {
        throw new Error(`Không tải được font PDF (${boldUrl}): ${boldRes.status}`);
      }
      const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
      return {
        regular: arrayBufferToBase64(regBuf),
        bold: arrayBufferToBase64(boldBuf),
      };
    })();
  }
  return fontB64Promise;
}

/**
 * Nhúng Noto Sans (Regular + Bold) vào instance jsPDF để hiển thị tiếng Việt đúng.
 * Cache nội dung base64 toàn app; mỗi document chỉ addFont một lần.
 */
export async function ensureJsPDFVietnameseFont(doc: jsPDF): Promise<void> {
  if (!docsWithViFont.has(doc)) {
    const { regular, bold } = await loadFontBase64();
    doc.addFileToVFS(VFS_REGULAR, regular);
    doc.addFont(VFS_REGULAR, JSPDF_VI_FONT_FAMILY, 'normal');
    doc.addFileToVFS(VFS_BOLD, bold);
    doc.addFont(VFS_BOLD, JSPDF_VI_FONT_FAMILY, 'bold');
    docsWithViFont.add(doc);
  }
  doc.setFont(JSPDF_VI_FONT_FAMILY, 'normal');
}
