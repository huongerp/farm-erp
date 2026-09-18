import { describe, it, expect } from 'vitest';
import {
  timCaiDat,
  trongGioYenLang,
  nenGuiPush,
  nenVaoChuong,
  MAC_DINH_TUY_CHON,
  type CaiDatNgoaiLe,
  type NguCanhQuyetDinh,
} from './nen-gui-push.ts';

const MODULE = 'kho-van/phieu-kho';

describe('timCaiDat — không có dòng nghĩa là bật', () => {
  it('chưa cấu hình gì thì bật cả chuông lẫn push', () => {
    expect(timCaiDat([], MODULE, 'phieu.cho_duyet')).toEqual({ trongApp: true, push: true });
  });

  it('dòng * áp cho cả module', () => {
    const ngoaiLe: CaiDatNgoaiLe[] = [{ moduleId: MODULE, loaiSuKien: '*', trongApp: true, push: false }];
    expect(timCaiDat(ngoaiLe, MODULE, 'phieu.cho_duyet')).toEqual({ trongApp: true, push: false });
  });

  it('dòng theo đúng loại sự kiện thắng dòng *', () => {
    const ngoaiLe: CaiDatNgoaiLe[] = [
      { moduleId: MODULE, loaiSuKien: '*', trongApp: false, push: false },
      { moduleId: MODULE, loaiSuKien: 'phieu.khong_duyet', trongApp: true, push: true },
    ];
    expect(timCaiDat(ngoaiLe, MODULE, 'phieu.khong_duyet')).toEqual({ trongApp: true, push: true });
    expect(timCaiDat(ngoaiLe, MODULE, 'phieu.da_duyet')).toEqual({ trongApp: false, push: false });
  });

  it('ngoại lệ của module khác không ảnh hưởng', () => {
    const ngoaiLe: CaiDatNgoaiLe[] = [
      { moduleId: 'hanh-chinh/cong-viec', loaiSuKien: '*', trongApp: false, push: false },
    ];
    expect(timCaiDat(ngoaiLe, MODULE, 'phieu.cho_duyet')).toEqual({ trongApp: true, push: true });
  });
});

describe('trongGioYenLang', () => {
  it('khoảng vắt qua nửa đêm 21h–6h', () => {
    expect(trongGioYenLang(22, 21, 6)).toBe(true);
    expect(trongGioYenLang(0, 21, 6)).toBe(true);
    expect(trongGioYenLang(5, 21, 6)).toBe(true);
    expect(trongGioYenLang(6, 21, 6)).toBe(false);
    expect(trongGioYenLang(20, 21, 6)).toBe(false);
    expect(trongGioYenLang(21, 21, 6)).toBe(true);
  });

  it('khoảng trong ngày 12h–14h', () => {
    expect(trongGioYenLang(13, 12, 14)).toBe(true);
    expect(trongGioYenLang(14, 12, 14)).toBe(false);
    expect(trongGioYenLang(11, 12, 14)).toBe(false);
  });

  it('hai mốc bằng nhau là khoảng rỗng', () => {
    expect(trongGioYenLang(9, 8, 8)).toBe(false);
  });
});

function nc(p: Partial<NguCanhQuyetDinh> = {}): NguCanhQuyetDinh {
  return {
    muc: 'thuong',
    imLang: false,
    caiDat: { trongApp: true, push: true },
    tuyChon: MAC_DINH_TUY_CHON,
    gioHienTai: 10,
    ...p,
  };
}

describe('nenGuiPush', () => {
  it('mặc định trong giờ làm thì gửi', () => {
    expect(nenGuiPush(nc())).toBe(true);
  });

  it('tắt chuông thì tắt luôn push', () => {
    expect(nenGuiPush(nc({ caiDat: { trongApp: false, push: true } }))).toBe(false);
  });

  it('tắt riêng push thì chuông vẫn chạy', () => {
    const ngu = nc({ caiDat: { trongApp: true, push: false } });
    expect(nenGuiPush(ngu)).toBe(false);
    expect(nenVaoChuong(ngu)).toBe(true);
  });

  it('công tắc tổng tắt thì không push module nào', () => {
    expect(nenGuiPush(nc({ tuyChon: { ...MAC_DINH_TUY_CHON, pushBat: false } }))).toBe(false);
  });

  it('người nhận im lặng thì vào chuông nhưng không rung', () => {
    const ngu = nc({ imLang: true });
    expect(nenGuiPush(ngu)).toBe(false);
    expect(nenVaoChuong(ngu)).toBe(true);
  });

  it('trong giờ yên lặng thì không rung, kể cả sự kiện mức cao', () => {
    expect(nenGuiPush(nc({ gioHienTai: 23 }))).toBe(false);
    expect(nenGuiPush(nc({ gioHienTai: 23, muc: 'cao' }))).toBe(false);
  });

  it('tắt giờ yên lặng thì nửa đêm vẫn rung', () => {
    expect(
      nenGuiPush(nc({ gioHienTai: 23, tuyChon: { ...MAC_DINH_TUY_CHON, gioYenLangBat: false } }))
    ).toBe(true);
  });
});
