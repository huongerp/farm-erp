import { describe, expect, it } from 'vitest';
import {
  BIEN_THE_PHAN_THUOC,
  BIEN_THE_SO_CHE,
  bienTheTheoPath,
  khoModuleId,
  khoPreviewUrl,
  khoStorageKey,
} from './bien-the';

describe('bienTheTheoPath', () => {
  it('/phan-thuoc và trang con → phân thuốc', () => {
    expect(bienTheTheoPath('/phan-thuoc')).toBe(BIEN_THE_PHAN_THUOC);
    expect(bienTheTheoPath('/phan-thuoc/phieu-kho-phan-thuoc')).toBe(BIEN_THE_PHAN_THUOC);
    expect(bienTheTheoPath('/phan-thuoc/de-xuat-mua-hang/preview/12')).toBe(BIEN_THE_PHAN_THUOC);
  });

  it('còn lại (kể cả path chỉ bắt đầu bằng chữ "phan-thuoc") → sơ chế', () => {
    expect(bienTheTheoPath('/quan-ly-nha-so-che/phieu-kho-phan-thuoc')).toBe(BIEN_THE_SO_CHE);
    expect(bienTheTheoPath('/phan-thuoc-cu')).toBe(BIEN_THE_SO_CHE);
    expect(bienTheTheoPath('/')).toBe(BIEN_THE_SO_CHE);
  });
});

describe('module_id / đường dẫn', () => {
  it('module_id theo submenu — khớp fp_var_phan_quyen và trigger thông báo', () => {
    expect(khoModuleId(BIEN_THE_SO_CHE, 'phieu-kho-phan-thuoc')).toBe('quan-ly-nha-so-che/phieu-kho-phan-thuoc');
    expect(khoModuleId(BIEN_THE_PHAN_THUOC, 'de-xuat-mua-hang')).toBe('phan-thuoc/de-xuat-mua-hang');
  });

  it('preview url', () => {
    expect(khoPreviewUrl(BIEN_THE_PHAN_THUOC, 'kiem-ke-kho-phan-thuoc', 5)).toBe(
      '/phan-thuoc/kiem-ke-kho-phan-thuoc/preview/5'
    );
  });

  it('sơ chế giữ khoá localStorage cũ, phân thuốc tách khoá riêng', () => {
    expect(khoStorageKey(BIEN_THE_SO_CHE, 'table-kiem-ke-kho-pt')).toBe('table-kiem-ke-kho-pt');
    expect(khoStorageKey(BIEN_THE_PHAN_THUOC, 'table-kiem-ke-kho-pt')).toBe('table-pt-kiem-ke-kho-pt');
  });
});

describe('hai biến thể không dùng chung bảng', () => {
  const ten = (bt: typeof BIEN_THE_SO_CHE) => [
    ...Object.values(bt.bang),
    ...Object.values(bt.view),
    ...Object.values(bt.rpc),
  ];

  it('không trùng tên bảng / view / RPC nào', () => {
    const soChe = new Set(ten(BIEN_THE_SO_CHE));
    expect(ten(BIEN_THE_PHAN_THUOC).filter((t) => soChe.has(t))).toEqual([]);
  });

  it('bảng phân thuốc đều mang tiền tố fp_pt_', () => {
    expect(Object.values(BIEN_THE_PHAN_THUOC.bang).every((t) => t.startsWith('fp_pt_'))).toBe(true);
  });
});
