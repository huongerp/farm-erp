/**
 * Chạy MỘT lịch đồng bộ: kiểm người tạo → đọc nguồn bằng quyền của họ → so khớp với Sheet →
 * ghi phần thay đổi (hoặc ghi lại toàn bộ khi cần) → ghi kết quả vào DB.
 */
import { createHash } from 'node:crypto';
import * as db from '../db.ts';
import { cotChu, vungA1, type MauSoCot, type OSheet } from '../core/bang-tinh.ts';
import { dinhDangOXuat, mauSoCotSheet, type KieuCotXuat } from '../core/dinh-dang.ts';
import { doiSoatKeTiep, lanChayKeTiep, thuLaiSau, type TanSuat } from '../core/lich.ts';
import { NGUON_DONG_BO } from '../core/nguon-dong-bo.ts';
import { gopKhoangXoa, nenGhiLaiToanBo, soKhopDong } from '../core/so-khop-dong.ts';
import { GoogleLoi } from '../google/goi-google.ts';
import { KetNoiHongLoi } from '../google/oauth.ts';
import { ChuaKetNoiLoi, layAccessToken } from '../google/phien.ts';
import {
  capNhatDong,
  dinhDangCot,
  docHeaderCacTab,
  docVung,
  ghiBang,
  layThongTinFile,
  noiThem,
  xoaKhoangDong,
} from '../google/sheets.ts';
import { LoiVinhVien } from './loi.ts';
import { docNguon } from './nguon.ts';

/** Lỗi tạm thời liên tiếp tới ngần này thì tắt lịch — chạy tiếp chỉ đốt quota. */
const TAT_SAU_SO_LOI = 10;
/** Báo vào chuông ở lần lỗi tạm thứ mấy (lỗi lẻ tẻ 1-2 lần tự hết, không làm phiền). */
const BAO_O_LAN = 3;

export interface KetQuaChay {
  ok: boolean;
  soDong?: number;
  thongDiep: string;
}

async function kiemTraTruocKhiChay(lich: db.Lich): Promise<{ email: string | null; accessToken: string }> {
  const nguon = NGUON_DONG_BO[lich.moduleId];
  if (!nguon || nguon.nguon !== lich.nguon) throw new LoiVinhVien('Module này không còn hỗ trợ đồng bộ tự động.');

  const nt = await db.kiemNguoiTao(lich.nhanVienId, lich.moduleId);
  if (!nt || !nt.conLam) throw new LoiVinhVien('Người tạo lịch không còn làm việc — lịch đã dừng.');
  if (!nt.toanPhamVi) {
    throw new LoiVinhVien('Người tạo lịch không còn quyền xem toàn bộ dữ liệu module (cấp bậc 1 hoặc quyền quản trị).');
  }

  try {
    const { accessToken } = await layAccessToken(lich.nhanVienId);
    return { email: nt.email, accessToken };
  } catch (e) {
    if (e instanceof KetNoiHongLoi || e instanceof ChuaKetNoiLoi) {
      await db.tatMoiLichCuaNguoi(lich.nhanVienId, e.message);
      throw new LoiVinhVien(e.message);
    }
    throw e;
  }
}

function giongHeader(cu: readonly string[], moi: readonly string[]): boolean {
  return moi.every((h, i) => (cu[i] ?? '').trim() === h);
}

/** Ghi lên Sheet. Trả thông điệp mô tả đã làm gì (hiện ở danh sách lịch). */
async function ghiLenSheet(opts: {
  at: string;
  lich: db.Lich;
  header: string[];
  rows: OSheet[][];
  mauSo: (MauSoCot | null)[];
  toanBo: boolean;
}): Promise<string> {
  const { at, lich, header, rows, mauSo } = opts;
  let file;
  try {
    file = await layThongTinFile(at, lich.spreadsheetId);
  } catch (e) {
    if (e instanceof GoogleLoi && (e.status === 403 || e.status === 404)) {
      throw new LoiVinhVien('Không còn truy cập được file Google Sheet (đã xoá, chuyển quyền hoặc gỡ quyền app).');
    }
    throw e;
  }

  const ghiLaiToanBo = async (lyDo: string) => {
    await ghiBang({ at, file, tenTab: lich.sheetTitle, cheDo: 'ghi_de', header, rows, mauSo });
    return `${lyDo}: ghi lại ${rows.length} dòng`;
  };

  const tab = file.tabs.find((t) => t.title === lich.sheetTitle);
  if (!tab) return ghiLaiToanBo('Tạo lại tab');
  if (opts.toanBo) return ghiLaiToanBo('Đối soát');

  const headerCu = (await docHeaderCacTab(at, file.spreadsheetId, [lich.sheetTitle])).get(lich.sheetTitle) ?? [];
  if (!giongHeader(headerCu, header)) return ghiLaiToanBo('Cột thay đổi');

  const soCot = header.length;
  const hienCo = await docVung(at, file.spreadsheetId, vungA1(lich.sheetTitle, `A2:${cotChu(soCot)}`));
  const ke = soKhopDong(hienCo, rows, soCot);
  if (nenGhiLaiToanBo(ke, rows.length)) return ghiLaiToanBo('Thay đổi nhiều');

  if (ke.capNhat.length === 0 && ke.them.length === 0 && ke.xoa.length === 0) return 'Sheet đã khớp, không cần ghi';
  // Thứ tự quan trọng: sửa theo số dòng hiện tại → xoá từ dưới lên → nối dòng mới cuối bảng.
  if (ke.capNhat.length > 0) await capNhatDong(at, file.spreadsheetId, lich.sheetTitle, soCot, ke.capNhat);
  if (ke.xoa.length > 0) await xoaKhoangDong(at, file.spreadsheetId, tab.sheetId, gopKhoangXoa(ke.xoa));
  if (ke.them.length > 0) {
    await noiThem(at, file.spreadsheetId, lich.sheetTitle, ke.them);
    await dinhDangCot(at, file.spreadsheetId, tab.sheetId, soCot, mauSo);
  }
  return `Sửa ${ke.capNhat.length}, thêm ${ke.them.length}, xoá ${ke.xoa.length} dòng`;
}

export async function chayMotLich(lich: db.LichDaNhan, opts: { batBuocToanBo?: boolean } = {}): Promise<KetQuaChay> {
  const now = new Date();
  const cauHinh = { tanSuat: lich.tanSuat as TanSuat, gio: lich.gio, thu: lich.thu, ngayThang: lich.ngayThang };
  try {
    const { email, accessToken } = await kiemTraTruocKhiChay(lich);
    const cot = lich.cot;
    const du = await docNguon({ nguon: lich.nguon, cot: cot.map((c) => c.key), nhanVienId: lich.nhanVienId, email });

    const header = cot.map((c) => c.label);
    const rows = du.map((r) => cot.map((c) => dinhDangOXuat(r[c.key], c.type as KieuCotXuat | undefined).sheet));
    const mauSo = cot.map((c) => mauSoCotSheet(c.type as KieuCotXuat | undefined, du, (r) => r[c.key]) ?? null);
    const vanTay = createHash('sha256').update(JSON.stringify([header, rows])).digest('hex');

    const toanBo = !!opts.batBuocToanBo || lich.doiSoatDenHan;
    const thongDiep =
      !toanBo && vanTay === lich.vanTay
        ? 'Không có thay đổi'
        : await ghiLenSheet({ at: accessToken, lich, header, rows, mauSo, toanBo });

    await db.ketThucThanhCong(lich.id, {
      soDong: rows.length,
      vanTay,
      thongDiep,
      lanChayKeTiep: lanChayKeTiep(cauHinh, now),
      // Lịch "khi có thay đổi": đối soát xong thì hẹn đêm sau; chưa tới hạn thì giữ mốc cũ.
      doiSoatKeTiep: lich.tanSuat === 'khi_thay_doi' ? (toanBo || !lich.doiSoatKeTiep ? doiSoatKeTiep(now) : lich.doiSoatKeTiep) : null,
    });
    return { ok: true, soDong: rows.length, thongDiep };
  } catch (e) {
    const vinhVien = e instanceof LoiVinhVien;
    const thongDiep = e instanceof Error ? e.message : String(e);
    const soLoi = await db.ketThucLoi(lich.id, {
      thongDiep,
      tat: vinhVien || lich.soLoiLienTiep + 1 >= TAT_SAU_SO_LOI,
      thuLaiLuc: vinhVien ? null : thuLaiSau(lich.soLoiLienTiep + 1, now),
    });
    console.error(`[sheets] lịch #${lich.id} lỗi (${vinhVien ? 'vĩnh viễn' : `lần ${soLoi}`}): ${thongDiep}`);
    if (vinhVien || soLoi === BAO_O_LAN || soLoi >= TAT_SAU_SO_LOI) {
      const tieuDe = vinhVien || soLoi >= TAT_SAU_SO_LOI ? 'Đồng bộ Google Sheet đã dừng' : 'Đồng bộ Google Sheet đang lỗi';
      await db.baoLoiVaoChuong(lich.id, tieuDe, `Tab "${lich.sheetTitle}" của ${lich.tenFile ?? 'file Google Sheet'}: ${thongDiep}`);
    }
    return { ok: false, thongDiep };
  }
}
