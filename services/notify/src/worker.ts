/**
 * Worker thông báo: đọc outbox → định tuyến → ghi chuông → đẩy push.
 *
 * Đánh thức bằng LISTEN/NOTIFY nên độ trễ gần như tức thì, kèm một vòng quét
 * định kỳ làm lưới an toàn phòng khi kết nối LISTEN đứt mà không ai hay.
 */

import type { PoolClient } from 'pg';
import { config } from './config.ts';
import * as db from './db.ts';
import { phanTichSuKien } from './core/su-kien.ts';
import { dinhTuyen, giaiVaiTheoPayload } from './core/routing.ts';
import { renderThongBao } from './core/render.ts';
import { layMoTaBang, dungLink } from './core/mo-ta-bang.ts';
import { nenGop } from './core/dedupe.ts';
import { soHoacNull } from './core/chuan-hoa.ts';
import {
  timCaiDat,
  nenGuiPush,
  nenVaoChuong,
  MAC_DINH_TUY_CHON,
  type CaiDatNgoaiLe,
  type TuyChonChung,
} from './core/nen-gui-push.ts';
import { guiToiTatCaThietBi } from './push.ts';
import type { DongOutbox } from './core/types.ts';

const KENH = 'thong_bao_moi';
const SO_SU_KIEN_MOI_LUOT = 50;

/** Giờ trong ngày theo múi giờ công ty — giờ yên lặng phải tính theo giờ Việt Nam, không phải UTC. */
function gioTheoMuiGioCongTy(luc: Date): number {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.muiGio,
    hour: '2-digit',
    hour12: false,
  }).format(luc);
  const g = Number(s);
  return Number.isFinite(g) ? g % 24 : luc.getHours();
}

/** Cache trong phạm vi MỘT sự kiện: một phiếu thường bắn cho nhiều người cùng lúc. */
class BoNhoTam {
  private caiDat = new Map<number, CaiDatNgoaiLe[]>();
  private tuyChon = new Map<number, TuyChonChung>();

  async layCaiDat(id: number): Promise<CaiDatNgoaiLe[]> {
    const sc = this.caiDat.get(id);
    if (sc) return sc;
    const moi = await db.layCaiDatNgoaiLe(id);
    this.caiDat.set(id, moi);
    return moi;
  }

  async layTuyChon(id: number): Promise<TuyChonChung> {
    const sc = this.tuyChon.get(id);
    if (sc) return sc;
    const moi = (await db.layTuyChon(id)) ?? MAC_DINH_TUY_CHON;
    this.tuyChon.set(id, moi);
    return moi;
  }
}

export async function xuLyMotSuKien(dong: DongOutbox): Promise<void> {
  const moTa = layMoTaBang(dong.bang);
  if (!moTa) return;

  const dsSuKien = phanTichSuKien(dong);
  if (dsSuKien.length === 0) return;

  const tenTheoId = dong.actor_id === null ? new Map<number, string>() : await db.layTenNhanVien([dong.actor_id]);
  const tenActor = dong.actor_id === null ? null : (tenTheoId.get(dong.actor_id) ?? null);

  // Tên loại phiếu: tra TRƯỚC rồi truyền vào render, cùng mẫu với tenActor —
  // lớp render phải thuần để test bằng vitest. Lấy cả id cũ để câu "sửa sau
  // duyệt" đọc được "Loại phiếu: Công tác → Xin nghỉ phép" thay vì hai con số.
  let tenLoaiPhieu: string | null = null;
  let tenLoaiPhieuCu: string | null = null;
  if (moTa.cotLoaiPhieu) {
    const idMoi = soHoacNull(dong.payload[moTa.cotLoaiPhieu]);
    const idCu = soHoacNull(dong.payload_cu?.[moTa.cotLoaiPhieu]);
    const ids = [...new Set([idMoi, idCu].filter((n): n is number => n !== null))];
    const ten = await db.layTenLoaiPhieu(ids);
    tenLoaiPhieu = idMoi === null ? null : (ten.get(idMoi) ?? null);
    tenLoaiPhieuCu = idCu === null ? null : (ten.get(idCu) ?? null);
  }

  const bayGio = new Date();
  const gioHienTai = gioTheoMuiGioCongTy(bayGio);
  const bo = new BoNhoTam();
  const link = dungLink(moTa, dong.ban_ghi_id);

  for (const suKien of dsSuKien) {
    let nhomDuyet: Awaited<ReturnType<typeof db.layNguoiDuyet>> = [];
    if (suKien.vai.includes('nhom_duyet')) {
      if (moTa.nhomDuyetTheoPhongBanNguoiTao) {
        // Dùng chính bộ giải vai của routing để khỏi chép lại luật đọc cột
        // người tạo — mỗi bảng đặt tên cột một kiểu.
        const [nguoiTaoId] = giaiVaiTheoPayload('nguoi_tao', moTa, dong, suKien);
        nhomDuyet = await db.layNguoiDuyetTheoPhongBan(moTa.moduleId, nguoiTaoId ?? null);
      } else {
        const chiNhanhId = await db.layChiNhanhPhieu(dong.bang, dong.ban_ghi_id);
        nhomDuyet = await db.layNguoiDuyet(moTa.moduleId, chiNhanhId);
      }
    }

    const nguoiNhan = dinhTuyen(dong, suKien, moTa, nhomDuyet);
    if (nguoiNhan.length === 0) continue;

    const { tieuDe, noiDung } = renderThongBao({
      moTa, dong, suKien, tenActor, tenLoaiPhieu, tenLoaiPhieuCu,
    });

    for (const nn of nguoiNhan) {
      const caiDat = timCaiDat(await bo.layCaiDat(nn.id), moTa.moduleId, suKien.loai);
      const tuyChon = await bo.layTuyChon(nn.id);
      const nguCanh = { muc: suKien.muc, imLang: nn.imLang, caiDat, tuyChon, gioHienTai };

      if (!nenVaoChuong(nguCanh)) continue;

      const cu = await db.timThongBaoDeGop(nn.id, dong.bang, dong.ban_ghi_id, suKien.loai);
      if (nenGop(cu?.tgCapNhat ?? null, bayGio)) {
        await db.gopThongBao(cu!.id, tieuDe, noiDung);
      } else {
        await db.ghiThongBao({
          nguoiNhanId: nn.id,
          moduleId: moTa.moduleId,
          loaiSuKien: suKien.loai,
          muc: suKien.muc,
          tieuDe,
          noiDung,
          link,
          bang: dong.bang,
          banGhiId: dong.ban_ghi_id,
          suKienId: dong.id,
          duLieu: suKien.duLieu,
        });
      }

      if (!nenGuiPush(nguCanh)) continue;

      const dsSub = await db.laySubscription(nn.id);
      if (dsSub.length === 0) continue;

      await guiToiTatCaThietBi(dsSub, {
        tieuDe,
        noiDung,
        link,
        tag: `${dong.bang}:${dong.ban_ghi_id}`,
        muc: suKien.muc,
        // Đếm SAU khi đã ghi chuông ở trên nên đã tính cả thông báo này.
        soChuaDoc: await db.demChuaDoc(nn.id),
      });
    }
  }
}

/**
 * Xử lý cả hàng đợi. Một sự kiện hỏng chỉ ghi lỗi và tăng số lần thử chứ không
 * chặn các sự kiện sau — nếu không, một dòng dữ liệu lạ sẽ làm kẹt toàn bộ thông
 * báo của cả công ty.
 */
export async function xuLyHangDoi(): Promise<number> {
  const ds = await db.laySuKienChuaXuLy(SO_SU_KIEN_MOI_LUOT);
  let xong = 0;

  for (const dong of ds) {
    try {
      await xuLyMotSuKien(dong);
      await db.danhDauDaXuLy(dong.id);
      xong += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[notify/worker] sự kiện #${dong.id} lỗi:`, msg);
      await db.ghiLoiSuKien(dong.id, msg).catch(() => undefined);
    }
  }

  return xong;
}

let dangChay = false;

/** Gộp các lần đánh thức chồng nhau: NOTIFY dồn dập vẫn chỉ một lượt xử lý. */
async function chayMotLuot(): Promise<void> {
  if (dangChay) return;
  dangChay = true;
  try {
    let xong = 0;
    do {
      xong = await xuLyHangDoi();
    } while (xong >= SO_SU_KIEN_MOI_LUOT);
  } finally {
    dangChay = false;
  }
}

/**
 * Giữ một connection riêng chỉ để LISTEN. Không lấy từ pool vì connection LISTEN
 * phải sống mãi, còn pool thì tự thu hồi connection rảnh sau 30 giây.
 */
export async function khoiDongWorker(): Promise<() => Promise<void>> {
  let clientHienTai: PoolClient | null = null;
  let dungLai = false;

  function traClient(c: PoolClient | null): void {
    if (!c) return;
    try {
      c.release();
    } catch {
      // connection đã hỏng hoặc đang tắt — không có gì để cứu
    }
  }

  async function noiLaiListen(): Promise<void> {
    if (dungLai) return;
    try {
      const c = await db.pool.connect();
      clientHienTai = c;

      c.on('notification', () => {
        void chayMotLuot();
      });
      c.on('error', (e: Error) => {
        console.error('[notify/worker] kết nối LISTEN lỗi, sẽ nối lại:', e.message);
        traClient(c);
        if (clientHienTai === c) clientHienTai = null;
        setTimeout(() => void noiLaiListen(), 5_000);
      });

      await c.query(`LISTEN ${KENH}`);
      console.log(`[notify/worker] đang nghe kênh ${KENH}`);
      // Có thể đã lỡ sự kiện trong lúc mất kết nối.
      void chayMotLuot();
    } catch (e) {
      console.error('[notify/worker] không nối được LISTEN, thử lại sau 5 giây:', (e as Error).message);
      setTimeout(() => void noiLaiListen(), 5_000);
    }
  }

  await noiLaiListen();

  const hen = setInterval(() => void chayMotLuot(), config.chuKyQuetMs);

  return async () => {
    dungLai = true;
    clearInterval(hen);
    traClient(clientHienTai);
    clientHienTai = null;
  };
}
