import { supabase, fetchAllRows } from '../../../../lib/supabase';
import { ensureAuthUser } from '../../../../lib/ensure-auth-user';
import type { Employee } from '../core/types';
import type { EmployeeFormValues } from '../core/schema';
import { TRANG_THAI_NV, type TrangThaiNV } from '../../../../lib/constants';
import { getPositions } from '../../chuc-vu/services/chuc-vu-service';
import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import { getBranches } from '../../chi-nhanh/services/chi-nhanh-service';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_var_nhan_vien';

type NhanVienRow = Record<string, unknown>;

function dateToIso(val: unknown): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') return val;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function rowToEmployee(row: NhanVienRow): Employee {
  return {
    id: String(row.id),
    ma_nhan_vien: 'NV' + String(row.id),
    ho_ten: (row.ho_va_ten as string) ?? '',
    email: (row.email as string) ?? '',
    so_dien_thoai: (row.so_dien_thoai as string) ?? '',
    id_phong_ban: row.phong_ban_id != null ? String(row.phong_ban_id) : null,
    id_chuc_vu: row.chuc_vu_id != null ? String(row.chuc_vu_id) : null,
    id_chi_nhanh: row.chi_nhanh_id != null ? String(row.chi_nhanh_id) : null,
    ten_phong_ban: (row.ten_phong_ban as string) ?? undefined,
    ten_chuc_vu: (row.ten_chuc_vu as string) ?? undefined,
    ten_chi_nhanh: (row.ten_chi_nhanh as string) ?? undefined,
    gioi_tinh: ((row.gioi_tinh as string) as 'Nam' | 'Nữ' | 'Khác') ?? 'Khác',
    trang_thai: (row.trang_thai as TrangThaiNV) ?? TRANG_THAI_NV.DANG_LAM_VIEC,
    ngay_vao_lam: dateToIso(row.ngay_vao_lam) ?? '',
    anh_dai_dien: (row.hinh_anh as string) ?? undefined,
    ngay_sinh: dateToIso(row.ngay_sinh),
    cmnd_cccd: (row.cmnd_cccd as string) ?? undefined,
    ngay_cap_cccd: dateToIso(row.ngay_cap_cccd),
    noi_cap_cccd: (row.noi_cap_cccd as string) ?? undefined,
    quoc_tich: (row.quoc_tich as string) ?? undefined,
    dan_toc: (row.dan_toc as string) ?? undefined,
    ton_giao: (row.ton_giao as string) ?? undefined,
    tinh_thanh: (row.tinh_thanh as string) ?? undefined,
    quan_huyen: (row.quan_huyen as string) ?? undefined,
    phuong_xa: (row.phuong_xa as string) ?? undefined,
    dia_chi_cu_the: (row.dia_chi_cu_the as string) ?? undefined,
    dia_chi_tam_tru: (row.dia_chi_tam_tru as string) ?? undefined,
    id_cap_bac: row.cap_bac_id != null ? String(row.cap_bac_id) : null,
    ten_cap_bac: (row.ten_cap_bac as string) ?? undefined,
    cap_bac: row.cap_bac != null ? Number(row.cap_bac) : undefined,
    loai_hop_dong: (row.loai_hop_dong as string) ?? undefined,
    ngay_het_han_hd: dateToIso(row.ngay_het_han_hd) ?? undefined,
    noi_lam_viec: (row.noi_lam_viec as string) ?? undefined,
    nguoi_lien_he_khan_cap: (row.nguoi_lien_he_khan_cap as string) ?? undefined,
    sdt_khan_cap: (row.sdt_khan_cap as string) ?? undefined,
    quan_he_khan_cap: (row.quan_he_khan_cap as string) ?? undefined,
    tinh_trang_hon_nhan: (row.tinh_trang_hon_nhan as string) ?? undefined,
    so_nguoi_phu_thuoc: row.so_nguoi_phu_thuoc != null ? Number(row.so_nguoi_phu_thuoc) : undefined,
    trinh_do_hoc_van: (row.trinh_do_hoc_van as string) ?? undefined,
    chuyen_nganh: (row.chuyen_nganh as string) ?? undefined,
    truong_hoc: (row.truong_hoc as string) ?? undefined,
    nam_tot_nghiep: (row.nam_tot_nghiep as string) ?? undefined,
    chung_chi: (row.chung_chi as string) ?? undefined,
    so_tai_khoan: (row.so_tai_khoan as string) ?? undefined,
    ten_ngan_hang: (row.ten_ngan_hang as string) ?? undefined,
    chi_nhanh_nh: (row.chi_nhanh_nh as string) ?? undefined,
    ma_so_thue_ca_nhan: (row.ma_so_thue_ca_nhan as string) ?? undefined,
    so_bhxh: (row.so_bhxh as string) ?? undefined,
    so_bhyt: (row.so_bhyt as string) ?? undefined,
    ngay_tham_gia_bh: dateToIso(row.ngay_tham_gia_bh),
    noi_dang_ky_kcb: (row.noi_dang_ky_kcb as string) ?? undefined,
  };
}

function formToRow(data: EmployeeFormValues): NhanVienRow {
  return {
    ho_va_ten: data.ho_ten?.trim() || null,
    hinh_anh: data.anh_dai_dien || null,
    trang_thai: data.trang_thai || null,
    phong_ban_id: data.id_phong_ban || null,
    chuc_vu_id: data.id_chuc_vu || null,
    chi_nhanh_id: data.id_chi_nhanh || null,
    email: data.email?.trim() || null,
    so_dien_thoai: data.so_dien_thoai?.trim() || null,
    gioi_tinh: data.gioi_tinh || null,
    ngay_vao_lam: data.ngay_vao_lam || null,
    ngay_sinh: data.ngay_sinh || null,
    cmnd_cccd: data.cmnd_cccd || null,
    ngay_cap_cccd: data.ngay_cap_cccd || null,
    noi_cap_cccd: data.noi_cap_cccd || null,
    quoc_tich: data.quoc_tich || null,
    dan_toc: data.dan_toc || null,
    ton_giao: data.ton_giao || null,
    tinh_thanh: data.tinh_thanh || null,
    quan_huyen: data.quan_huyen || null,
    phuong_xa: data.phuong_xa || null,
    dia_chi_cu_the: data.dia_chi_cu_the || null,
    dia_chi_tam_tru: data.dia_chi_tam_tru || null,
    loai_hop_dong: data.loai_hop_dong || null,
    ngay_het_han_hd: data.ngay_het_han_hd || null,
    noi_lam_viec: data.noi_lam_viec || null,
    nguoi_lien_he_khan_cap: data.nguoi_lien_he_khan_cap || null,
    sdt_khan_cap: data.sdt_khan_cap || null,
    quan_he_khan_cap: data.quan_he_khan_cap || null,
    tinh_trang_hon_nhan: data.tinh_trang_hon_nhan || null,
    so_nguoi_phu_thuoc: data.so_nguoi_phu_thuoc ?? null,
    trinh_do_hoc_van: data.trinh_do_hoc_van || null,
    chuyen_nganh: data.chuyen_nganh || null,
    truong_hoc: data.truong_hoc || null,
    nam_tot_nghiep: data.nam_tot_nghiep || null,
    chung_chi: data.chung_chi || null,
    so_tai_khoan: data.so_tai_khoan || null,
    ten_ngan_hang: data.ten_ngan_hang || null,
    chi_nhanh_nh: data.chi_nhanh_nh || null,
    ma_so_thue_ca_nhan: data.ma_so_thue_ca_nhan || null,
    so_bhxh: data.so_bhxh || null,
    so_bhyt: data.so_bhyt || null,
    ngay_tham_gia_bh: data.ngay_tham_gia_bh || null,
    noi_dang_ky_kcb: data.noi_dang_ky_kcb || null,
    cap_bac_id: data.id_cap_bac || null,
  };
}

export const getEmployees = async (): Promise<Employee[]> => {
  const data = await fetchAllRows<NhanVienRow>((from, to) =>
    supabase.from(TABLE).select('*').order('id', { ascending: false }).range(from, to)
  );
  const employees = data.map(rowToEmployee);
  const [positions, depts, branches] = await Promise.all([getPositions(), getDepartments(), getBranches()]);
  employees.forEach((emp) => {
    emp.ten_chuc_vu = positions.find((p) => p.id === emp.id_chuc_vu)?.ten_chuc_vu;
    emp.ten_phong_ban = depts.find((d) => d.id === emp.id_phong_ban)?.ten_phong_ban;
    emp.ten_chi_nhanh = branches.find((b) => b.id === emp.id_chi_nhanh)?.ten_chi_nhanh;
  });
  return employees;
};

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return undefined;
  const emp = rowToEmployee(data);
  const [positions, depts, branches] = await Promise.all([getPositions(), getDepartments(), getBranches()]);
  emp.ten_chuc_vu = positions.find((p) => p.id === emp.id_chuc_vu)?.ten_chuc_vu;
  emp.ten_phong_ban = depts.find((d) => d.id === emp.id_phong_ban)?.ten_phong_ban;
  emp.ten_chi_nhanh = branches.find((b) => b.id === emp.id_chi_nhanh)?.ten_chi_nhanh;
  return emp;
};

export const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
  if (!email?.trim()) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const emp = rowToEmployee(data);
  const [positions, depts, branches] = await Promise.all([getPositions(), getDepartments(), getBranches()]);
  emp.ten_chuc_vu = positions.find((p) => p.id === emp.id_chuc_vu)?.ten_chuc_vu;
  emp.ten_phong_ban = depts.find((d) => d.id === emp.id_phong_ban)?.ten_phong_ban;
  emp.ten_chi_nhanh = branches.find((b) => b.id === emp.id_chi_nhanh)?.ten_chi_nhanh;
  return emp;
};

export const createEmployee = async (data: EmployeeFormValues): Promise<Employee & { _authCreated?: boolean }> => {
  const emailVal = data.email?.trim().toLowerCase();
  if (emailVal) {
    const { data: dup } = await supabase
      .from(TABLE)
      .select('id')
      .ilike('email', emailVal)
      .maybeSingle();
    if (dup) throw new Error(i18n.t('employee.validation.emailDuplicate'));
  }

  let authCreated = false;
  if (emailVal) {
    const result = await ensureAuthUser(data.email);
    authCreated = result.created;
  }

  const row = formToRow(data);
  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const emp: Employee & { _authCreated?: boolean } = rowToEmployee(inserted);
  emp._authCreated = authCreated;
  const [positions, depts, branches] = await Promise.all([getPositions(), getDepartments(), getBranches()]);
  emp.ten_chuc_vu = positions.find((p) => p.id === emp.id_chuc_vu)?.ten_chuc_vu;
  emp.ten_phong_ban = depts.find((d) => d.id === emp.id_phong_ban)?.ten_phong_ban;
  emp.ten_chi_nhanh = branches.find((b) => b.id === emp.id_chi_nhanh)?.ten_chi_nhanh;
  return emp;
};

export const updateEmployee = async (id: string, data: EmployeeFormValues): Promise<Employee & { _authCreated?: boolean }> => {
  let authCreated = false;
  const newEmail = data.email?.trim().toLowerCase() || '';

  if (newEmail) {
    const { data: current } = await supabase
      .from(TABLE)
      .select('id, email')
      .ilike('email', newEmail)
      .maybeSingle();
    if (current && String((current as Record<string, unknown>).id) !== id) {
      throw new Error(i18n.t('employee.validation.emailDuplicate'));
    }

    const { data: self } = await supabase
      .from(TABLE)
      .select('email')
      .eq('id', id)
      .maybeSingle();
    const oldEmail = ((self as Record<string, unknown>)?.email as string ?? '').trim().toLowerCase();
    if (newEmail !== oldEmail) {
      const result = await ensureAuthUser(data.email);
      authCreated = result.created;
    }
  }

  const row = formToRow(data);
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message ?? i18n.t('employee.service.notFound'));
  const emp: Employee & { _authCreated?: boolean } = rowToEmployee(updated);
  emp._authCreated = authCreated;
  const [positions, depts, branches] = await Promise.all([getPositions(), getDepartments(), getBranches()]);
  emp.ten_chuc_vu = positions.find((p) => p.id === emp.id_chuc_vu)?.ten_chuc_vu;
  emp.ten_phong_ban = depts.find((d) => d.id === emp.id_phong_ban)?.ten_phong_ban;
  emp.ten_chi_nhanh = branches.find((b) => b.id === emp.id_chi_nhanh)?.ten_chi_nhanh;
  return emp;
};

export const updateEmployeeStatus = async (ids: string[], status: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE)
    .update({ trang_thai: status })
    .in('id', ids);

  if (error) throw new Error(error.message);
};

export const bulkUpdateEmployees = async (ids: string[], fields: Record<string, unknown>): Promise<void> => {
  const row: NhanVienRow = {};
  if (fields.id_phong_ban != null) row.phong_ban_id = fields.id_phong_ban;
  if (fields.id_chuc_vu != null) row.chuc_vu_id = fields.id_chuc_vu;
  if (fields.id_chi_nhanh != null) row.chi_nhanh_id = fields.id_chi_nhanh;
  if (fields.id_cap_bac != null) row.cap_bac_id = fields.id_cap_bac;
  if (fields.trang_thai != null) row.trang_thai = fields.trang_thai;
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from(TABLE)
    .update(row)
    .in('id', ids);

  if (error) throw new Error(error.message);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteEmployees = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', ids);
  if (error) throw new Error(error.message);
};

export const restoreEmployees = async (_employees: Employee[]): Promise<void> => {
  // No-op when using Supabase
};
