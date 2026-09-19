import { describe, it, expect } from 'vitest';
import { renderThongBao } from './render.ts';
import { MO_TA_BANG } from './mo-ta-bang.ts';
import type { DongOutbox, SuKienDaPhanTich } from './types.ts';

function nguCanh(
  bang: string,
  loai: string,
  payload: Record<string, unknown> = {},
  duLieu: Record<string, unknown> = {},
  tenActor: string | null = 'Nguyễn Văn A'
) {
  const dong: DongOutbox = {
    id: 1,
    module_id: MO_TA_BANG[bang]!.moduleId,
    bang,
    ban_ghi_id: 10,
    thao_tac: 'UPDATE',
    trang_thai_cu: null,
    trang_thai_moi: null,
    actor_id: 1,
    payload,
    payload_cu: null,
  };
  const suKien: SuKienDaPhanTich = { loai, muc: 'thuong', vai: [], duLieu };
  return { moTa: MO_TA_BANG[bang]!, dong, suKien, tenActor };
}

describe('phiếu có luồng duyệt', () => {
  it('tiêu đề mang số phiếu', () => {
    const kq = renderThongBao(nguCanh('fp_mh_phieu_kho', 'phieu.cho_duyet', { so_phieu: 'PX-0042' }));
    expect(kq.tieuDe).toBe('Phiếu kho PX-0042 chờ duyệt');
    expect(kq.noiDung).toBe('Nguyễn Văn A vừa gửi phiếu, đang chờ bạn duyệt.');
  });

  it('thiếu số phiếu thì vẫn ra câu đọc được', () => {
    const kq = renderThongBao(nguCanh('fp_mh_phieu_kho', 'phieu.cho_duyet', {}));
    expect(kq.tieuDe).toBe('Phiếu kho chờ duyệt');
  });

  it('từ chối thì nêu lý do', () => {
    const kq = renderThongBao(
      nguCanh('fp_farm_de_xuat_mua_hang', 'phieu.khong_duyet', { so_phieu: 'FDX-0113' }, { lyDo: 'Thiếu chứng từ' })
    );
    expect(kq.tieuDe).toBe('Đề xuất mua hàng FDX-0113 không được duyệt');
    expect(kq.noiDung).toContain('Lý do: Thiếu chứng từ');
  });

  it('không có lý do thì câu vẫn trọn vẹn, không lòi chữ null', () => {
    const kq = renderThongBao(nguCanh('fp_mh_phieu_kho', 'phieu.khong_duyet', { so_phieu: 'PX-1' }));
    expect(kq.noiDung).toBe('Nguyễn Văn A không duyệt phiếu.');
  });

  it('không tra được tên người thao tác thì lui về cách nói trung tính', () => {
    const kq = renderThongBao(
      nguCanh('fp_mh_phieu_kho', 'phieu.da_duyet', { so_phieu: 'PX-7' }, {}, null)
    );
    expect(kq.noiDung).toBe('Có người đã duyệt phiếu của bạn.');
  });

  it('sửa sau duyệt thì kể rõ cột nào đổi, cũ → mới', () => {
    const kq = renderThongBao(
      nguCanh(
        'fp_mh_phieu_de_xuat_vat_tu',
        'phieu.sua_sau_duyet',
        { so_phieu: 'PDX-0796' },
        {
          thayDoi: [
            { cot: 'ngay_can', nhan: 'Ngày cần', cu: '17/09/2026', moi: '19/09/2026' },
            { cot: 'id_nguoi_duyet', nhan: 'Người duyệt', cu: null, moi: null },
          ],
        },
        'Vi Thị Thủy'
      )
    );
    expect(kq.tieuDe).toBe('Phiếu đề xuất vật tư PDX-0796 đã duyệt vừa bị sửa');
    expect(kq.noiDung).toBe(
      'Vi Thị Thủy đã sửa phiếu sau khi phiếu được duyệt. Ngày cần: 17/09/2026 → 19/09/2026; đổi người duyệt.'
    );
  });

  it('sửa sau duyệt mà cột phiếu không đổi thì chỉ ra chỗ thay đổi là mặt hàng', () => {
    const kq = renderThongBao(
      nguCanh('fp_mh_phieu_de_xuat_vat_tu', 'phieu.sua_sau_duyet', { so_phieu: 'PDX-0796' }, { thayDoi: [] })
    );
    expect(kq.noiDung).toBe(
      'Nguyễn Văn A đã sửa phiếu sau khi phiếu được duyệt. Thông tin chung không đổi — thay đổi nằm ở danh sách mặt hàng.'
    );
  });

  it('nhiều thay đổi thì kể bốn cái rồi đếm phần còn lại', () => {
    const thayDoi = ['Số phiếu', 'Ngày', 'Ngày cần', 'Ghi chú', 'Mô tả', 'Kho'].map((nhan, i) => ({
      cot: `c${i}`,
      nhan,
      cu: 'a',
      moi: 'b',
    }));
    const kq = renderThongBao(
      nguCanh('fp_mh_phieu_kho', 'phieu.sua_sau_duyet', { so_phieu: 'PX-1' }, { thayDoi })
    );
    expect(kq.noiDung).toContain('Số phiếu: a → b; Ngày: a → b; Ngày cần: a → b; Ghi chú: a → b; và 2 thay đổi khác.');
  });

  it('mỗi module dùng đúng tên chứng từ của nó', () => {
    expect(
      renderThongBao(nguCanh('fp_mh_phieu_de_xuat_vat_tu', 'phieu.da_duyet', { so_phieu: 'DX-1' })).tieuDe
    ).toBe('Phiếu đề xuất vật tư DX-1 đã được duyệt');
    expect(
      renderThongBao(nguCanh('fp_farm_phieu_kho_phan_thuoc', 'phieu.da_duyet', { so_phieu: 'PT-1' })).tieuDe
    ).toBe('Phiếu kho farm PT-1 đã được duyệt');
  });
});

describe('công việc', () => {
  it('dùng tiêu đề công việc thay số phiếu', () => {
    const kq = renderThongBao(
      nguCanh('fp_hc_cong_viec', 'cong_viec.duoc_giao', { tieu_de: 'Kiểm kê kho A' })
    );
    expect(kq.tieuDe).toBe('Bạn được giao: Kiểm kê kho A');
  });

  it('trao đổi mới trích nội dung bình luận', () => {
    const kq = renderThongBao(
      nguCanh('fp_hc_cong_viec', 'cong_viec.trao_doi_moi', { tieu_de: 'Kiểm kê kho A' }, { noiDungTraoDoi: 'Đã xong phần 1' })
    );
    expect(kq.noiDung).toBe('Nguyễn Văn A: Đã xong phần 1');
  });

  it('trao đổi quá dài thì cắt bớt', () => {
    const dai = 'x'.repeat(300);
    const kq = renderThongBao(
      nguCanh('fp_hc_cong_viec', 'cong_viec.trao_doi_moi', { tieu_de: 'T' }, { noiDungTraoDoi: dai })
    );
    expect(kq.noiDung!.length).toBeLessThan(200);
    expect(kq.noiDung).toContain('…');
  });

  it('công việc không có tiêu đề vẫn render được', () => {
    const kq = renderThongBao(nguCanh('fp_hc_cong_viec', 'cong_viec.hoan_thanh', {}));
    expect(kq.tieuDe).toBe('Đã hoàn thành: Công việc');
  });
});

describe('phiếu hành chính', () => {
  it('tiêu đề mang ngày dạng dd/MM', () => {
    const kq = renderThongBao(
      nguCanh('fp_hr_phieu_hanh_chinh', 'hanh_chinh.cho_duyet', { ngay: '2026-09-18' })
    );
    expect(kq.tieuDe).toBe('Phiếu hành chính ngày 18/09 chờ duyệt');
  });

  it('thiếu ngày thì bỏ phần ngày', () => {
    const kq = renderThongBao(nguCanh('fp_hr_phieu_hanh_chinh', 'hanh_chinh.da_duyet', {}));
    expect(kq.tieuDe).toBe('Phiếu hành chính đã được duyệt');
  });
});

describe('đơn đặt hàng', () => {
  it('dùng số PO làm nhãn', () => {
    const kq = renderThongBao(nguCanh('fp_mh_don_dat_hang', 'don_hang.cho_duyet', { so_po: 'PO-2026-001' }));
    expect(kq.tieuDe).toBe('Đơn đặt hàng PO-2026-001 chờ duyệt');
  });

  it('đang giao thì nêu ngày giao dự kiến', () => {
    const kq = renderThongBao(
      nguCanh('fp_mh_don_dat_hang', 'don_hang.dang_giao', { so_po: 'PO-1', ngay_giao_dk: '2026-09-25' })
    );
    expect(kq.noiDung).toBe('Hàng đang trên đường giao, dự kiến 25/09.');
  });
});

describe('sổ quỹ', () => {
  it('xin mở khoá nêu số phiếu và lý do', () => {
    const kq = renderThongBao(
      nguCanh('fp_tc_quy_thu_chi', 'quy.xin_mo_khoa', { so_phieu: 'PC-0007' }, { lyDo: 'Nhập nhầm số tiền' })
    );
    expect(kq.tieuDe).toBe('Phiếu quỹ PC-0007 xin mở khoá');
    expect(kq.noiDung).toBe('Nguyễn Văn A xin mở khoá phiếu quỹ. Lý do: Nhập nhầm số tiền');
  });

  it('thiếu lý do vẫn ra câu đọc được', () => {
    const kq = renderThongBao(nguCanh('fp_tc_quy_thu_chi', 'quy.xin_mo_khoa', { so_phieu: 'PC-1' }));
    expect(kq.noiDung).toBe('Nguyễn Văn A xin mở khoá phiếu quỹ, chờ bạn duyệt.');
  });

  it('duyệt và từ chối nói rõ phiếu còn khoá hay không', () => {
    expect(
      renderThongBao(nguCanh('fp_tc_quy_thu_chi', 'quy.duyet_mo_khoa', { so_phieu: 'PT-9' })).tieuDe
    ).toBe('Phiếu quỹ PT-9 đã được mở khoá');
    expect(
      renderThongBao(nguCanh('fp_tc_quy_thu_chi', 'quy.tu_choi_mo_khoa', { so_phieu: 'PT-9' })).noiDung
    ).toBe('Nguyễn Văn A đã từ chối yêu cầu mở khoá; phiếu vẫn đang khoá.');
  });
});

describe('loại sự kiện lạ', () => {
  it('không ném lỗi, lui về nhãn chứng từ', () => {
    const kq = renderThongBao(nguCanh('fp_mh_phieu_kho', 'khong_biet_la_gi', { so_phieu: 'PX-9' }));
    expect(kq.tieuDe).toBe('Phiếu kho PX-9');
    expect(kq.noiDung).toBeNull();
  });
});
