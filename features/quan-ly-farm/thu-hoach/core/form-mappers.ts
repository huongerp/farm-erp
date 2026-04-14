import type { FarmThuHoach } from './types';
import { THU_HOACH_DAY_SUFFIXES } from './types';
import type { ThuHoachKeHoachFormValues, ThuHoachThucTeFormValues } from './schema';

/** Chi nhánh từ bản ghi thu hoạch gần nhất do cùng user tạo (theo tg_tao). */
export function getPreferredBranchFromUserLastRecords(
  rows: FarmThuHoach[],
  userId: string | null | undefined
): { id_chi_nhanh: string; ten_chi_nhanh: string } | null {
  if (userId == null || userId === '') return null;
  const uid = String(userId);
  const mine = rows.filter((r) => r.id_nguoi_tao != null && String(r.id_nguoi_tao) === uid);
  if (mine.length === 0) return null;
  mine.sort((a, b) => new Date(b.tg_tao).getTime() - new Date(a.tg_tao).getTime());
  const top = mine[0];
  if (!top.id_chi_nhanh) return null;
  return {
    id_chi_nhanh: String(top.id_chi_nhanh),
    ten_chi_nhanh: top.ten_chi_nhanh ?? '',
  };
}

/** Bản ghi đã tồn tại cùng chi nhánh + năm + tuần (dùng cảnh báo khi tạo mới, không chặn). */
export function findThuHoachDuplicateByBranchYearWeek(
  rows: FarmThuHoach[],
  idChiNhanh: string,
  nam: number,
  tuan: number
): FarmThuHoach | undefined {
  if (!idChiNhanh) return undefined;
  return rows.find(
    (r) =>
      r.id_chi_nhanh != null &&
      String(r.id_chi_nhanh) === String(idChiNhanh) &&
      Number(r.nam) === Number(nam) &&
      Number(r.tuan) === Number(tuan)
  );
}

export const DAY_FORM_LABEL_KEY: Record<(typeof THU_HOACH_DAY_SUFFIXES)[number], string> = {
  t2: 'thuHoach.form.dayT2',
  t3: 'thuHoach.form.dayT3',
  t4: 'thuHoach.form.dayT4',
  t5: 'thuHoach.form.dayT5',
  t6: 'thuHoach.form.dayT6',
  t7: 'thuHoach.form.dayT7',
  cn: 'thuHoach.form.dayCN',
};

export function defaultKeHoachFormValues(): ThuHoachKeHoachFormValues {
  const base: Record<string, unknown> = {
    nam: new Date().getFullYear(),
    tuan: 1,
    id_chi_nhanh: '',
    ten_chi_nhanh: '',
    du_thu_tuan: 0,
    thu_du_kien: [],
    ghi_chu: '',
    trao_doi: '',
  };
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    base[`ke_hoach_${s}`] = 0;
  }
  return base as ThuHoachKeHoachFormValues;
}

export function farmThuHoachToKeHoachForm(row: FarmThuHoach): ThuHoachKeHoachFormValues {
  const v: Record<string, unknown> = {
    nam: row.nam,
    tuan: row.tuan,
    id_chi_nhanh: row.id_chi_nhanh ?? '',
    ten_chi_nhanh: row.ten_chi_nhanh ?? '',
    du_thu_tuan: row.du_thu_tuan ?? 0,
    thu_du_kien: [...(row.thu_du_kien ?? [])],
    ghi_chu: row.ghi_chu ?? '',
    trao_doi: row.trao_doi ?? '',
  };
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    v[`ke_hoach_${s}`] = row[`ke_hoach_${s}` as keyof FarmThuHoach] as number;
  }
  return v as ThuHoachKeHoachFormValues;
}

export function farmThuHoachToThucTeForm(row: FarmThuHoach): ThuHoachThucTeFormValues {
  const v: Record<string, unknown> = {};
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    v[`thuc_te_${s}`] = row[`thuc_te_${s}` as keyof FarmThuHoach] as number;
  }
  return v as ThuHoachThucTeFormValues;
}
