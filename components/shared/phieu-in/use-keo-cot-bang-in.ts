/**
 * Kéo độ rộng cột trên bản xem trước ĐÃ DÀN TRANG (paged.js):
 *  - Tay kéo là DOM thường gắn vào trang chứa MẢNH ĐẦU của mỗi bảng (`data-in-bang`), đặt ở mép
 *    phải từng cột đang hiện (trừ cột cuối). Class `phieu-in-tay-keo`: ẩn khi in, PDF bỏ qua.
 *  - Kéo: tính % mới bằng `keoCot`, ghi ngay một `<style>` tạm → mọi mảnh bảng ở mọi trang và mọi
 *    liên đổi theo, không dàn trang lại giữa chừng. Nhả chuột: lưu cài đặt → khung dàn lại.
 *  - Phím ←/→ ±1% (Shift ±5%), bấm đúp: về độ rộng của mẫu.
 */
import { useEffect, useRef } from 'react';
import type { CaiDatIn } from '../../../lib/phieu-in/cai-dat-in';
import { chuanHoaPhanTram, cssCotBang, keoCot } from '../../../lib/phieu-in/cot-bang';
import type { ThongTinBang } from '../../../lib/phieu-in/luoi-bang';

interface Tham {
  dichRef: React.RefObject<HTMLDivElement | null>;
  /** Đổi mỗi lần dàn trang xong — gắn lại tay kéo. */
  phienDan: number;
  bang: ThongTinBang[];
  caiDat: CaiDatIn;
  zoom: number;
  batTat: boolean;
  nhan: string;
  doi: (sua: (c: CaiDatIn) => CaiDatIn) => void;
}

const ID_STYLE_TAM = 'phieu-in-keo-cot-tam';

/** % độ rộng hiện tại của từng cột, đo từ ô đầu tiên mang `data-in-o="k"`. */
function doPhanTram(bang: HTMLTableElement, soCot: number): number[] {
  const tong = bang.getBoundingClientRect().width || 1;
  const ds: number[] = [];
  for (let k = 0; k < soCot; k++) {
    const o = bang.querySelector<HTMLElement>(`[data-in-o="${k}"]`);
    ds.push(o && o.offsetParent ? (o.getBoundingClientRect().width / tong) * 100 : 0);
  }
  return chuanHoaPhanTram(ds);
}

function ghiStyleTam(css: string) {
  let el = document.getElementById(ID_STYLE_TAM) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = ID_STYLE_TAM;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

export function useKeoCotBangIn({ dichRef, phienDan, bang, caiDat, zoom, batTat, nhan, doi }: Tham) {
  const caiDatRef = useRef(caiDat);
  useEffect(() => {
    caiDatRef.current = caiDat;
  }, [caiDat]);

  useEffect(() => {
    const dich = dichRef.current;
    if (!dich) return;
    dich.querySelectorAll('.phieu-in-tay-keo').forEach((el) => el.remove());
    document.getElementById(ID_STYLE_TAM)?.remove();
    if (!batTat) return;

    const donDep: Array<() => void> = [];
    for (const tt of bang) {
      const b = String(tt.chiSo);
      const manh = dich.querySelector<HTMLTableElement>(`table[data-in-bang="${b}"]`);
      const trang = manh?.closest<HTMLElement>('.pagedjs_page');
      if (!manh || !trang) continue;
      const an = caiDatRef.current.anCot[b] ?? [];
      const rTrang = trang.getBoundingClientRect();
      const rBang = manh.getBoundingClientRect();
      const hien = Array.from({ length: tt.soCot }, (_, k) => k).filter((k) => !an.includes(k));

      hien.slice(0, -1).forEach((k) => {
        const o = manh.querySelector<HTMLElement>(`[data-in-o="${k}"]`);
        if (!o) return;
        const rO = o.getBoundingClientRect();
        const tay = document.createElement('div');
        tay.className = 'phieu-in-tay-keo';
        tay.setAttribute('role', 'slider');
        tay.setAttribute('aria-label', `${nhan} ${k + 1}`);
        tay.title = nhan;
        tay.tabIndex = 0;
        Object.assign(tay.style, {
          left: `${(rO.right - rTrang.left) / zoom - 4}px`,
          top: `${(rBang.top - rTrang.top) / zoom}px`,
          height: `${rBang.height / zoom}px`,
        });

        const phanTramGoc = () => caiDatRef.current.cot[b] ?? doPhanTram(manh, tt.soCot);
        const luu = (pct: number[]) => doi((c) => ({ ...c, cot: { ...c.cot, [b]: pct } }));

        const onDown = (e: PointerEvent) => {
          e.preventDefault();
          tay.setPointerCapture(e.pointerId);
          const x0 = e.clientX;
          const goc = phanTramGoc();
          let moi = goc;
          let raf = 0;
          const onMove = (ev: PointerEvent) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              const delta = ((ev.clientX - x0) / (rBang.width || 1)) * 100;
              moi = keoCot(goc, k, delta, an);
              ghiStyleTam(cssCotBang({ [b]: moi }, { [b]: an }));
            });
          };
          const onUp = () => {
            cancelAnimationFrame(raf);
            tay.removeEventListener('pointermove', onMove);
            tay.removeEventListener('pointerup', onUp);
            tay.removeEventListener('pointercancel', onUp);
            if (moi !== goc) luu(moi);
          };
          tay.addEventListener('pointermove', onMove);
          tay.addEventListener('pointerup', onUp);
          tay.addEventListener('pointercancel', onUp);
        };
        const onKey = (e: KeyboardEvent) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          const buoc = (e.shiftKey ? 5 : 1) * (e.key === 'ArrowLeft' ? -1 : 1);
          luu(keoCot(phanTramGoc(), k, buoc, an));
        };
        const onDbl = () =>
          doi((c) => {
            const cot = { ...c.cot };
            delete cot[b];
            return { ...c, cot };
          });
        tay.addEventListener('pointerdown', onDown);
        tay.addEventListener('keydown', onKey);
        tay.addEventListener('dblclick', onDbl);
        trang.appendChild(tay);
        donDep.push(() => tay.remove());
      });
    }
    return () => donDep.forEach((f) => f());
  }, [dichRef, phienDan, bang, zoom, batTat, nhan, doi]);
}
