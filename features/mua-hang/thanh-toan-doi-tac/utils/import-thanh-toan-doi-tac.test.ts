import { describe, it, expect } from 'vitest';
import {
  buildThanhToanDoiTacImportPlan,
  loaiDongTrungSoPhieuDb,
  type ImportPlanInput,
} from './import-thanh-toan-doi-tac';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';

const input: ImportPlanInput = {
  chiNhanh: [
    { id: '5', ma: 'FA', ten: 'Farm A' },
    { id: '6', ma: 'FB', ten: 'Farm B' },
  ],
  nhom: [
    { id: '1', ma: 'VT', ten: 'Vật tư' },
    { id: '2', ma: 'DV', ten: 'Dịch vụ' },
  ],
  doiTac: [
    { id: '10', ma: 'NCC1', ten: 'Công ty Xanh', idNhom: '1' },
    { id: '11', ma: 'NCC2', ten: 'Trùng Tên', idNhom: '1' },
    { id: '12', ma: 'NCC3', ten: 'Trùng Tên', idNhom: '2' },
  ],
  trangThai: [
    { id: '7', ma: 'CHO', ten: 'Chờ thanh toán' },
    { id: '8', ma: 'DA', ten: 'Đã thanh toán' },
  ],
  defaultDonViId: null,
  idTrangThaiMacDinh: '7',
  tuSinhSoPhieu: true,
};

const row = (over: Record<string, unknown> = {}, n = 2) => ({
  [IMPORT_ROW_KEY]: n,
  so_phieu: 'TTO-0001',
  ngay: '25/7/2026',
  don_vi: 'FA',
  doi_tac: 'NCC1',
  hang_muc_thanh_toan: 'Phân bón tuần 9',
  so_tien: '1.500.000',
  ...over,
});

describe('buildThanhToanDoiTacImportPlan', () => {
  it('dòng hợp lệ đủ cột → payload; số tiền "1.500.000" = 1500000, trạng thái trống lấy mặc định', () => {
    const plan = buildThanhToanDoiTacImportPlan(
      [row({ nhom_doi_tac: 'vt', noi_dung_chi_tiet: ' 15 tấn ', ngay_xu_ly: '26/7/2026', ghi_chu: 'gấp', trang_thai: 'da' })],
      input
    );
    expect(plan.errors).toEqual([]);
    expect(plan.toInsert[0].payload).toEqual({
      so_phieu: 'TTO-0001',
      hang_muc_thanh_toan: 'Phân bón tuần 9',
      noi_dung_chi_tiet: '15 tấn',
      ngay: '2026-07-25',
      id_don_vi: 5,
      id_doi_tac: 10,
      id_trang_thai_thanh_toan: 8,
      trang_thai: 'Đã thanh toán',
      so_tien: 1500000,
      ngay_xu_ly: '2026-07-26',
      ghi_chu: 'gấp',
    });
    const macDinh = buildThanhToanDoiTacImportPlan([row({ so_phieu: '' })], input).toInsert[0].payload;
    expect(macDinh).toMatchObject({ so_phieu: null, id_trang_thai_thanh_toan: 7, trang_thai: 'Chờ thanh toán', ngay_xu_ly: null });
  });

  it('ô số tiền trống → lỗi «bắt buộc», không thành 0; 0 hoặc chữ cũng lỗi', () => {
    const plan = buildThanhToanDoiTacImportPlan(
      [row({ so_tien: '' }, 2), row({ so_tien: null }, 3), row({ so_tien: 0 }, 4), row({ so_tien: 'abc' }, 5)],
      input
    );
    expect(plan.toInsert).toHaveLength(0);
    expect(plan.errors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
    expect(plan.errors[0].msg).toContain('errSoTienRequired');
    expect(plan.errors[2].msg).toContain('errSoTienZero');
    expect(plan.errors[3].msg).toContain('errSoTien');
  });

  it('tra đối tác theo mã và theo tên; nhóm sai → lỗi; tên trùng được gỡ bằng nhóm', () => {
    const plan = buildThanhToanDoiTacImportPlan(
      [
        row({ so_phieu: 'A', doi_tac: 'ncc1' }, 2),
        row({ so_phieu: 'B', doi_tac: 'công ty xanh' }, 3),
        row({ so_phieu: 'C', doi_tac: 'NCC1', nhom_doi_tac: 'Dịch vụ' }, 4),
        row({ so_phieu: 'D', doi_tac: 'Trùng Tên' }, 5),
        row({ so_phieu: 'E', doi_tac: 'Trùng Tên', nhom_doi_tac: 'DV' }, 6),
        row({ so_phieu: 'F', doi_tac: 'Không có' }, 7),
      ],
      input
    );
    expect(plan.toInsert.map((p) => [p.row, p.payload.id_doi_tac])).toEqual([[2, 10], [3, 10], [6, 12]]);
    expect(plan.errors.map((e) => e.row)).toEqual([4, 5, 7]);
    expect(plan.errors[0].msg).toContain('errDoiTacSaiNhom');
    expect(plan.errors[1].msg).toContain('errDoiTacAmbiguous');
    expect(plan.errors[2].msg).toContain('errDoiTacNotFound');
  });

  it('đơn vị ngoài phạm vi → lỗi; để trống thì lấy đơn vị mặc định, không có mặc định → lỗi', () => {
    const ngoai = buildThanhToanDoiTacImportPlan([row({ don_vi: 'FC' })], input);
    expect(ngoai.errors[0].msg).toContain('errDonViNotFound');

    const trong = row({ don_vi: '' });
    expect(buildThanhToanDoiTacImportPlan([trong], input).errors[0].msg).toContain('errDonViRequired');
    const macDinh = buildThanhToanDoiTacImportPlan([trong], { ...input, defaultDonViId: '6' });
    expect(macDinh.toInsert[0].payload.id_don_vi).toBe(6);
  });

  it('số phiếu trống khi tắt tự sinh → lỗi; trùng trong file hoặc quá 50 ký tự → lỗi', () => {
    const tat = { ...input, tuSinhSoPhieu: false };
    expect(buildThanhToanDoiTacImportPlan([row({ so_phieu: '' })], tat).errors[0].msg).toContain('errSoPhieuRequired');

    const plan = buildThanhToanDoiTacImportPlan(
      [row({}, 2), row({}, 3), row({ so_phieu: 'x'.repeat(51) }, 4)],
      input
    );
    expect(plan.toInsert.map((p) => p.row)).toEqual([2]);
    expect(plan.errors.map((e) => e.row)).toEqual([3, 4]);
    expect(plan.errors[0].msg).toContain('errSoPhieuTrungFile');
  });

  it('ngày xử lý có điền mà hỏng → lỗi; ngày thiếu / hạng mục thiếu gom chung một dòng', () => {
    expect(buildThanhToanDoiTacImportPlan([row({ ngay_xu_ly: 'xx' })], input).errors[0].msg).toContain('errNgayXuLy');
    const plan = buildThanhToanDoiTacImportPlan([row({ ngay: '', hang_muc_thanh_toan: '' })], input);
    expect(plan.errors[0].msg.split('; ')).toHaveLength(2);
    expect(plan.errors[0].values).not.toHaveProperty(IMPORT_ROW_KEY);
  });
});

describe('loaiDongTrungSoPhieuDb', () => {
  it('dòng có số phiếu đã tồn tại trong DB chuyển thành lỗi, dòng chờ sinh số giữ nguyên', () => {
    const plan = buildThanhToanDoiTacImportPlan(
      [row({ so_phieu: 'DA-CO' }, 2), row({ so_phieu: 'MOI' }, 3), row({ so_phieu: '' }, 4)],
      input
    );
    const out = loaiDongTrungSoPhieuDb(plan, new Set(['DA-CO']));
    expect(out.toInsert.map((p) => p.row)).toEqual([3, 4]);
    expect(out.errors.map((e) => e.row)).toEqual([2]);
    expect(out.errors[0].msg).toContain('errSoPhieuTrungDb');
  });
});
