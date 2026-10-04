import { describe, it, expect } from 'vitest';
import { formatDbError } from './db-errors';

describe('formatDbError — key i18n phải giải được', () => {
  it('lỗi mạng ra câu tiếng Việt, không phải tên key', () => {
    const msg = formatDbError(new TypeError('Failed to fetch'));
    expect(msg).not.toContain('errors.db.');
    expect(msg).toContain('Lỗi mạng');
  });

  it('RLS 42501 ra câu tiếng Việt kèm mã', () => {
    const msg = formatDbError({ code: '42501', message: 'permission denied for table x' });
    expect(msg).not.toContain('errors.db.');
    expect(msg).toContain('42501');
  });

  it('42501 do trigger tự RAISE câu tiếng Việt thì giữ nguyên câu đó', () => {
    const msg = formatDbError({ code: '42501', message: 'Không được tự đổi cấp bậc của chính mình' });
    expect(msg).toBe('[42501] Không được tự đổi cấp bậc của chính mình');
  });
});

describe('formatDbError — ràng buộc dữ liệu không còn rơi về câu tiếng Anh', () => {
  it('23503 xoá bản ghi đang được tham chiếu', () => {
    const msg = formatDbError({
      code: '23503',
      message: 'update or delete on table "fp_var_kho" violates foreign key constraint "fk_phieu_kho" on table "fp_mh_phieu_kho"',
    });
    expect(msg).toContain('23503');
    expect(msg).toContain('đang được dùng');
    expect(msg).not.toContain('violates');
  });

  it('23503 ghi tham chiếu tới bản ghi đã bị xoá', () => {
    const msg = formatDbError({
      code: '23503',
      message: 'insert or update on table "fp_mh_phieu_kho" violates foreign key constraint "fk_kho"',
    });
    expect(msg).toContain('không tồn tại');
  });

  it('23502 nêu tên cột thiếu', () => {
    const msg = formatDbError({ code: '23502', message: 'null value in column "ten_kho" of relation "fp_var_kho" violates not-null constraint' });
    expect(msg).toContain('ten_kho');
    expect(msg).not.toContain('null value');
  });

  it('23514 nêu tên ràng buộc', () => {
    const msg = formatDbError({ code: '23514', message: 'new row for relation "x" violates check constraint "ck_so_luong_duong"' });
    expect(msg).toContain('ck_so_luong_duong');
    expect(msg).not.toContain('errors.db.');
  });
});

describe('formatDbError — 23505 (unique index mã hàng)', () => {
  it('nhận theo code và nêu rõ cột/giá trị bị trùng', () => {
    const msg = formatDbError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "uq_fp_farm_danh_sach_hang_hoa_ma"',
      details: 'Key (ma_hang_hoa)=(HH-001) already exists.',
    });
    expect(msg).toContain('23505');
    expect(msg).toContain('ma_hang_hoa = HH-001');
    expect(msg).not.toContain('duplicate key value');
  });

  it('nhận cả khi client không gắn code, chỉ có message', () => {
    const msg = formatDbError({
      message: 'duplicate key value violates unique constraint "uq_fp_mh_danh_sach_hang_hoa_ma"',
    });
    expect(msg).toContain('23505');
    expect(msg).not.toContain('errors.db.');
  });

  it('thiếu details thì vẫn ra thông báo, không vỡ', () => {
    const msg = formatDbError({ code: '23505', message: 'duplicate key value violates unique constraint' });
    expect(msg).toContain('23505');
    expect(msg).not.toContain('errors.db.');
  });
});
