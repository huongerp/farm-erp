/**
 * Ảnh chia sẻ công việc (Zalo / Messenger…): tên công việc + mô tả + kết quả báo cáo.
 *
 * Vì sao dựng HTML trong iframe rồi mới chụp bằng html2canvas (giống
 * export-don-dat-hang.ts) thay vì chụp thẳng DOM của drawer: Tailwind v4 sinh màu
 * `oklch()` mà html2canvas 1.4 không parse được — chụp thẳng sẽ ra ảnh đen/sai màu.
 * Tài liệu rời với màu hex thuần tránh hẳn chuyện đó.
 *
 * Clipboard trên điện thoại: Safari/iOS chỉ cho ghi clipboard NGAY trong cử chỉ
 * người dùng, nên `ClipboardItem` phải nhận Promise<Blob> và được tạo đồng bộ
 * trong handler (xem copyCongViecImage). Máy không hỗ trợ thì lần lượt rơi về
 * Web Share (mở sheet chia sẻ → chọn Zalo) rồi tải ảnh về.
 */

const FONT = "Arial, 'Helvetica Neue', sans-serif";
const IMAGE_WIDTH = 820;

export interface CongViecShareImageData {
  tieuDe: string;
  moTa?: string | null;
  ketQua?: string | null;
  /** Dòng phụ dưới tiêu đề: trạng thái · ưu tiên · người thực hiện */
  metaLine?: string;
  linkKetQua?: string | null;
  companyName?: string | null;
  /** Nhãn hiển thị, truyền từ i18n để không hardcode chuỗi trong util */
  labels: {
    heading: string;
    moTa: string;
    ketQua: string;
    linkKetQua: string;
    empty: string;
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Giữ ngắt dòng người dùng nhập khi đưa vào HTML */
function toHtmlText(value: string | null | undefined, empty: string): string {
  const text = value?.trim();
  if (!text) return `<span style="color:#9ca3af;font-style:italic">${escapeHtml(empty)}</span>`;
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

function buildShareHtml(data: CongViecShareImageData): string {
  const { labels } = data;
  const block = (label: string, body: string) => `
    <div style="margin-top:20px">
      <div style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b">${escapeHtml(label)}</div>
      <div style="margin-top:6px;font-size:17px;line-height:1.55;color:#111827;white-space:normal">${body}</div>
    </div>`;

  return `
  <div style="width:${IMAGE_WIDTH}px;background:#ffffff;font-family:${FONT};padding:32px 34px 28px">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #16a34a;padding-bottom:12px">
      <div style="font-size:14px;font-weight:700;color:#16a34a;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(labels.heading)}</div>
      ${data.companyName ? `<div style="font-size:13px;color:#6b7280">${escapeHtml(data.companyName)}</div>` : ''}
    </div>
    <div style="margin-top:18px;font-size:26px;line-height:1.35;font-weight:700;color:#0f172a">${escapeHtml(data.tieuDe)}</div>
    ${data.metaLine ? `<div style="margin-top:8px;font-size:15px;color:#64748b">${escapeHtml(data.metaLine)}</div>` : ''}
    ${block(labels.moTa, toHtmlText(data.moTa, labels.empty))}
    ${block(labels.ketQua, toHtmlText(data.ketQua, labels.empty))}
    ${
      data.linkKetQua?.trim()
        ? `<div style="margin-top:18px;font-size:15px;color:#2563eb;word-break:break-all">${escapeHtml(labels.linkKetQua)}: ${escapeHtml(data.linkKetQua.trim())}</div>`
        : ''
    }
  </div>`;
}

/** Dựng ảnh PNG của công việc. Trả về Blob để ghi clipboard / chia sẻ / tải về. */
export async function buildCongViecShareImageBlob(data: CongViecShareImageData): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas');

  const fullHtml = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff;font-family:${FONT}}</style>`,
    '</head><body>',
    buildShareHtml(data),
    '</body></html>',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('srcdoc', fullHtml);
  iframe.style.cssText = `position:fixed;left:0;top:0;width:${IMAGE_WIDTH}px;border:0;z-index:-1;visibility:hidden`;
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('iframe load failed'));
    });
    await new Promise((r) => setTimeout(r, 200));

    const body = iframe.contentDocument?.body;
    if (!body) throw new Error('iframe body not available');
    const height = body.scrollHeight;
    iframe.style.height = `${height + 10}px`;
    await new Promise((r) => setTimeout(r, 50));

    const canvas = await html2canvas(body, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: IMAGE_WIDTH,
      height,
      windowWidth: IMAGE_WIDTH,
      windowHeight: height,
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('canvas.toBlob returned null');
    return blob;
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

export type CongViecCopyImageResult = 'clipboard' | 'share' | 'download';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareOrDownload(blobPromise: Promise<Blob>, fileName: string): Promise<CongViecCopyImageResult> {
  const blob = await blobPromise;
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return 'share';
    } catch (e) {
      // Người dùng đóng sheet chia sẻ → không rơi tiếp xuống tải file
      if ((e as DOMException)?.name === 'AbortError') return 'share';
    }
  }
  downloadBlob(blob, fileName);
  return 'download';
}

/**
 * PHẢI gọi trực tiếp trong handler click (không await gì trước đó): iOS chỉ cho
 * ghi clipboard trong cử chỉ người dùng, và ClipboardItem nhận Promise<Blob> nên
 * việc dựng ảnh vẫn chạy bất đồng bộ được.
 */
export function copyCongViecImage(
  data: CongViecShareImageData,
  fileName = 'cong-viec.png'
): Promise<CongViecCopyImageResult> {
  const blobPromise = buildCongViecShareImageBlob(data);

  const canUseClipboard =
    typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.clipboard?.write;

  if (!canUseClipboard) return shareOrDownload(blobPromise, fileName);

  try {
    const item = new ClipboardItem({ 'image/png': blobPromise });
    return navigator.clipboard
      .write([item])
      .then<CongViecCopyImageResult>(() => 'clipboard')
      .catch(() => shareOrDownload(blobPromise, fileName));
  } catch {
    return shareOrDownload(blobPromise, fileName);
  }
}
