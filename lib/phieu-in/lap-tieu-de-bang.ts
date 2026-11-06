/**
 * Handler paged.js: bảng bị tách sang trang sau thì chép lại `<colgroup>` + `<thead>` của bảng
 * gốc lên đầu mảnh mới. paged.js 0.4 không tự làm việc này.
 *  - `afterPageLayout`: ghi lại các bảng đang bị cắt ở điểm ngắt trang (theo `data-ref`); điểm
 *    ngắt rơi vào giữa `thead` thì dời xuống ngay sau thead (không để tiêu đề mồ côi).
 *  - `layout`: khi dựng trang kế, chèn bản sao thead (gắn `data-in-lap`) vào mảnh bảng.
 * `data-in-lap` để cài đặt «Lặp tiêu đề bảng» tắt được bằng CSS. Áp cho cả bảng ngoài
 * `data-in-co-dinh` (KhungPhieu `lapDauTrang` dùng thead của nó để lặp đầu phiếu).
 */

interface BreakToken {
  node: Node;
}
interface ChunkerLike {
  source: HTMLElement;
}

function toTien(node: Node | null, ten: string): Element[] {
  const ds: Element[] = [];
  let p: Node | null = node;
  while (p) {
    if (p instanceof Element && p.tagName === ten) ds.push(p);
    p = p.parentNode;
  }
  return ds;
}

function nutSau(node: Node, gioiHan: Node): Node | null {
  if (node === gioiHan) return null;
  if (node.nextSibling) return node.nextSibling;
  let p = node.parentNode;
  while (p && p !== gioiHan) {
    if (p.nextSibling) return p.nextSibling;
    p = p.parentNode;
  }
  return null;
}

let daDangKy: Promise<void> | null = null;

/** Đăng ký một lần cho cả app (paged.js giữ danh sách handler toàn cục). */
export function dangKyLapTieuDeBang(): Promise<void> {
  daDangKy ??= (async () => {
    const { Handler, registerHandlers } = await import('pagedjs');

    class LapTieuDeBang extends Handler {
      private bangBiTach: string[] = [];
      private chunkerRef: ChunkerLike | null = null;

      afterPageLayout(_trang: HTMLElement, _page: unknown, breakToken: BreakToken | undefined, chunker: ChunkerLike) {
        this.chunkerRef = chunker;
        this.bangBiTach = [];
        if (!breakToken?.node) return;
        const node = breakToken.node;
        this.bangBiTach = toTien(node, 'TABLE')
          .map((t) => (t as HTMLElement).dataset.ref ?? '')
          .filter(Boolean);
        const thead = toTien(node, 'THEAD')[0];
        if (thead) {
          const sau = nutSau(thead.lastChild ?? thead, chunker.source);
          if (sau) breakToken.node = sau;
        }
      }

      layout(rendered: HTMLElement) {
        const nguon = this.chunkerRef?.source;
        if (!nguon) return;
        for (const ref of this.bangBiTach) {
          const bang = rendered.querySelector<HTMLTableElement>(`table[data-ref='${ref}']`);
          if (!bang || bang.hasAttribute('data-in-da-lap')) continue;
          const goc = nguon.querySelector<HTMLTableElement>(`table[data-ref='${ref}']`);
          if (!goc) continue;
          const cg = goc.querySelector(':scope > colgroup');
          if (cg && !bang.querySelector(':scope > colgroup')) bang.insertBefore(cg.cloneNode(true), bang.firstChild);
          const th = goc.querySelector(':scope > thead');
          if (th && !bang.querySelector(':scope > thead')) {
            const banSao = th.cloneNode(true) as HTMLElement;
            banSao.setAttribute('data-in-lap', '');
            bang.insertBefore(banSao, bang.querySelector(':scope > tbody, :scope > tfoot'));
          }
          bang.setAttribute('data-in-da-lap', '');
        }
      }
    }

    registerHandlers(LapTieuDeBang);
  })();
  return daDangKy;
}
