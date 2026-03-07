import { Kho } from '../core/types';
import type { KhoFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const seed: Kho[] = [
  {
    id: 'kho-1',
    ma_kho: 'KHO-TW',
    ten_kho: 'Kho trung tâm',
    dia_chi: '123 Đường ABC, Quận 1',
    mo_ta: 'Kho chính',
    trang_thai: 1,
    thu_tu: 0,
    tg_tao: '2024-01-01T00:00:00.000Z',
    tg_cap_nhat: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'kho-2',
    ma_kho: 'KHO-PB',
    ten_kho: 'Kho chi nhánh phía Bắc',
    dia_chi: '456 Đường XYZ',
    trang_thai: 1,
    thu_tu: 1,
    tg_tao: '2024-01-02T00:00:00.000Z',
    tg_cap_nhat: '2024-01-02T00:00:00.000Z',
  },
];

let dbKho: Kho[] = JSON.parse(JSON.stringify(seed));

export const getKhoList = async (): Promise<Kho[]> => {
  await delay(400);
  return [...dbKho].sort((a, b) => a.thu_tu - b.thu_tu || a.ma_kho.localeCompare(b.ma_kho));
};

export const getKhoById = async (id: string): Promise<Kho | null> => {
  await delay(200);
  return dbKho.find((k) => k.id === id) ?? null;
};

export const createKho = async (data: KhoFormValues): Promise<Kho> => {
  await delay(500);
  const existing = dbKho.some((k) => k.ma_kho === data.ma_kho.trim().toUpperCase());
  if (existing) throw new Error(i18n.t('kho.service.duplicateCode'));

  const id = `kho-${Date.now()}`;
  const now = new Date().toISOString();
  const newKho: Kho = {
    id,
    ma_kho: data.ma_kho.trim().toUpperCase(),
    ten_kho: data.ten_kho.trim(),
    dia_chi: data.dia_chi?.trim() || undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    id_chi_nhanh: data.id_chi_nhanh ?? null,
    trang_thai: data.trang_thai as 0 | 1,
    thu_tu: data.thu_tu ?? 0,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbKho = [...dbKho, newKho];
  return newKho;
};

export const updateKho = async (id: string, data: KhoFormValues): Promise<Kho> => {
  await delay(500);
  const index = dbKho.findIndex((k) => k.id === id);
  if (index === -1) throw new Error(i18n.t('kho.service.notFound'));

  const other = dbKho.find((k) => k.id !== id && k.ma_kho === data.ma_kho.trim().toUpperCase());
  if (other) throw new Error(i18n.t('kho.service.duplicateCode'));

  const updated: Kho = {
    ...dbKho[index],
    ma_kho: data.ma_kho.trim().toUpperCase(),
    ten_kho: data.ten_kho.trim(),
    dia_chi: data.dia_chi?.trim() || undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    id_chi_nhanh: data.id_chi_nhanh ?? null,
    trang_thai: data.trang_thai as 0 | 1,
    thu_tu: data.thu_tu ?? 0,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbKho[index] = updated;
  return updated;
};

export const updateKhoStatus = async (id: string, status: 0 | 1): Promise<Kho> => {
  await delay(300);
  const index = dbKho.findIndex((k) => k.id === id);
  if (index === -1) throw new Error(i18n.t('kho.service.notFound'));
  const updated = { ...dbKho[index], trang_thai: status, tg_cap_nhat: new Date().toISOString() };
  dbKho[index] = updated;
  return updated;
};

export const deleteKho = async (id: string): Promise<void> => {
  await delay(400);
  const index = dbKho.findIndex((k) => k.id === id);
  if (index === -1) throw new Error(i18n.t('kho.service.notFound'));
  dbKho = dbKho.filter((k) => k.id !== id);
};

export const deleteKhoMany = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbKho = dbKho.filter((k) => !ids.includes(k.id));
};

export const importKho = async (
  rows: (KhoFormValues & { ma_kho?: string; ten_kho?: string })[]
): Promise<{ created: number; errors: string[] }> => {
  await delay(500);
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const data: KhoFormValues = {
        ma_kho: String(row.ma_kho ?? '').trim().toUpperCase(),
        ten_kho: String(row.ten_kho ?? '').trim(),
        dia_chi: row.dia_chi != null ? String(row.dia_chi).trim() : undefined,
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        id_chi_nhanh: row.id_chi_nhanh ?? null,
        trang_thai: Number(row.trang_thai) === 0 ? 0 : 1,
        thu_tu: Number(row.thu_tu) || 0,
      };
      if (!data.ma_kho || !data.ten_kho) {
        errors.push(`Dòng ${i + 2}: ${i18n.t('kho.validation.codeMin')}`);
        continue;
      }
      await createKho(data);
      created++;
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : 'Lỗi'}`);
    }
  }
  return { created, errors };
}
