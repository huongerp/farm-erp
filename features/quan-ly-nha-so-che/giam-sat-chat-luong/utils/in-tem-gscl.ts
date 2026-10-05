/**
 * In tem QR thùng mẫu giám sát chất lượng.
 * - Chế độ `cuon` (máy in tem Xprinter / TSC / Godex…): `@page` đúng khổ tem, lề 0, mỗi
 *   trang một tem — chọn đúng khổ giấy tem trong driver là in thẳng.
 * - Chế độ `a4`: xếp lưới trên A4 (viền cắt nét đứt) để in thử bằng máy in thường.
 * In qua iframe ẩn (không mở tab mới → không bị chặn popup trên điện thoại).
 */
import { taoQrDataUrl } from '../../../../components/shared/QrCodeImage';
import i18n from '../../../../lib/i18n';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { bocCucTem, type CaiDatTem } from '../core/mau-tem';
import { taoNoiDungQr } from '../core/qr';
import { HINH_CHUOI_SVG } from './hinh-chuoi';
import type { GiamSatChatLuong, ThungMau } from '../core/types';

export interface TemGscl {
  maTem: string;
  soPhieu: string;
  stt: number;
  tongThung: number;
  /** YYYY-MM-DD */
  ngay: string;
  farm: string | null;
  thanhPham: string | null;
  cayHang: string | null;
}

export function temTuPhieu(phieu: GiamSatChatLuong, thung: ThungMau[]): TemGscl[] {
  return thung.map((t) => ({
    maTem: t.ma_tem,
    soPhieu: phieu.so_phieu,
    stt: t.stt_thung,
    tongThung: phieu.so_thung_mau,
    ngay: phieu.ngay,
    farm: phieu.ten_chi_nhanh,
    thanhPham: phieu.ten_hang_hoa,
    cayHang: phieu.ma_cay_hang,
  }));
}

/** Tem mẫu cho khung xem trước trong Cài đặt. */
export const TEM_MAU: TemGscl = {
  maTem: '2026-001-10-04-03',
  soPhieu: '001-10-04',
  stt: 3,
  tongThung: 10,
  ngay: new Date().toISOString().slice(0, 10),
  farm: 'Farm Chư Prông',
  thanhPham: 'Chuối A1 — 13kg',
  cayHang: 'C-12',
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function taoHtmlTemGscl(tems: { tem: TemGscl; qrSrc: string }[], c: CaiDatTem): string {
  const bc = bocCucTem(c);
  const f = c.truong;
  const t = (k: string, o?: Record<string, unknown>) => esc(i18n.t(`giamSatChatLuong.tem.${k}`, o));

  const cells = tems
    .map(({ tem, qrSrc }) => {
      const nhan = f.nhan
        ? c.logo
          ? `<img class="logo" src="${esc(c.logo)}" alt="" />`
          : c.nhan.trim()
            ? `<span class="nhan">${esc(c.nhan.trim())}</span>`
            : ''
        : '';
      const dau = [nhan, f.soPhieu ? `<span class="so">${esc(tem.soPhieu)}</span>` : ''].filter(Boolean).join('');
      const dong: string[] = [];
      if (dau) dong.push(`<div class="dau">${dau}</div>`);
      if (f.thung) dong.push(`<div class="thung">${t('thung', { stt: tem.stt, tong: tem.tongThung })}</div>`);
      const ngayFarm = [f.ngay ? formatYmdToDisplay(tem.ngay) : '', f.farm ? (tem.farm ?? '') : '']
        .filter(Boolean)
        .map(esc)
        .join(' · ');
      if (ngayFarm) dong.push(`<div class="phu">${ngayFarm}</div>`);
      const tenHang = c.tenHang.trim() || tem.thanhPham;
      if (f.thanhPham && tenHang) {
        dong.push(`<div class="phu hang">${f.hinhChuoi ? HINH_CHUOI_SVG : ''}<span>${esc(tenHang)}</span></div>`);
      }
      if (f.cayHang && tem.cayHang) dong.push(`<div class="phu">${t('cayHang', { ma: tem.cayHang })}</div>`);
      return `<div class="tem"><img class="qr" src="${qrSrc}" alt="" /><div class="chu">${dong.join('')}</div></div>`;
    })
    .join('\n');

  const trang =
    c.cheDo === 'cuon'
      ? `@page { size: ${c.rong}mm ${c.cao}mm; margin: 0; }
  .tem { break-after: page; page-break-after: always; }
  .tem:last-child { break-after: auto; page-break-after: auto; }`
      : `@page { size: A4; margin: 8mm; }
  .luoi { display: flex; flex-wrap: wrap; gap: 2mm; }
  .tem { border: 0.2mm dashed #999; break-inside: avoid; page-break-inside: avoid; }`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Tem QC</title>
<style>
  ${trang}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif;
               -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tem { width: ${c.rong}mm; height: ${c.cao}mm; padding: ${c.le}mm; overflow: hidden;
         display: flex; flex-direction: ${bc.ngang ? 'row' : 'column'}; align-items: center;
         gap: ${bc.ngang ? 1.5 : 0.8}mm; }
  .qr { width: ${bc.qrMm}mm; height: ${bc.qrMm}mm; flex-shrink: 0; }
  .chu { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center;
         gap: 0.4mm; line-height: 1.12; ${bc.ngang ? '' : 'width: 100%; text-align: center; align-items: center;'} }
  .chu > div { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dau { display: flex; align-items: center; gap: 1mm; ${bc.ngang ? '' : 'justify-content: center;'} }
  .nhan { font-weight: 700; font-size: ${c.coChu}pt; border: 0.3mm solid #000; padding: 0 0.8mm; border-radius: 0.6mm; }
  .logo { height: ${c.coChu * 1.5}pt; width: auto; max-width: 14mm; object-fit: contain; }
  .so { font-weight: 700; font-size: ${c.coChu}pt; letter-spacing: 0.1mm; }
  .thung { font-weight: 800; font-size: ${Math.round(c.coChu * 1.3 * 10) / 10}pt; }
  .phu { font-size: ${bc.coChuPhu}pt; }
  .hang { display: flex; align-items: center; gap: 0.8mm; ${bc.ngang ? '' : 'justify-content: center;'} }
  .hang span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .chuoi { height: 1.6em; width: 1.6em; flex-shrink: 0; }
</style></head><body><div class="luoi">
${cells}
</div></body></html>`;
}

/** Sinh QR (mỗi tem một mã) rồi dựng HTML. */
export async function dungHtmlTem(tems: TemGscl[], c: CaiDatTem): Promise<string> {
  const voiQr = await Promise.all(
    tems.map(async (tem) => ({ tem, qrSrc: await taoQrDataUrl(taoNoiDungQr(tem.maTem), 360, 0) }))
  );
  return taoHtmlTemGscl(voiQr, c);
}

export async function inTemGscl(tems: TemGscl[], c: CaiDatTem): Promise<void> {
  if (tems.length === 0) return;
  const html = await dungHtmlTem(tems, c);

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise<void>((resolve) => {
    const imgs = Array.from(doc.images);
    let con = imgs.length;
    if (con === 0) return resolve();
    const xong = () => --con <= 0 && resolve();
    imgs.forEach((im) => (im.complete ? xong() : im.addEventListener('load', xong, { once: true })));
  });
  win.focus();
  win.print();
  setTimeout(() => iframe.remove(), 60_000);
}
