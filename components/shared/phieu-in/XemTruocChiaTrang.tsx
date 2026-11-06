/**
 * Xem trước CHIA TRANG THẬT bằng paged.js: khổ / hướng / lề / số trang lấy từ cài đặt in.
 *
 * `children` (các liên / chứng từ) render vào vùng NGUỒN ẩn, rộng đúng bề rộng nội dung (để ảnh
 * nạp và đo cỡ chữ). Bản SAO của vùng nguồn được nhân cỡ chữ, chuẩn bị bảng (`luoi-bang.ts`)
 * rồi đưa paged.js dựng thành `.pagedjs_page` trong một khung ẩn KHÔNG zoom, xong chuyển sang
 * `dichRef` (vùng xem mang zoom). Sau khi chia: đánh số
 * `data-trang`, chèn dấu chìm + QR. Cùng DOM đó dùng cho xem, in trình duyệt, chụp PDF.
 *
 * Bài học (drv-app): KHÔNG dùng CSS `zoom` cho cỡ chữ (paged.js đo lệch, trang trống thừa) —
 * nhân font-size/line-height đã tính vào bản sao; KHÔNG đưa `@import` cho paged.js; gom các lần
 * đổi liên tiếp (~200 ms) thành một lần dàn trang.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { kichThuocGiayIn, type CaiDatIn } from '../../../lib/phieu-in/cai-dat-in';
import { cssTrangDayDu } from '../../../lib/phieu-in/css-trang';
import { chuanBiBangNguon, type ThongTinBang } from '../../../lib/phieu-in/luoi-bang';
import { dangKyLapTieuDeBang } from '../../../lib/phieu-in/lap-tieu-de-bang';

interface PagedPreviewer {
  preview: (c: string, s: Array<Record<string, string>>, to: HTMLElement) => Promise<unknown>;
  polisher?: { destroy: () => void };
}

export interface KetQuaChiaTrang {
  soTrang: number;
  bang: ThongTinBang[];
}

interface Props {
  caiDat: CaiDatIn;
  /** Dòng góc dưới trái (giờ in · người in). */
  chanTrai: string;
  dauChim?: string | null;
  qrDataUrl?: string | null;
  /** Chưa được dàn trang (vd đang đổi logo sang data URL) — giữ nguyên, chờ. */
  tamDung?: boolean;
  /** Vùng chứa `.pagedjs_page` (khung dùng cho điều hướng, kéo cột, PDF). */
  dichRef: React.RefObject<HTMLDivElement | null>;
  /** Vùng nguồn (một liên chưa chia trang) — DOC xuất từ đây. */
  nguonRef: React.RefObject<HTMLDivElement | null>;
  onXong: (kq: KetQuaChiaTrang) => void;
  children: React.ReactNode;
}

/** Cỡ chữ theo tỉ lệ: nhân font-size / line-height ĐÃ TÍNH của từng phần tử nguồn vào bản sao. */
function nhanCoChu(nguon: HTMLElement, banSao: HTMLElement, k: number) {
  if (k === 1) return;
  const a = [nguon, ...Array.from(nguon.querySelectorAll<HTMLElement>('*'))];
  const b = [banSao, ...Array.from(banSao.querySelectorAll<HTMLElement>('*'))];
  if (a.length !== b.length) return;
  for (let i = 0; i < a.length; i++) {
    const cs = getComputedStyle(a[i]);
    const fs = parseFloat(cs.fontSize);
    if (Number.isFinite(fs) && fs > 0) b[i].style.fontSize = `${(fs * k).toFixed(2)}px`;
    if (cs.lineHeight.endsWith('px')) b[i].style.lineHeight = `${(parseFloat(cs.lineHeight) * k).toFixed(2)}px`;
  }
}

async function choAnh(el: HTMLElement, ms = 4000): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img')).filter((im) => !im.complete);
  if (imgs.length === 0) return;
  await Promise.race([
    Promise.all(
      imgs.map(
        (im) =>
          new Promise<void>((r) => {
            im.addEventListener('load', () => r(), { once: true });
            im.addEventListener('error', () => r(), { once: true });
          })
      )
    ),
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
}

function chenLopPhu(dich: HTMLElement, dauChim: string | null | undefined, qr: string | null | undefined, caiDat: CaiDatIn) {
  const trang = Array.from(dich.querySelectorAll<HTMLElement>('.pagedjs_page'));
  trang.forEach((t, i) => {
    t.setAttribute('data-trang', String(i + 1));
    // In hàng loạt: chứng từ trên trang mang dấu chìm riêng (`data-in-dau-chim`) thì dùng nó.
    const rieng = t.querySelector<HTMLElement>('[data-in-dau-chim]')?.dataset.inDauChim;
    const chu = rieng || dauChim;
    if (chu) {
      const d = document.createElement('div');
      d.className = 'phieu-in-dau-chim';
      d.textContent = chu;
      t.appendChild(d);
    }
  });
  if (qr && trang[0]) {
    const img = document.createElement('img');
    img.className = 'phieu-in-qr';
    img.src = qr;
    img.alt = '';
    // QR nằm GỌN trong lề trên (không đè nội dung): cạnh = lề trên − 3 mm (8–18 mm).
    const canh = Math.max(8, Math.min(18, caiDat.le.tren - 3));
    Object.assign(img.style, {
      width: `${canh}mm`,
      height: `${canh}mm`,
      top: `${Math.max(0.5, (caiDat.le.tren - canh) / 2)}mm`,
      right: `${caiDat.le.phai}mm`,
    });
    trang[0].appendChild(img);
  }
  return trang.length;
}

export function XemTruocChiaTrang({
  caiDat,
  chanTrai,
  dauChim,
  qrDataUrl,
  tamDung,
  dichRef,
  nguonRef,
  onXong,
  children,
}: Props) {
  const { t } = useTranslation();
  const previewerRef = useRef<PagedPreviewer | null>(null);
  const chuKyRef = useRef('');
  const runRef = useRef(0);
  const mountedRef = useRef(true);
  const onXongRef = useRef(onXong);
  const [dangChia, setDangChia] = useState(true);
  const { wMm } = kichThuocGiayIn(caiDat.kho, caiDat.huong);
  const rongNoiDung = Math.max(40, wMm - caiDat.le.trai - caiDat.le.phai);
  const nhanTrang = t('common.phieuIn.trang');

  useEffect(() => {
    onXongRef.current = onXong;
  }, [onXong]);

  // Chạy mỗi commit, khoá bằng chữ ký (css + html + lớp phủ) nên chỉ dàn lại khi thật sự đổi.
  // StrictMode mount→unmount→mount: KHÔNG huỷ lần chạy theo unmount (lần 2 trùng chữ ký sẽ bỏ
  // qua → kẹt), chỉ chặn setState bằng mountedRef.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cố ý chạy mỗi commit, đã khoá bằng chữ ký
  useEffect(() => {
    const nguon = nguonRef.current;
    const dich = dichRef.current;
    if (tamDung || !nguon || !dich || !nguon.querySelector('.phieu-in-lien')) return;

    const banSao = nguon.cloneNode(true) as HTMLElement;
    nhanCoChu(nguon, banSao, caiDat.tiLeChu);
    banSao.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    // Đánh số bảng TRONG TỪNG LIÊN / CHỨNG TỪ: bảng i của mọi liên dùng chung cài đặt cột.
    const cacLien = Array.from(banSao.querySelectorAll<HTMLElement>('.phieu-in-lien'));
    const nhom = cacLien.flatMap((l) => {
      const tl = Array.from(l.querySelectorAll<HTMLElement>(':scope > .phieu-in-tai-lieu'));
      return tl.length ? tl : [l];
    });
    const bang = nhom.map((n) => chuanBiBangNguon(n))[0] ?? [];
    // Mỗi liên / chứng từ sang trang mới. Gắn thẳng thuộc tính paged.js đọc thay vì chỉ dựa CSS
    // `break-before`: paged.js coi mọi phần tử có `style` inline (nhanCoChu ghi vào) là «undisplayed»
    // nên không tìm được phần tử đứng trước → bỏ qua ngắt trang.
    [cacLien, ...cacLien.map((l) => Array.from(l.querySelectorAll<HTMLElement>(':scope > .phieu-in-tai-lieu')))].forEach((ds) =>
      ds.forEach((el, i) => {
        if (i === 0) return;
        el.setAttribute('data-break-before', 'page');
        ds[i - 1].setAttribute('data-next-break-before', 'page');
      })
    );
    const html = `<div class="phieu-in-noi-dung">${banSao.innerHTML}</div>`;
    const css = cssTrangDayDu(caiDat, { chanTrai, nhanTrang });
    const chuKy = `${css}\u0000${html}\u0000${dauChim ?? ''}\u0000${qrDataUrl ?? ''}`;
    if (chuKy === chuKyRef.current) return;
    chuKyRef.current = chuKy;
    const run = ++runRef.current;
    setDangChia(true);

    void (async () => {
      await new Promise((r) => setTimeout(r, 200));
      if (run !== runRef.current) return;
      await choAnh(nguon);
      await dangKyLapTieuDeBang();
      const { Previewer } = await import('pagedjs');
      if (run !== runRef.current) return;
      previewerRef.current?.polisher?.destroy?.();
      dich.innerHTML = '';
      const previewer = new Previewer() as unknown as PagedPreviewer;
      previewerRef.current = previewer;
      // Dàn trong khung KHÔNG zoom rồi mới chuyển sang `dich` (đang mang zoom xem). paged.js trộn số đo
      // getBoundingClientRect (đã nhân zoom) với columnGap / scrollWidth (chưa nhân): zoom < ~0,97 (điện
      // thoại ≈ 0,3) là không thấy phần tràn → không ngắt trang, dòng bảng chảy sang cột ẩn của trang;
      // html2canvas vẽ dòng bị tách cột thành khối phủ kín trang (PDF mất chữ).
      const khungDan = document.createElement('div');
      khungDan.className = 'phieu-in-dich';
      khungDan.setAttribute('aria-hidden', 'true');
      Object.assign(khungDan.style, { position: 'absolute', left: '-100000px', top: '0', height: '0', overflow: 'hidden' });
      (dich.parentElement ?? document.body).appendChild(khungDan);
      try {
        await previewer.preview(html, [{ 'phieu-in.css': css }], khungDan);
      } catch (err) {
        if (import.meta.env.DEV) console.error('paged.js không chia trang được:', err);
      }
      khungDan.remove();
      if (!mountedRef.current || run !== runRef.current) return;
      dich.replaceChildren(...Array.from(khungDan.childNodes));
      const soTrang = chenLopPhu(dich, dauChim, qrDataUrl, caiDat);
      setDangChia(false);
      onXongRef.current({ soTrang: Math.max(1, soTrang), bang });
    })();
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      previewerRef.current?.polisher?.destroy?.();
    };
  }, []);

  return (
    <>
      <div
        ref={nguonRef}
        aria-hidden
        className="phieu-in-nguon bg-white text-gray-900"
        style={{ position: 'absolute', left: -10000, top: 0, width: `${rongNoiDung}mm`, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      >
        {children}
      </div>
      {dangChia ? <div className="phieu-in-dang-chia print:hidden">{t('common.phieuIn.dangDanTrang')}</div> : null}
    </>
  );
}
