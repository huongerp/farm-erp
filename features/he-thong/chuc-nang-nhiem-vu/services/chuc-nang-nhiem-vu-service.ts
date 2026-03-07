import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import type { DeptMission, DeptFunction, Task } from '../core/types';
import type { MissionFormValues, FunctionFormValues, TaskFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

// --- Mock: Sứ mệnh / Chức năng / Nhiệm vụ cho các phòng cấp 1 (dep-0..dep-7) ---
let dbMissions: DeptMission[] = [
  { id: 'm0', id_phong_ban: 'dep-0', noi_dung: 'Sứ mệnh Phòng Ban Giám đốc: Định hướng chiến lược, điều hành toàn công ty và đảm bảo hiệu quả hoạt động.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm1', id_phong_ban: 'dep-1', noi_dung: 'Sứ mệnh Phòng Kỹ thuật: Xây dựng và vận hành nền tảng công nghệ tin cậy.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm2', id_phong_ban: 'dep-2', noi_dung: 'Sứ mệnh Phòng Nhân sự: Thu hút, phát triển và giữ chân nhân tài.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm3', id_phong_ban: 'dep-3', noi_dung: 'Sứ mệnh Phòng Tài chính - Kế toán: Minh bạch tài chính, tối ưu nguồn lực và tuân thủ pháp luật.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm4', id_phong_ban: 'dep-4', noi_dung: 'Sứ mệnh Phòng Kinh doanh: Mở rộng thị trường, chăm sóc khách hàng và tăng doanh thu bền vững.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm5', id_phong_ban: 'dep-5', noi_dung: 'Sứ mệnh Phòng Kho vận: Đảm bảo tồn kho chính xác, giao nhận đúng hạn và tối ưu chi phí logistics.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm6', id_phong_ban: 'dep-6', noi_dung: 'Sứ mệnh Phòng Marketing: Xây dựng thương hiệu, thu hút khách hàng và hỗ trợ bán hàng hiệu quả.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'm7', id_phong_ban: 'dep-7', noi_dung: 'Sứ mệnh Phòng Hành chính: Phục vụ nội bộ, đảm bảo văn phòng vận hành trơn tru và hỗ trợ toàn công ty.', thu_tu: 0, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
];

let dbFunctions: DeptFunction[] = [
  { id: 'f0a', id_phong_ban: 'dep-0', ma_chuc_nang: 'CN_CHIEN_LUOC', ten_chuc_nang: 'Hoạch định chiến lược', mo_ta: 'Xây dựng và triển khai chiến lược công ty', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f0b', id_phong_ban: 'dep-0', ma_chuc_nang: 'CN_DIEU_HANH', ten_chuc_nang: 'Điều hành và giám sát', mo_ta: 'Điều phối hoạt động các phòng ban', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f1', id_phong_ban: 'dep-1', ma_chuc_nang: 'CN_DEV', ten_chuc_nang: 'Phát triển phần mềm', mo_ta: 'Phát triển và bảo trì sản phẩm', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f2', id_phong_ban: 'dep-1', ma_chuc_nang: 'CN_OPS', ten_chuc_nang: 'Vận hành hệ thống', mo_ta: 'Vận hành hạ tầng và DevOps', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f3', id_phong_ban: 'dep-2', ma_chuc_nang: 'CN_TD', ten_chuc_nang: 'Tuyển dụng', mo_ta: 'Tuyển dụng và onboarding', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f3b', id_phong_ban: 'dep-2', ma_chuc_nang: 'CN_DT', ten_chuc_nang: 'Đào tạo và phát triển', mo_ta: 'Đào tạo nội bộ và lộ trình nghề nghiệp', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f4', id_phong_ban: 'dep-3', ma_chuc_nang: 'CN_KT', ten_chuc_nang: 'Kế toán và báo cáo', mo_ta: 'Kế toán tài chính, báo cáo thuế', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f5', id_phong_ban: 'dep-3', ma_chuc_nang: 'CN_TC', ten_chuc_nang: 'Quản lý tài chính', mo_ta: 'Dự báo, ngân sách và dòng tiền', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f6', id_phong_ban: 'dep-4', ma_chuc_nang: 'CN_KD_B2B', ten_chuc_nang: 'Kinh doanh B2B', mo_ta: 'Chăm sóc khách hàng doanh nghiệp', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f7', id_phong_ban: 'dep-4', ma_chuc_nang: 'CN_KD_B2C', ten_chuc_nang: 'Kinh doanh B2C', mo_ta: 'Bán hàng và chăm sóc khách lẻ', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f8', id_phong_ban: 'dep-5', ma_chuc_nang: 'CN_NHAP_KHO', ten_chuc_nang: 'Nhập kho và kiểm nhận', mo_ta: 'Tiếp nhận, kiểm tra và nhập kho', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f9', id_phong_ban: 'dep-5', ma_chuc_nang: 'CN_XUAT_KHO', ten_chuc_nang: 'Xuất kho và giao hàng', mo_ta: 'Đơn hàng, đóng gói và giao nhận', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f10', id_phong_ban: 'dep-6', ma_chuc_nang: 'CN_DIGITAL', ten_chuc_nang: 'Marketing số', mo_ta: 'Quảng cáo, content và SEO', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f11', id_phong_ban: 'dep-6', ma_chuc_nang: 'CN_BRAND', ten_chuc_nang: 'Thương hiệu và truyền thông', mo_ta: 'Nhận diện thương hiệu, PR', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f12', id_phong_ban: 'dep-7', ma_chuc_nang: 'CN_VAN_PHONG', ten_chuc_nang: 'Văn phòng và tài sản', mo_ta: 'Văn thư, tài sản, hậu cần', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'f13', id_phong_ban: 'dep-7', ma_chuc_nang: 'CN_SU_KIEN', ten_chuc_nang: 'Tổ chức sự kiện', mo_ta: 'Sự kiện nội bộ và đối ngoại', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
];

let dbTasks: Task[] = [
  { id: 't0a', id_chuc_nang: 'f0a', ma_nhiem_vu: 'NV_PT_CL', ten_nhiem_vu: 'Phân tích và đề xuất chiến lược', mo_ta: null, nhom_chiu_trach_nhiem: 'admin', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't0b', id_chuc_nang: 'f0b', ma_nhiem_vu: 'NV_GS_TT', ten_nhiem_vu: 'Giám sát tiến độ toàn công ty', mo_ta: null, nhom_chiu_trach_nhiem: 'admin', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't1', id_chuc_nang: 'f1', ma_nhiem_vu: 'NV_CODE', ten_nhiem_vu: 'Viết mã và code review', mo_ta: null, nhom_chiu_trach_nhiem: 'technical', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't2', id_chuc_nang: 'f1', ma_nhiem_vu: 'NV_TEST', ten_nhiem_vu: 'Kiểm thử và đảm bảo chất lượng', mo_ta: null, nhom_chiu_trach_nhiem: 'technical', thu_tu: 2, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't3', id_chuc_nang: 'f2', ma_nhiem_vu: 'NV_DEPLOY', ten_nhiem_vu: 'Triển khai và giám sát', mo_ta: null, nhom_chiu_trach_nhiem: 'operations', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't4', id_chuc_nang: 'f3', ma_nhiem_vu: 'NV_PV', ten_nhiem_vu: 'Phỏng vấn ứng viên', mo_ta: null, nhom_chiu_trach_nhiem: 'hr', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't4b', id_chuc_nang: 'f3b', ma_nhiem_vu: 'NV_DT', ten_nhiem_vu: 'Xây dựng chương trình đào tạo', mo_ta: null, nhom_chiu_trach_nhiem: 'hr', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't5', id_chuc_nang: 'f4', ma_nhiem_vu: 'NV_KT_TC', ten_nhiem_vu: 'Ghi sổ kế toán và đối chiếu', mo_ta: null, nhom_chiu_trach_nhiem: 'finance', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't6', id_chuc_nang: 'f5', ma_nhiem_vu: 'NV_DB_NS', ten_nhiem_vu: 'Lập dự báo và ngân sách', mo_ta: null, nhom_chiu_trach_nhiem: 'finance', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't7', id_chuc_nang: 'f6', ma_nhiem_vu: 'NV_CSKH', ten_nhiem_vu: 'Chăm sóc khách hàng B2B', mo_ta: null, nhom_chiu_trach_nhiem: 'sales', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't8', id_chuc_nang: 'f7', ma_nhiem_vu: 'NV_BAN_LE', ten_nhiem_vu: 'Bán hàng và tư vấn B2C', mo_ta: null, nhom_chiu_trach_nhiem: 'sales', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't9', id_chuc_nang: 'f8', ma_nhiem_vu: 'NV_KN_NHAP', ten_nhiem_vu: 'Kiểm nhận và nhập kho', mo_ta: null, nhom_chiu_trach_nhiem: 'operations', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't10', id_chuc_nang: 'f9', ma_nhiem_vu: 'NV_XUAT_GIAO', ten_nhiem_vu: 'Xuất kho và giao hàng', mo_ta: null, nhom_chiu_trach_nhiem: 'operations', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't11', id_chuc_nang: 'f10', ma_nhiem_vu: 'NV_CONTENT', ten_nhiem_vu: 'Sản xuất nội dung và quảng cáo', mo_ta: null, nhom_chiu_trach_nhiem: 'other', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't12', id_chuc_nang: 'f11', ma_nhiem_vu: 'NV_PR', ten_nhiem_vu: 'Truyền thông và quan hệ báo chí', mo_ta: null, nhom_chiu_trach_nhiem: 'other', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't13', id_chuc_nang: 'f12', ma_nhiem_vu: 'NV_VT_TS', ten_nhiem_vu: 'Văn thư và quản lý tài sản', mo_ta: null, nhom_chiu_trach_nhiem: 'admin', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 't14', id_chuc_nang: 'f13', ma_nhiem_vu: 'NV_TO_CHUC', ten_nhiem_vu: 'Tổ chức sự kiện nội bộ', mo_ta: null, nhom_chiu_trach_nhiem: 'admin', thu_tu: 1, trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
];

export const getMissions = async (): Promise<DeptMission[]> => {
  await delay(400);
  return [...dbMissions].sort((a, b) => a.thu_tu - b.thu_tu || a.id.localeCompare(b.id));
};

export const getMissionsByDepartment = async (idPhongBan: string): Promise<DeptMission[]> => {
  await delay(300);
  return dbMissions.filter((m) => m.id_phong_ban === idPhongBan).sort((a, b) => a.thu_tu - b.thu_tu);
};

/** Mỗi phòng ban chỉ có 1 sứ mệnh: trả về bản ghi đầu tiên hoặc null */
export const getOneMissionByDepartment = async (idPhongBan: string): Promise<DeptMission | null> => {
  await delay(300);
  const list = dbMissions.filter((m) => m.id_phong_ban === idPhongBan).sort((a, b) => a.thu_tu - b.thu_tu);
  return list[0] ?? null;
};

export const createMission = async (data: MissionFormValues): Promise<DeptMission> => {
  await delay(500);
  const newMission: DeptMission = {
    id: `m-${Date.now()}`,
    id_phong_ban: data.id_phong_ban,
    noi_dung: data.noi_dung,
    thu_tu: data.thu_tu,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  };
  dbMissions = [newMission, ...dbMissions];
  return newMission;
};

export const updateMission = async (id: string, data: MissionFormValues): Promise<DeptMission> => {
  await delay(500);
  const idx = dbMissions.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error(i18n.t('chucNangNhiemVu.service.missionNotFound'));
  const updated = { ...dbMissions[idx], ...data, trang_thai: data.trang_thai as 0 | 1, tg_cap_nhat: new Date().toISOString() };
  dbMissions[idx] = updated;
  return updated;
};

export const deleteMissions = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbMissions = dbMissions.filter((m) => !ids.includes(m.id));
};

// --- Chức năng phòng ban ---
export const getFunctions = async (): Promise<DeptFunction[]> => {
  await delay(400);
  return [...dbFunctions].sort((a, b) => a.thu_tu - b.thu_tu || a.ten_chuc_nang.localeCompare(b.ten_chuc_nang));
};

export const getFunctionsByDepartment = async (idPhongBan: string): Promise<DeptFunction[]> => {
  await delay(300);
  return dbFunctions.filter((f) => f.id_phong_ban === idPhongBan).sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createFunction = async (data: FunctionFormValues): Promise<DeptFunction> => {
  await delay(500);
  const newFn: DeptFunction = {
    id: `f-${Date.now()}`,
    id_phong_ban: data.id_phong_ban,
    ma_chuc_nang: data.ma_chuc_nang,
    ten_chuc_nang: data.ten_chuc_nang,
    mo_ta: data.mo_ta ?? null,
    thu_tu: data.thu_tu,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  };
  dbFunctions = [newFn, ...dbFunctions];
  return newFn;
};

export const updateFunction = async (id: string, data: FunctionFormValues): Promise<DeptFunction> => {
  await delay(500);
  const idx = dbFunctions.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error(i18n.t('chucNangNhiemVu.service.functionNotFound'));
  const updated = { ...dbFunctions[idx], ...data, mo_ta: data.mo_ta ?? null, trang_thai: data.trang_thai as 0 | 1, tg_cap_nhat: new Date().toISOString() };
  dbFunctions[idx] = updated;
  return updated;
};

export const deleteFunctions = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbFunctions = dbFunctions.filter((f) => !ids.includes(f.id));
};

export const updateFunctionStatus = async (ids: string[], status: 0 | 1): Promise<DeptFunction | undefined> => {
  await delay(400);
  let updated: DeptFunction | undefined;
  dbFunctions = dbFunctions.map((f) => {
    if (ids.includes(f.id)) {
      const next = { ...f, trang_thai: status, tg_cap_nhat: new Date().toISOString() };
      if (ids.length === 1) updated = next;
      return next;
    }
    return f;
  });
  return updated;
};

// --- Nhiệm vụ ---
export const getTasks = async (): Promise<Task[]> => {
  await delay(400);
  const funcMap = Object.fromEntries(dbFunctions.map((f) => [f.id, f]));
  return dbTasks
    .map((t) => ({ ...t, ten_chuc_nang: funcMap[t.id_chuc_nang]?.ten_chuc_nang, id_phong_ban: funcMap[t.id_chuc_nang]?.id_phong_ban }))
    .sort((a, b) => a.thu_tu - b.thu_tu || a.ten_nhiem_vu.localeCompare(b.ten_nhiem_vu));
};

export const getTasksByDepartment = async (idPhongBan: string): Promise<Task[]> => {
  await delay(300);
  const deptFuncIds = new Set(dbFunctions.filter((f) => f.id_phong_ban === idPhongBan).map((f) => f.id));
  const funcMap = Object.fromEntries(dbFunctions.map((f) => [f.id, f]));
  return dbTasks
    .filter((t) => deptFuncIds.has(t.id_chuc_nang))
    .map((t) => ({ ...t, ten_chuc_nang: funcMap[t.id_chuc_nang]?.ten_chuc_nang, id_phong_ban: funcMap[t.id_chuc_nang]?.id_phong_ban }))
    .sort((a, b) => a.thu_tu - b.thu_tu);
};

export const getTasksByFunction = async (idChucNang: string): Promise<Task[]> => {
  await delay(300);
  const fn = dbFunctions.find((f) => f.id === idChucNang);
  return dbTasks
    .filter((t) => t.id_chuc_nang === idChucNang)
    .map((t) => ({ ...t, ten_chuc_nang: fn?.ten_chuc_nang, id_phong_ban: fn?.id_phong_ban }))
    .sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createTask = async (data: TaskFormValues): Promise<Task> => {
  await delay(500);
  const newTask: Task = {
    id: `t-${Date.now()}`,
    id_chuc_nang: data.id_chuc_nang,
    ma_nhiem_vu: data.ma_nhiem_vu,
    ten_nhiem_vu: data.ten_nhiem_vu,
    mo_ta: data.mo_ta ?? null,
    nhom_chiu_trach_nhiem: data.nhom_chiu_trach_nhiem ?? null,
    thu_tu: data.thu_tu,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  };
  dbTasks = [newTask, ...dbTasks];
  return newTask;
};

export const updateTask = async (id: string, data: TaskFormValues): Promise<Task> => {
  await delay(500);
  const idx = dbTasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(i18n.t('chucNangNhiemVu.service.taskNotFound'));
  const updated = {
    ...dbTasks[idx],
    ...data,
    mo_ta: data.mo_ta ?? null,
    nhom_chiu_trach_nhiem: data.nhom_chiu_trach_nhiem ?? null,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbTasks[idx] = updated;
  return updated;
};

export const deleteTasks = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbTasks = dbTasks.filter((t) => !ids.includes(t.id));
};

export const updateTaskStatus = async (ids: string[], status: 0 | 1): Promise<Task | undefined> => {
  await delay(400);
  let updated: Task | undefined;
  dbTasks = dbTasks.map((t) => {
    if (ids.includes(t.id)) {
      const next = { ...t, trang_thai: status, tg_cap_nhat: new Date().toISOString() };
      if (ids.length === 1) updated = next;
      return next;
    }
    return t;
  });
  return updated;
};
