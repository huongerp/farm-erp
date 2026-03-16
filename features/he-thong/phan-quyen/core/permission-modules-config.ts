/**
 * Cấu hình module phân quyền theo 3 cấp: Chức năng → Nhóm module → Module.
 * Chỉ giữ các module đang hiển thị trên submenu: hanh-chinh, mua-hang (gồm kho-van), he-thong.
 * Các module đã ẩn (nhan-su, kinh-doanh, marketing, tai-chinh, dieu-hanh) đã được xoá.
 */

export interface PermissionModuleItem {
  id: string;
  nameKey: string;
}

export interface PermissionModuleGroup {
  groupTitleKey: string;
  modules: PermissionModuleItem[];
}

export interface PermissionFunction {
  id: string;
  nameKey: string;
  color: string;
  groups: PermissionModuleGroup[];
}

/** 6 quyền dùng cho tất cả module: Xem, Thêm, Sửa, Xoá, Quản trị, Tất cả */
export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete', 'admin', 'all'] as const;
export type PermissionActionType = (typeof PERMISSION_ACTIONS)[number];

/** Quyền phê duyệt – chỉ hiển thị cho module có chức năng phê duyệt */
export const APPROVE_ACTION = 'approve' as const;

/** Module có chức năng phê duyệt (nút Duyệt/Phê duyệt trên giao diện) */
export const MODULES_WITH_APPROVE = new Set<string>([
  'kho-van/phieu-kho',
  'kho-van/phieu-de-xuat-vat-tu',
  'mua-hang/don-dat-hang',
  'mua-hang/thanh-toan-doi-tac',
]);

export function hasApproveFeature(moduleId: string): boolean {
  return MODULES_WITH_APPROVE.has(moduleId);
}

const BASE = (path: string, slug: string) => `${path}/${slug}`;

/** Cấu hình Chức năng → Nhóm → Module (không dùng t(), chỉ key i18n) */
export const PERMISSION_FUNCTIONS: PermissionFunction[] = [
  {
    id: 'hanh-chinh',
    nameKey: 'nav.hanhChinh',
    color: 'amber',
    groups: [
      { groupTitleKey: 'page.hanhChinh.groupCongLuong', modules: [
        { id: BASE('hanh-chinh', 'cong-viec'), nameKey: 'page.hanhChinh.modules.congViec' },
        { id: BASE('hanh-chinh', 'phieu-hanh-chinh'), nameKey: 'page.hanhChinh.modules.phieuHanhChinh' },
        { id: BASE('hanh-chinh', 'bang-luong'), nameKey: 'page.hanhChinh.modules.bangLuong' },
        { id: BASE('hanh-chinh', 'diem-cong-tru'), nameKey: 'page.hanhChinh.modules.diemCongTru' },
        { id: BASE('hanh-chinh', 'thiet-lap-cong-luong'), nameKey: 'page.hanhChinh.modules.thietLapCongLuong' },
      ]},
      { groupTitleKey: 'page.hanhChinh.groupTaiSan', modules: [
        { id: BASE('hanh-chinh', 'danh-sach-tai-san'), nameKey: 'page.hanhChinh.modules.danhSachTaiSan' },
        { id: BASE('hanh-chinh', 'cap-phat-thu-hoi'), nameKey: 'page.hanhChinh.modules.capPhatThuHoi' },
        { id: BASE('hanh-chinh', 'chi-phi-tai-san'), nameKey: 'page.hanhChinh.modules.baoTriSuaChua' },
        { id: BASE('hanh-chinh', 'kiem-ke-tai-san'), nameKey: 'page.hanhChinh.modules.kiemKeTaiSan' },
        { id: BASE('hanh-chinh', 'khau-hao-tai-san'), nameKey: 'page.hanhChinh.modules.khauHaoTaiSan' },
        { id: BASE('hanh-chinh', 'noi-quan-ly'), nameKey: 'page.hanhChinh.modules.noiQuanLy' },
        { id: BASE('hanh-chinh', 'thiet-lap-tai-san'), nameKey: 'page.hanhChinh.modules.thietLapTaiSan' },
      ]},
    ],
  },
  {
    id: 'mua-hang',
    nameKey: 'nav.muaHang',
    color: 'orange',
    groups: [
      { groupTitleKey: 'page.muaHang.groupDeXuatVatTu', modules: [
        { id: BASE('mua-hang', 'phieu-de-xuat-vat-tu'), nameKey: 'page.muaHang.modules.phieuDeXuatVatTu' },
        { id: BASE('mua-hang', 'don-dat-hang'), nameKey: 'page.muaHang.modules.donDatHang' },
        { id: BASE('mua-hang', 'thanh-toan-doi-tac'), nameKey: 'page.muaHang.modules.thanhToanDoiTac' },
        { id: BASE('mua-hang', 'bao-cao-de-xuat-vat-tu'), nameKey: 'page.muaHang.modules.baoCaoDeXuatVatTu' },
        { id: BASE('mua-hang', 'thiet-lap-de-xuat-vat-tu'), nameKey: 'page.muaHang.modules.thietLapDeXuatVatTu' },
      ]},
      { groupTitleKey: 'page.khoVan.groupNhapXuatKho', modules: [
        { id: BASE('kho-van', 'phieu-kho'), nameKey: 'page.khoVan.modules.phieuKho' },
        { id: BASE('kho-van', 'kiem-ke-kho'), nameKey: 'page.khoVan.modules.kiemKeKho' },
      ]},
      { groupTitleKey: 'page.khoVan.groupBaoCao', modules: [
        { id: BASE('kho-van', 'ton-kho'), nameKey: 'page.khoVan.modules.tonKho' },
        { id: BASE('kho-van', 'bao-cao-nhap-xuat-ton'), nameKey: 'page.khoVan.modules.baoCaoNhapXuatTon' },
      ]},
      { groupTitleKey: 'page.khoVan.groupThietLapVaDanhMuc', modules: [
        { id: BASE('kho-van', 'danh-muc-hang-hoa'), nameKey: 'page.khoVan.modules.danhMucHangHoa' },
        { id: BASE('kho-van', 'danh-sach-hang-hoa'), nameKey: 'page.khoVan.modules.danhSachHangHoa' },
        { id: BASE('kho-van', 'danh-sach-kho'), nameKey: 'page.khoVan.modules.danhSachKho' },
        { id: BASE('kho-van', 'danh-sach-doi-tac'), nameKey: 'page.khoVan.modules.danhSachDoiTac' },
      ]},
    ],
  },
  {
    id: 'he-thong',
    nameKey: 'nav.system',
    color: 'slate',
    groups: [
      { groupTitleKey: 'page.systemDashboard.orgChartGroup', modules: [
        { id: 'he-thong/phong-ban', nameKey: 'permission.module.departmentChart' },
        { id: 'he-thong/cap-bac', nameKey: 'permission.module.jobLevel' },
        { id: 'he-thong/chuc-vu', nameKey: 'permission.module.positionRole' },
        { id: 'he-thong/nhan-vien', nameKey: 'permission.module.employeeList' },
      ]},
      { groupTitleKey: 'page.systemDashboard.securityGroup', modules: [
        { id: 'he-thong/thong-tin-cong-ty', nameKey: 'permission.module.companyInfo' },
        { id: 'he-thong/chi-nhanh', nameKey: 'permission.module.branch' },
        { id: 'he-thong/phan-quyen', nameKey: 'permission.module.permission' },
        { id: 'he-thong/sao-luu', nameKey: 'permission.module.dataSecurity' },
        { id: 'he-thong/thiet-bi-dang-nhap', nameKey: 'permission.module.loginDevice' },
      ]},
    ],
  },
];

/** Danh sách phẳng tất cả module (id, nameKey) cho service / quyen_han */
export function getAllPermissionModules(): { id: string; nameKey: string }[] {
  const list: { id: string; nameKey: string }[] = [];
  PERMISSION_FUNCTIONS.forEach((fn) => {
    fn.groups.forEach((gr) => {
      gr.modules.forEach((m) => list.push({ id: m.id, nameKey: m.nameKey }));
    });
  });
  return list;
}

/** Path submenu có phân quyền (khớp với SIDEBAR_MENU) */
const SUBMENU_PATHS_WITH_PERMISSION = ['/hanh-chinh', '/mua-hang', '/he-thong'] as const;

/**
 * Lấy danh sách module id thuộc một submenu theo path (vd: /hanh-chinh -> [hanh-chinh/cong-viec, ...]).
 * Path không có trong PERMISSION_FUNCTIONS thì trả về [].
 */
export function getModuleIdsBySubmenuPath(path: string): string[] {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const fn = PERMISSION_FUNCTIONS.find((f) => f.id === normalized);
  if (!fn) return [];
  const ids: string[] = [];
  fn.groups.forEach((gr) => {
    gr.modules.forEach((m) => ids.push(m.id));
  });
  return ids;
}

/** Trả về true nếu path là submenu dùng phân quyền (ẩn khi không có quyền xem module nào). */
export function isSubmenuWithPermission(path: string): boolean {
  return SUBMENU_PATHS_WITH_PERMISSION.includes(path as (typeof SUBMENU_PATHS_WITH_PERMISSION)[number]);
}

/** Slug thuộc nhóm kho-van trong config (URL /mua-hang nhưng module_id là kho-van/...) */
const KHO_VAN_SLUGS = new Set([
  'phieu-kho', 'kiem-ke-kho', 'ton-kho', 'bao-cao-nhap-xuat-ton',
  'danh-muc-hang-hoa', 'danh-sach-hang-hoa', 'danh-sach-kho', 'danh-sach-doi-tac',
]);

/**
 * Resolve (basePath, moduleSlug) từ URL sang permission module id.
 * VD: ('/hanh-chinh','cong-viec') -> 'hanh-chinh/cong-viec'; ('/mua-hang','phieu-kho') -> 'kho-van/phieu-kho'.
 */
export function getPermissionModuleId(basePath: string, moduleSlug: string): string {
  const base = basePath.startsWith('/') ? basePath.slice(1) : basePath;
  if (base === 'mua-hang' && KHO_VAN_SLUGS.has(moduleSlug)) return `kho-van/${moduleSlug}`;
  return `${base}/${moduleSlug}`;
}

/**
 * Từ path module (vd: '/hanh-chinh/cong-viec', '/mua-hang/phieu-kho') trả về permission module id.
 * Dùng để lọc thẻ dashboard theo quyền xem.
 */
export function getPermissionModuleIdFromPath(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const parts = normalized.split('/');
  if (parts.length < 2) return '';
  return getPermissionModuleId(`/${parts[0]}`, parts[1]);
}
