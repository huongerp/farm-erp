/**
 * Kéo đổi bề rộng cột cho MỌI bảng trong phiếu in mà không phải sửa từng mẫu: hook soi DOM
 * của tờ giấy, tìm `table` (bỏ qua `data-in-co-dinh`), tính mép cột (kể cả tiêu đề nhiều tầng
 * rowSpan/colSpan) và trả vị trí tay kéo để khung in vẽ ở lớp phủ riêng — không chèn phần tử
 * vào bảng do React quản lý, trừ `<colgroup data-phieu-in>` khi bảng đã có bề rộng lưu.
 *
 * Bảng chưa ai chỉnh thì giữ nguyên bố cục gốc của mẫu (không gắn colgroup, không fixed).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { dungLuoiBang, keoCot, laMangCotHopLe, sangPhanTram, type OSpan } from '../../../lib/phieu-in/cai-dat-in';

const CHON_BANG = 'table:not([data-in-co-dinh])';
const ATTR_CG = 'data-phieu-in';

export interface TayKeo {
  key: string;
  bang: string;
  /** Mép phải của cột lá thứ i. */
  i: number;
  left: number;
  top: number;
  height: number;
  /** Bề rộng cột i (% bảng) — giá trị của slider cho trình đọc màn hình. */
  rongPct: number;
}

function hangTieuDe(table: HTMLTableElement): HTMLTableRowElement[] {
  if (table.tHead && table.tHead.rows.length > 0) return Array.from(table.tHead.rows);
  return table.rows[0] ? [table.rows[0]] : [];
}

const spanCua = (row: HTMLTableRowElement): OSpan[] =>
  Array.from(row.cells).map((c) => ({ colSpan: c.colSpan, rowSpan: c.rowSpan }));

/** Mép trái (px, toạ độ màn hình) của từng cột lá + mép phải bảng. Không đo được → nội suy. */
function doMepCot(table: HTMLTableElement): number[] | null {
  const tieuDe = hangTieuDe(table);
  if (tieuDe.length === 0) return null;
  const luoi = dungLuoiBang(tieuDe.map(spanCua));
  const thanDau = table.tBodies[0]?.rows[0];
  let soCot = luoi.soCot;
  const nguon: { cell: HTMLTableCellElement; cotDau: number }[] = luoi.o.map((o) => ({
    cell: tieuDe[o.hang].cells[o.o],
    cotDau: o.cotDau,
  }));
  if (thanDau && !tieuDe.includes(thanDau)) {
    const l = dungLuoiBang([spanCua(thanDau)]);
    soCot = Math.max(soCot, l.soCot);
    l.o.forEach((o) => nguon.push({ cell: thanDau.cells[o.o], cotDau: o.cotDau }));
  }
  if (soCot < 2) return null;
  const rect = table.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const mep: (number | null)[] = Array.from({ length: soCot + 1 }, () => null);
  mep[0] = rect.left;
  mep[soCot] = rect.right;
  for (const { cell, cotDau } of nguon) {
    if (cotDau > 0 && mep[cotDau] == null) mep[cotDau] = cell.getBoundingClientRect().left;
  }
  // Nội suy mép chưa đo được giữa hai mép đã biết.
  for (let i = 1; i < soCot; i++) {
    if (mep[i] != null) continue;
    let j = i + 1;
    while (mep[j] == null) j++;
    const a = mep[i - 1] as number;
    const b = mep[j] as number;
    mep[i] = a + (b - a) / (j - i + 1);
  }
  return mep as number[];
}

function colgroupRieng(table: HTMLTableElement): HTMLTableColElement | null {
  return table.querySelector<HTMLTableColElement>(`:scope > colgroup:not([${ATTR_CG}])`);
}

/** Áp bề rộng % (null = trả bố cục gốc). Bảng có colgroup riêng khác số cột thì bỏ qua. */
function apCot(table: HTMLTableElement, pct: number[] | null) {
  const rieng = colgroupRieng(table);
  let cg = table.querySelector<HTMLTableColElement>(`:scope > colgroup[${ATTR_CG}]`);
  if (pct == null) {
    cg?.remove();
    if (rieng) {
      for (const col of Array.from(rieng.children) as HTMLElement[]) {
        if (col.dataset.phieuInGoc != null) {
          col.style.width = col.dataset.phieuInGoc;
          delete col.dataset.phieuInGoc;
        }
      }
    }
    if (table.dataset.phieuInLayout != null) {
      table.style.tableLayout = table.dataset.phieuInLayout;
      delete table.dataset.phieuInLayout;
    }
    return;
  }
  let cols: HTMLElement[];
  if (rieng) {
    if (rieng.children.length !== pct.length) return;
    cols = Array.from(rieng.children) as HTMLElement[];
    cols.forEach((c) => {
      if (c.dataset.phieuInGoc == null) c.dataset.phieuInGoc = c.style.width;
    });
  } else {
    if (!cg) {
      cg = document.createElement('colgroup') as unknown as HTMLTableColElement;
      cg.setAttribute(ATTR_CG, '');
      table.insertBefore(cg, table.firstChild);
    }
    while (cg.children.length < pct.length) cg.appendChild(document.createElement('col'));
    while (cg.children.length > pct.length) cg.lastElementChild?.remove();
    cols = Array.from(cg.children) as HTMLElement[];
  }
  pct.forEach((w, i) => {
    const v = `${w}%`;
    if (cols[i].style.width !== v) cols[i].style.width = v;
  });
  if (table.dataset.phieuInLayout == null) table.dataset.phieuInLayout = table.style.tableLayout;
  if (table.style.tableLayout !== 'fixed') table.style.tableLayout = 'fixed';
}

interface Opts {
  /** Lớp chứa nội dung phiếu (lớp zoom). */
  rootRef: React.RefObject<HTMLElement | null>;
  /** Lớp phủ để đặt tay kéo (toạ độ tính theo nó). */
  khungRef: React.RefObject<HTMLElement | null>;
  cot: Record<string, number[]>;
  onDoi: (bang: string, rong: number[]) => void;
  onDatLai: (bang: string) => void;
  /** Đổi khi khổ / hướng / cỡ chữ đổi → đo lại. */
  phuThuoc: unknown;
}

export function useKeoCotBangIn({ rootRef, khungRef, cot, onDoi, onDatLai, phuThuoc }: Opts) {
  const [tayKeo, setTayKeo] = useState<TayKeo[]>([]);
  const cotRef = useRef(cot);
  const dangKeo = useRef(false);
  const raf = useRef<number | null>(null);

  const bangs = useCallback(
    () => Array.from(rootRef.current?.querySelectorAll<HTMLTableElement>(CHON_BANG) ?? []),
    [rootRef]
  );

  const capNhat = useCallback(() => {
    raf.current = null;
    const khung = khungRef.current;
    if (!khung) return;
    const goc = khung.getBoundingClientRect();
    const out: TayKeo[] = [];
    bangs().forEach((table, idx) => {
      const bang = String(idx);
      const luu = cotRef.current[bang];
      if (!dangKeo.current) apCot(table, laMangCotHopLe(luu) ? luu : null);
      const mep = doMepCot(table);
      if (!mep) return;
      // Bề rộng đã lưu nhưng khác số cột (mẫu đổi) → không áp.
      if (luu && luu.length !== mep.length - 1) apCot(table, null);
      const tRect = table.getBoundingClientRect();
      const tieuDe = hangTieuDe(table);
      const day = tieuDe[tieuDe.length - 1]?.getBoundingClientRect().bottom ?? tRect.bottom;
      const tong = mep[mep.length - 1] - mep[0];
      for (let i = 1; i < mep.length - 1; i++) {
        out.push({
          rongPct: Math.round(((mep[i] - mep[i - 1]) / tong) * 100),
          key: `${bang}-${i}`,
          bang,
          i: i - 1,
          left: mep[i] - goc.left,
          top: tRect.top - goc.top,
          height: Math.max(12, day - tRect.top),
        });
      }
    });
    setTayKeo(out);
  }, [bangs, khungRef]);

  const henCapNhat = useCallback(() => {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(capNhat);
  }, [capNhat]);

  // Bề rộng lưu đổi (kéo xong / đặt lại) hoặc khổ giấy, cỡ chữ đổi → áp + đo lại.
  useLayoutEffect(() => {
    cotRef.current = cot;
    // Đo + áp colgroup ngay trước khi vẽ để không nháy bố cục cũ một khung hình.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    capNhat();
  }, [capNhat, cot, phuThuoc]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mo = new MutationObserver(henCapNhat);
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(henCapNhat);
    ro.observe(root);
    window.addEventListener('resize', henCapNhat);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', henCapNhat);
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    // phuThuoc: khung in hiện tờ giấy sau khi tải xong → ref mới gắn, phải nối lại observer.
  }, [rootRef, henCapNhat, phuThuoc]);

  const batDauKeo = useCallback(
    (e: React.PointerEvent<HTMLElement>, tk: TayKeo) => {
      const table = bangs()[Number(tk.bang)];
      if (!table) return;
      const mep = doMepCot(table);
      if (!mep) return;
      e.preventDefault();
      e.stopPropagation();
      const luu = cotRef.current[tk.bang];
      const dau = laMangCotHopLe(luu) && luu.length === mep.length - 1 ? luu : sangPhanTram(mep.slice(1).map((x, i) => x - mep[i]));
      const rongBang = table.getBoundingClientRect().width;
      const x0 = e.clientX;
      let hienTai = dau;
      let khung: number | null = null;
      dangKeo.current = true;
      apCot(table, dau);

      const onMove = (ev: PointerEvent) => {
        hienTai = keoCot(dau, tk.i, ((ev.clientX - x0) / rongBang) * 100);
        if (khung != null) return;
        khung = requestAnimationFrame(() => {
          khung = null;
          apCot(table, hienTai);
          dangKeo.current = true;
          capNhat();
        });
      };
      const stop = () => {
        if (khung != null) cancelAnimationFrame(khung);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', stop);
        document.removeEventListener('pointercancel', stop);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        dangKeo.current = false;
        onDoi(tk.bang, hienTai);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', stop);
      document.addEventListener('pointercancel', stop);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [bangs, capNhat, onDoi]
  );

  /** ←/→ trên tay kéo đang focus: đổi 1% (Shift: 5%). */
  const keoBangPhim = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, tk: TayKeo) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const table = bangs()[Number(tk.bang)];
      const mep = table ? doMepCot(table) : null;
      if (!mep) return;
      e.preventDefault();
      const luu = cotRef.current[tk.bang];
      const dau = laMangCotHopLe(luu) && luu.length === mep.length - 1 ? luu : sangPhanTram(mep.slice(1).map((x, i) => x - mep[i]));
      const buoc = (e.shiftKey ? 5 : 1) * (e.key === 'ArrowLeft' ? -1 : 1);
      onDoi(tk.bang, keoCot(dau, tk.i, buoc));
    },
    [bangs, onDoi]
  );

  return { tayKeo, batDauKeo, keoBangPhim, datLai: onDatLai };
}
