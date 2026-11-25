import { describe, expect, it } from 'vitest';
import {
  khoangApDung,
  mucTieuKpiTheoNgay,
  tinhLaiDongKpiPreset,
  type KpiMucTieuCaiDatRow,
} from './kpi-muc-tieu-cai-dat';
import { BCSC_MUC_THUONG_NGAY } from './kpi-thuong-cong-thuc';

const rows: KpiMucTieuCaiDatRow[] = [
  { id_chi_nhanh: 1, ap_dung_tu: '2026-11-20', muc_tieu_nang_suat: '3.2', muc_tieu_loi: '1.5' },
  { id_chi_nhanh: 1, ap_dung_tu: '2026-11-01', muc_tieu_nang_suat: 3.5, muc_tieu_loi: 1 },
  { id_chi_nhanh: 2, ap_dung_tu: '2026-10-01', muc_tieu_nang_suat: 4, muc_tieu_loi: null },
];

describe('mucTieuKpiTheoNgay', () => {
  it('trước mốc đầu → null', () => {
    expect(mucTieuKpiTheoNgay(rows, 1, '2026-10-31')).toBeNull();
  });
  it('đúng mốc và giữa hai mốc lấy bản gần nhất ≤ ngày', () => {
    expect(mucTieuKpiTheoNgay(rows, 1, '2026-11-01')).toEqual({ nangSuat: 3.5, loi: 1, apDungTu: '2026-11-01' });
    expect(mucTieuKpiTheoNgay(rows, '1', '2026-11-19')?.nangSuat).toBe(3.5);
    expect(mucTieuKpiTheoNgay(rows, 1, '2026-11-25')).toEqual({ nangSuat: 3.2, loi: 1.5, apDungTu: '2026-11-20' });
  });
  it('không lẫn farm khác; cột không cài = null', () => {
    expect(mucTieuKpiTheoNgay(rows, 2, '2026-11-25')).toEqual({ nangSuat: 4, loi: null, apDungTu: '2026-10-01' });
    expect(mucTieuKpiTheoNgay(rows, 3, '2026-11-25')).toBeNull();
    expect(mucTieuKpiTheoNgay(rows, '', '2026-11-25')).toBeNull();
  });
});

describe('khoangApDung', () => {
  it('đến trước mốc kế tiếp của farm', () => {
    expect(khoangApDung(rows, 1, '2026-11-01')).toEqual({ tu: '2026-11-01', denTruoc: '2026-11-20' });
    expect(khoangApDung(rows, 1, '2026-11-10')).toEqual({ tu: '2026-11-10', denTruoc: '2026-11-20' });
    expect(khoangApDung(rows, 1, '2026-11-20')).toEqual({ tu: '2026-11-20', denTruoc: null });
    expect(khoangApDung(rows, 2, '2026-09-01')).toEqual({ tu: '2026-09-01', denTruoc: '2026-10-01' });
  });
});

describe('tinhLaiDongKpiPreset', () => {
  const ns = { ten_hang_muc: 'Năng suất sơ chế', thuc_te: '3.2', danh_gia: 'Không đạt' };
  const loi = { ten_hang_muc: 'Tỷ lệ nải chuỗi lỗi', thuc_te: '0.8', danh_gia: 'Không đạt' };

  it('năng suất: thực tế ≥ mục tiêu → Đạt, thưởng đủ mức', () => {
    const r = tinhLaiDongKpiPreset(ns, 0, 3.2)!;
    expect(r.muc_tieu).toBe('3.2');
    expect(r.phan_tram).toBe(100);
    expect(r.danh_gia).toBe('Đạt');
    expect(r.thuong_ql).toBe(BCSC_MUC_THUONG_NGAY.ql.nangSuat);
  });
  it('năng suất dưới ngưỡng 90% → Không đạt, thưởng 0', () => {
    const r = tinhLaiDongKpiPreset({ ...ns, thuc_te: '2.7621' }, 0, 3.5)!;
    expect(r.danh_gia).toBe('Không đạt');
    expect(r.thuong_ql).toBe(0);
    expect(r.thuong_nhom_tia).toBe(0);
  });
  it('lỗi càng thấp càng tốt: thực tế ≤ mục tiêu → Đạt, tỉa không có thưởng lỗi', () => {
    const r = tinhLaiDongKpiPreset(loi, 1, 1)!;
    expect(r.danh_gia).toBe('Đạt');
    expect(r.phan_tram).toBe(100);
    expect(r.thuong_ql).toBe(BCSC_MUC_THUONG_NGAY.ql.loi);
    expect(r.thuong_nhom_tia).toBe(0);
    expect(r.thuong_nhom_cp).toBe(BCSC_MUC_THUONG_NGAY.cp.loi);
  });
  it('thiếu thực tế → thưởng 0, giữ đánh giá cũ, vẫn ghi mục tiêu mới', () => {
    const r = tinhLaiDongKpiPreset({ ...loi, thuc_te: null }, 1, 1.5)!;
    expect(r.muc_tieu).toBe('1.5');
    expect(r.phan_tram).toBeNull();
    expect(r.danh_gia).toBe('Không đạt');
    expect(r.thuong_ql).toBe(0);
  });
  it('không đụng: mục tiêu null, dòng ngoài preset, tên không khớp', () => {
    expect(tinhLaiDongKpiPreset(ns, 0, null)).toBeNull();
    expect(tinhLaiDongKpiPreset({ ...ns, ten_hang_muc: 'Tỷ lệ thu hồi' }, 2, 3)).toBeNull();
    expect(tinhLaiDongKpiPreset({ ...ns, ten_hang_muc: 'Hạng mục khác' }, 0, 3)).toBeNull();
  });
});
