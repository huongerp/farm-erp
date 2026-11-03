import { describe, expect, it } from 'vitest';
import i18n from '../../../../lib/i18n';
import vi from '../locales/vi.json';
import { applySubTotalsToChiTietForm, defaultFormValues, farmBaoCaoNhanCongToFormNextDay } from './form-mappers';
import { nvFormRowMoi, tongHopNgoaiLe, nhomNhanVienTheoChuyen } from './danh-sach-nv';
import { baoCaoNhanCongFormSchema } from './schema';
import type { FarmBaoCaoNhanCong } from './types';

i18n.addResourceBundle('vi', 'translation', vi, true, true);
const nguoi = () => ({ ...nvFormRowMoi(undefined, new Date(2026, 10, 3, 13)), ho_ten: 'An', vi_tri: 'Tỉa lá tại farm' });
const values = () => ({ ...defaultFormValues(), id_chi_nhanh: '1' });

describe('Ngoại lệ trong báo cáo nhân công', () => {
  it('giữ chấm công và vị trí nhưng xoá mọi giờ, tăng ca và số tổng nhập sót', () => {
    const v = values();
    v.chi_tiet[6] = { ...v.chi_tiet[6], nhan_vien: [{ ...nguoi(), so_gio_tc: 2 }], sl_cong_ngay: 12, sub: v.chi_tiet[0].sub };
    const ct = applySubTotalsToChiTietForm(v.chi_tiet)[6];
    expect(ct).toMatchObject({ sl_cong_ngay: 0, sl_cong_nua: 0, sl_tang_ca: 0, so_gio_tc: 0, sub: { CN_NGAY: [], CN_NUA: [], TANG_CA: [] } });
    expect(ct.nhan_vien[0]).toMatchObject({ vi_tri: 'Tỉa lá tại farm', cham_cong: 'CA_NGAY', so_gio_cong: 0, so_gio_tc: 0 });
    expect(tongHopNgoaiLe([...ct.nhan_vien, { ...nguoi(), ho_ten: 'Bình', cham_cong: 'SANG' }, { ...nguoi(), ho_ten: 'Cúc', cham_cong: 'NGHI' }])).toEqual({ soNguoi: 3, sang: 2, chieu: 1, cong: 1.5 });
  });

  it('cho chấm Ngoại lệ 0 giờ, yêu cầu khâu làm việc và vẫn chặn trùng buổi với chuyền', () => {
    const v = values();
    v.chi_tiet[0].nhan_vien = [{ ...nguoi(), cham_cong: 'SANG', so_gio_cong: 3.75 }];
    v.chi_tiet[6].nhan_vien = [{ ...nguoi(), cham_cong: 'CHIEU', so_gio_cong: 0 }];
    expect(baoCaoNhanCongFormSchema.safeParse(v).success).toBe(true);
    v.chi_tiet[6].nhan_vien[0].cham_cong = 'SANG';
    expect(baoCaoNhanCongFormSchema.safeParse(v).success).toBe(false);
    v.chi_tiet[6].nhan_vien[0].cham_cong = 'CHIEU';
    v.chi_tiet[6].nhan_vien[0].vi_tri = '';
    expect(baoCaoNhanCongFormSchema.safeParse(v).success).toBe(false);
  });

  it('giữ nhóm Ngoại lệ trên danh sách in và khi sao chép sang ngày kế', () => {
    const v = values();
    v.chi_tiet[6].nhan_vien = [nguoi()];
    const phieu: FarmBaoCaoNhanCong = {
      id: '1', ngay: v.ngay, id_chi_nhanh: '1', ten_chi_nhanh: 'FP1', ghi_chu: null, hinh_anh_urls: [],
      id_nguoi_tao: null, ten_nguoi_tao: null, trang_thai: 'mo', tg_tao: '', tg_cap_nhat: '',
      chi_tiet: v.chi_tiet.map((ct, i) => ({ ...ct, ghi_chu: ct.ghi_chu ?? null, id: String(i), id_bao_cao: '1', thu_tu: i + 1,
        nhan_vien: ct.nhan_vien.map((nv) => ({ ...nv, id: 'nv1', id_bcnc_ct: String(i), id_nhan_vien: null, thu_tu: 1 })),
      })),
    };
    expect(nhomNhanVienTheoChuyen(phieu)).toMatchObject([{ tt: 'VI', ct: { loai_chuyen: 'NGOAI_LE' }, nhanVien: [{ ho_ten: 'An' }] }]);
    expect(farmBaoCaoNhanCongToFormNextDay(phieu).chi_tiet[6].nhan_vien[0]).toMatchObject({ ho_ten: 'An', vi_tri: 'Tỉa lá tại farm', so_gio_cong: 0, so_gio_tc: 0 });
  });
});
