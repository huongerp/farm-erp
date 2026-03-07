import type {
  KpiTheoChucVu,
  ChamDiemKpiRecord,
  ChamDiemKpiChiTietItem,
  DiemCongTruLienKet,
} from '../core/types';
import type { ChamDiemKpiFormValues } from '../core/schema';
import { NGUONG_DAT_KPI, getDanhGiaKpiFromTong, computeTyLeAndDiem } from '../core/constants';
import {
  MOCK_KPI_THEO_CHUC_VU,
  MOCK_CHAM_DIEM_KPI,
  MOCK_CHAM_DIEM_KPI_CHI_TIET,
} from '@/mocks/hanh-chinh';
import { getKpiIndicators } from '@/features/he-thong/chuc-nang-nhiem-vu/services/kpi-service';
import { getDiemCongTruRecords } from '../../diem-cong-tru/services/diem-cong-tru-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { getPositions } from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
import i18n from '../../../../lib/i18n';

let dbKpiTheoChucVu: KpiTheoChucVu[] = JSON.parse(JSON.stringify(MOCK_KPI_THEO_CHUC_VU));
let dbChamDiemKpi: ChamDiemKpiRecord[] = JSON.parse(JSON.stringify(MOCK_CHAM_DIEM_KPI));
let dbChamDiemKpiChiTiet: ChamDiemKpiChiTietItem[] = JSON.parse(
  JSON.stringify(MOCK_CHAM_DIEM_KPI_CHI_TIET)
);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Điểm cộng trừ ròng cho nhân viên + kỳ (cộng - trừ) */
export async function getDiemCongTruNet(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<number> {
  const records = await getDiemCongTruRecords();
  const forPeriod = records.filter(
    (r) => r.id_nhan_vien === id_nhan_vien && r.nam === nam && r.thang === thang
  );
  let net = 0;
  for (const r of forPeriod) {
    if (r.loai === 'cong') net += r.diem;
    else net -= r.diem;
  }
  return net;
}

/** Danh sách điểm cộng trừ để hiển thị bảng con */
export async function getDiemCongTruListForPeriod(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<DiemCongTruLienKet[]> {
  const records = await getDiemCongTruRecords();
  return records
    .filter(
      (r) => r.id_nhan_vien === id_nhan_vien && r.nam === nam && r.thang === thang
    )
    .map((r) => ({
      id: r.id,
      loai: r.loai,
      ten_hang_muc: r.ten_hang_muc,
      ma_hang_muc: r.ma_hang_muc,
      diem: r.diem,
      mo_ta: r.mo_ta,
    }));
}

export async function getKpiTheoChucVuAll(): Promise<KpiTheoChucVu[]> {
  await delay(300);
  const kpis = await getKpiIndicators();
  return dbKpiTheoChucVu.map((kt) => {
    const kpi = kpis.find((k) => k.id === kt.id_chi_so);
    return {
      ...kt,
      ten_chi_so: kpi?.ten_chi_so,
      don_vi: kpi?.don_vi,
      chi_tieu_nguong: kpi?.chi_tieu_nguong,
    };
  });
}

export async function getKpiTheoChucVuByChucVu(
  id_chuc_vu: string
): Promise<KpiTheoChucVu[]> {
  await delay(300);
  const all = await getKpiTheoChucVuAll();
  return all.filter((kt) => kt.id_chuc_vu === id_chuc_vu).sort((a, b) => a.thu_tu - b.thu_tu);
}

function computeDiemKpiFromItems(items: { ty_trong: number; diem: number }[]): number {
  const totalWeight = items.reduce((s, i) => s + i.ty_trong, 0);
  if (totalWeight === 0) return 0;
  return items.reduce((s, i) => s + (i.diem * i.ty_trong) / totalWeight, 0);
}

export async function getChamDiemKpiRecords(): Promise<ChamDiemKpiRecord[]> {
  await delay(500);
  const kpis = await getKpiIndicators();
  const diemCongTruRecords = await getDiemCongTruRecords();

  const chiTietByChamDiem = new Map<string, ChamDiemKpiChiTietItem[]>();
  for (const ct of dbChamDiemKpiChiTiet) {
    const kpi = kpis.find((k) => k.id === ct.id_chi_so);
    const row = {
      ...ct,
      ten_chi_so: kpi?.ten_chi_so,
      don_vi: kpi?.don_vi,
      chi_tieu_nguong: kpi?.chi_tieu_nguong,
    };
    if (!chiTietByChamDiem.has(ct.id_cham_diem_kpi))
      chiTietByChamDiem.set(ct.id_cham_diem_kpi, []);
    chiTietByChamDiem.get(ct.id_cham_diem_kpi)!.push(row);
  }

  return dbChamDiemKpi.map((r) => {
    const chiTiet = (chiTietByChamDiem.get(r.id) || []).sort((a, b) => a.thu_tu - b.thu_tu);
    const diemCongTruList: DiemCongTruLienKet[] = diemCongTruRecords
      .filter(
        (d) =>
          d.id_nhan_vien === r.id_nhan_vien && d.nam === r.nam && d.thang === r.thang
      )
      .map((d) => ({
        id: d.id,
        loai: d.loai,
        ten_hang_muc: d.ten_hang_muc,
        ma_hang_muc: d.ma_hang_muc,
        diem: d.diem,
        mo_ta: d.mo_ta,
      }));
    return { ...r, chi_tiet: chiTiet, diem_cong_tru_list: diemCongTruList };
  });
}

export async function getChamDiemKpiById(id: string): Promise<ChamDiemKpiRecord | null> {
  await delay(300);
  const list = await getChamDiemKpiRecords();
  return list.find((r) => r.id === id) ?? null;
}

export async function getChamDiemKpiByNhanVienPeriod(
  id_nhan_vien: string,
  nam: number,
  thang: number
): Promise<ChamDiemKpiRecord | null> {
  const list = await getChamDiemKpiRecords();
  return list.find((r) => r.id_nhan_vien === id_nhan_vien && r.nam === nam && r.thang === thang) ?? null;
}

export async function saveChamDiemKpi(
  data: ChamDiemKpiFormValues,
  existingId?: string
): Promise<ChamDiemKpiRecord> {
  await delay(700);
  const [employees, positions, diemCongTruNet] = await Promise.all([
    getEmployees(),
    getPositions(),
    getDiemCongTruNet(data.id_nhan_vien, data.nam, data.thang),
  ]);
  const emp = employees.find((e) => e.id === data.id_nhan_vien);
  const pos = emp?.id_chuc_vu ? positions.find((p) => p.id === emp.id_chuc_vu) : null;

  const diem_kpi = computeDiemKpiFromItems(data.items);
  const tong_kpi = diem_kpi + diemCongTruNet;
  const danh_gia = getDanhGiaKpiFromTong(tong_kpi);
  const now = new Date().toISOString();

  if (existingId) {
    const idx = dbChamDiemKpi.findIndex((r) => r.id === existingId);
    if (idx === -1) throw new Error(i18n.t('chamDiemKpi.service.notFound'));
    const updated: ChamDiemKpiRecord = {
      ...dbChamDiemKpi[idx],
      diem_kpi,
      diem_cong_tru_net: diemCongTruNet,
      tong_kpi,
      danh_gia,
      tg_cap_nhat: now,
    };
    dbChamDiemKpi[idx] = updated;
    dbChamDiemKpiChiTiet = dbChamDiemKpiChiTiet.filter((c) => c.id_cham_diem_kpi !== existingId);
    data.items.forEach((item, i) => {
      const loai = item.loai ?? 'xuoi';
      const muc_tieu = item.muc_tieu;
      const thuc_dat = item.thuc_dat;
      const { ty_le, diem: computedDiem } =
        muc_tieu != null && thuc_dat != null
          ? computeTyLeAndDiem(loai, muc_tieu, thuc_dat)
          : { ty_le: undefined, diem: item.diem };
      dbChamDiemKpiChiTiet.push({
        id: `cdk-ct-${Date.now()}-${i}`,
        id_cham_diem_kpi: existingId,
        id_chi_so: item.id_chi_so,
        ty_trong: item.ty_trong,
        loai,
        muc_tieu,
        thuc_dat,
        ty_le: ty_le ?? (computedDiem != null ? computedDiem : undefined),
        diem: computedDiem ?? item.diem,
        thu_tu: i + 1,
      });
    });
    return (await getChamDiemKpiById(existingId))!;
  }

  const newId = `cdk-${Date.now()}`;
  const newRecord: ChamDiemKpiRecord = {
    id: newId,
    id_nhan_vien: data.id_nhan_vien,
    ten_nhan_vien: emp?.ho_ten,
    ma_nhan_vien: emp?.ma_nhan_vien,
    id_chuc_vu: emp?.id_chuc_vu ?? undefined,
    ten_chuc_vu: pos?.ten_chuc_vu,
    id_phong_ban: emp?.id_phong_ban ?? undefined,
    ten_phong_ban: emp?.ten_phong_ban,
    nam: data.nam,
    thang: data.thang,
    diem_kpi,
    diem_cong_tru_net: diemCongTruNet,
    tong_kpi,
    danh_gia,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbChamDiemKpi = [newRecord, ...dbChamDiemKpi];
  data.items.forEach((item, i) => {
    const loai = item.loai ?? 'xuoi';
    const muc_tieu = item.muc_tieu;
    const thuc_dat = item.thuc_dat;
    const { ty_le, diem: computedDiem } =
      muc_tieu != null && thuc_dat != null
        ? computeTyLeAndDiem(loai, muc_tieu, thuc_dat)
        : { ty_le: undefined, diem: item.diem };
    dbChamDiemKpiChiTiet.push({
      id: `cdk-ct-${Date.now()}-${i}`,
      id_cham_diem_kpi: newId,
      id_chi_so: item.id_chi_so,
      ty_trong: item.ty_trong,
      loai,
      muc_tieu,
      thuc_dat,
      ty_le: ty_le ?? (computedDiem != null ? computedDiem : undefined),
      diem: computedDiem ?? item.diem,
      thu_tu: i + 1,
    });
  });
  return (await getChamDiemKpiById(newId))!;
}

export async function deleteChamDiemKpi(id: string): Promise<void> {
  await delay(400);
  const idx = dbChamDiemKpi.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(i18n.t('chamDiemKpi.service.notFound'));
  dbChamDiemKpi.splice(idx, 1);
  dbChamDiemKpiChiTiet = dbChamDiemKpiChiTiet.filter((c) => c.id_cham_diem_kpi !== id);
}

export const NGUONG_DAT_EXPORT = NGUONG_DAT_KPI;
