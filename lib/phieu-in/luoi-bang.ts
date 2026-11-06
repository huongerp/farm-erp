/**
 * Chuẩn bị bảng trong BẢN SAO nội dung trước khi paged.js chia trang (chạy trên DOM):
 *  - đánh số `data-in-bang="i"` (bỏ bảng `data-in-co-dinh` và bảng lồng trong bảng dữ liệu khác;
 *    bảng nằm trong bảng bố cục `data-in-co-dinh` — vd KhungPhieu `lapDauTrang` — vẫn được đánh số);
 *  - gắn `data-in-o="k"` cho mọi ô KHÔNG gộp cột, k = vị trí cột thật (`dungLuoiBang` tính
 *    rowSpan/colSpan) — ẩn cột theo đó, không theo `nth-child`;
 *  - chèn `<colgroup data-in-cot>` đủ số cột nếu bảng chưa có, để CSS độ rộng có chỗ bám;
 *  - dòng bọc cả bảng con (phiếu dùng bảng ngoài để lặp đầu trang) gắn `data-in-bao` để luật
 *    «không cắt đôi dòng» bỏ qua nó (chặn ngắt dòng đó thì không phân trang được).
 *
 * Gọi cho TỪNG liên / chứng từ: bảng i của mọi liên dùng chung cài đặt cột.
 */
import { dungLuoiBang } from './cai-dat-in';

export interface ThongTinBang {
  chiSo: number;
  soCot: number;
  /** Nhãn tiêu đề từng cột (rỗng nếu bảng không có thead một hàng). */
  tieuDe: string[];
  /** Ẩn cột chỉ cho bảng có MỘT hàng tiêu đề, không gộp cột. */
  choAnCot: boolean;
}

export function chuanBiBangNguon(goc: HTMLElement): ThongTinBang[] {
  goc.querySelectorAll('tr').forEach((tr) => {
    if (tr.querySelector('table')) tr.setAttribute('data-in-bao', '');
  });
  const ketQua: ThongTinBang[] = [];
  const bangs = Array.from(goc.querySelectorAll<HTMLTableElement>('table')).filter(
    (t) => !t.hasAttribute('data-in-co-dinh') && !t.parentElement?.closest('table:not([data-in-co-dinh])')
  );
  bangs.forEach((bang, chiSo) => {
    bang.setAttribute('data-in-bang', String(chiSo));
    const rows = Array.from(bang.rows);
    const cells = rows.map((tr) => Array.from(tr.cells));
    const { soCot, o } = dungLuoiBang(cells.map((r) => r.map((td) => ({ colSpan: td.colSpan, rowSpan: td.rowSpan }))));
    if (soCot < 2) return;
    for (const v of o) if (v.soCot === 1) cells[v.hang][v.o].setAttribute('data-in-o', String(v.cotDau));
    let cg = bang.querySelector<HTMLTableColElement>(':scope > colgroup');
    if (!cg) {
      cg = bang.ownerDocument.createElement('colgroup');
      for (let k = 0; k < soCot; k++) cg.appendChild(bang.ownerDocument.createElement('col'));
      bang.insertBefore(cg, bang.firstChild);
    }
    cg.setAttribute('data-in-cot', '');
    const theadRows = bang.tHead ? Array.from(bang.tHead.rows) : [];
    const motHang = theadRows.length === 1 && Array.from(theadRows[0].cells).every((td) => (td.colSpan || 1) === 1);
    ketQua.push({
      chiSo,
      soCot,
      tieuDe: motHang ? Array.from(theadRows[0].cells).map((td) => (td.textContent ?? '').trim()) : [],
      choAnCot: motHang && theadRows[0].cells.length === soCot,
    });
  });
  return ketQua;
}
