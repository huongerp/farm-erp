/**
 * Cấu hình module phân quyền theo 3 cấp: Chức năng → Nhóm module → Module.
 * Dữ liệu lấy theo menu thực tế trong app (hanh-chinh, nhan-su, kho-van, mua-hang, tai-chinh, kinh-doanh, marketing, dieu-hanh, he-thong).
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

const BASE = (path: string, slug: string) => `${path}/${slug}`;

/** Cấu hình Chức năng → Nhóm → Module (không dùng t(), chỉ key i18n) */
export const PERMISSION_FUNCTIONS: PermissionFunction[] = [
  {
    id: 'hanh-chinh',
    nameKey: 'nav.hanhChinh',
    color: 'amber',
    groups: [
      { groupTitleKey: 'page.hanhChinh.groupCongLuong', modules: [
        { id: BASE('hanh-chinh', 'cham-cong'), nameKey: 'page.hanhChinh.modules.chamCong' },
        { id: BASE('hanh-chinh', 'tong-hop-cham-cong'), nameKey: 'page.hanhChinh.modules.tongHopChamCong' },
        { id: BASE('hanh-chinh', 'phieu-hanh-chinh'), nameKey: 'page.hanhChinh.modules.phieuHanhChinh' },
        { id: BASE('hanh-chinh', 'cham-diem-kpi'), nameKey: 'page.hanhChinh.modules.chamDiemKpi' },
        { id: BASE('hanh-chinh', 'bang-luong'), nameKey: 'page.hanhChinh.modules.bangLuong' },
        { id: BASE('hanh-chinh', 'diem-cong-tru'), nameKey: 'page.hanhChinh.modules.diemCongTru' },
        { id: BASE('hanh-chinh', 'thiet-lap-cong-luong'), nameKey: 'page.hanhChinh.modules.thietLapCongLuong' },
      ]},
      { groupTitleKey: 'page.hanhChinh.groupTaiLieu', modules: [
        { id: BASE('hanh-chinh', 'danh-sach-tai-lieu'), nameKey: 'page.hanhChinh.modules.danhSachTaiLieu' },
        { id: BASE('hanh-chinh', 'luu-tru-ho-so'), nameKey: 'page.hanhChinh.modules.luuTruHoSo' },
        { id: BASE('hanh-chinh', 'thiet-lap-tai-lieu'), nameKey: 'page.hanhChinh.modules.thietLapTaiLieu' },
      ]},
      { groupTitleKey: 'page.hanhChinh.groupCongViec', modules: [
        { id: BASE('hanh-chinh', 'du-an'), nameKey: 'page.hanhChinh.modules.duAn' },
        { id: BASE('hanh-chinh', 'cong-viec-cua-toi'), nameKey: 'page.hanhChinh.modules.congViecCuaToi' },
        { id: BASE('hanh-chinh', 'cong-viec-toi-quan-ly'), nameKey: 'page.hanhChinh.modules.congViecToiQuanLy' },
        { id: BASE('hanh-chinh', 'bao-cao'), nameKey: 'page.hanhChinh.modules.baoCao' },
        { id: BASE('hanh-chinh', 'thiet-lap-cong-viec'), nameKey: 'page.hanhChinh.modules.thietLapCongViec' },
      ]},
      { groupTitleKey: 'page.hanhChinh.groupTaiSan', modules: [
        { id: BASE('hanh-chinh', 'danh-sach-tai-san'), nameKey: 'page.hanhChinh.modules.danhSachTaiSan' },
        { id: BASE('hanh-chinh', 'cap-phat-thu-hoi'), nameKey: 'page.hanhChinh.modules.capPhatThuHoi' },
        { id: BASE('hanh-chinh', 'bao-tri-sua-chua'), nameKey: 'page.hanhChinh.modules.baoTriSuaChua' },
        { id: BASE('hanh-chinh', 'kiem-ke-tai-san'), nameKey: 'page.hanhChinh.modules.kiemKeTaiSan' },
        { id: BASE('hanh-chinh', 'khau-hao-tai-san'), nameKey: 'page.hanhChinh.modules.khauHaoTaiSan' },
        { id: BASE('hanh-chinh', 'noi-quan-ly'), nameKey: 'page.hanhChinh.modules.noiQuanLy' },
        { id: BASE('hanh-chinh', 'thiet-lap-tai-san'), nameKey: 'page.hanhChinh.modules.thietLapTaiSan' },
      ]},
      { groupTitleKey: 'page.hanhChinh.groupQuanLyXe', modules: [
        { id: BASE('hanh-chinh', 'danh-sach-xe'), nameKey: 'page.hanhChinh.modules.danhSachXe' },
        { id: BASE('hanh-chinh', 'dang-ky-su-dung-xe'), nameKey: 'page.hanhChinh.modules.dangKySuDungXe' },
        { id: BASE('hanh-chinh', 'lich-bao-duong'), nameKey: 'page.hanhChinh.modules.lichBaoDuong' },
        { id: BASE('hanh-chinh', 'phieu-xang-chi-phi-xe'), nameKey: 'page.hanhChinh.modules.phieuXangChiPhiXe' },
        { id: BASE('hanh-chinh', 'quan-ly-lai-xe'), nameKey: 'page.hanhChinh.modules.quanLyLaiXe' },
        { id: BASE('hanh-chinh', 'thiet-lap-quan-ly-xe'), nameKey: 'page.hanhChinh.modules.thietLapQuanLyXe' },
      ]},
    ],
  },
  {
    id: 'nhan-su',
    nameKey: 'nav.nhanSu',
    color: 'emerald',
    groups: [
      { groupTitleKey: 'page.nhanSu.groupTuyenDung', modules: [
        { id: BASE('nhan-su', 'de-xuat-tuyen-dung'), nameKey: 'page.nhanSu.modules.deXuatTuyenDung' },
        { id: BASE('nhan-su', 'ho-so-ung-vien'), nameKey: 'page.nhanSu.modules.hoSoUngVien' },
        { id: BASE('nhan-su', 'lich-phong-van'), nameKey: 'page.nhanSu.modules.lichPhongVan' },
        { id: BASE('nhan-su', 'thu-gui-ung-vien'), nameKey: 'page.nhanSu.modules.thuGuiUngVien' },
        { id: BASE('nhan-su', 'hop-dong'), nameKey: 'page.nhanSu.modules.hopDong' },
        { id: BASE('nhan-su', 'bao-cao-tuyen-dung'), nameKey: 'page.nhanSu.modules.baoCaoTuyenDung' },
        { id: BASE('nhan-su', 'thiet-lap-tuyen-dung'), nameKey: 'page.nhanSu.modules.thietLapTuyenDung' },
      ]},
      { groupTitleKey: 'page.nhanSu.groupDaoTao', modules: [
        { id: BASE('nhan-su', 'ke-hoach-dao-tao'), nameKey: 'page.nhanSu.modules.keHoachDaoTao' },
        { id: BASE('nhan-su', 'khoa-dao-tao'), nameKey: 'page.nhanSu.modules.khoaDaoTao' },
        { id: BASE('nhan-su', 'dang-ky-dao-tao'), nameKey: 'page.nhanSu.modules.dangKyDaoTao' },
        { id: BASE('nhan-su', 'bao-cao-dao-tao'), nameKey: 'page.nhanSu.modules.baoCaoDaoTao' },
        { id: BASE('nhan-su', 'thiet-lap-dao-tao'), nameKey: 'page.nhanSu.modules.thietLapDaoTao' },
      ]},
    ],
  },
  {
    id: 'kinh-doanh',
    nameKey: 'nav.kinhDoanh',
    color: 'blue',
    groups: [
      { groupTitleKey: 'page.kinhDoanh.groupCrmKhachHang', modules: [
        { id: BASE('kinh-doanh', 'danh-sach-khach-hang'), nameKey: 'page.kinhDoanh.modules.danhSachKhachHang' },
        { id: BASE('kinh-doanh', 'thiet-lap-crm'), nameKey: 'page.kinhDoanh.modules.thietLapCrm' },
        { id: BASE('kinh-doanh', 'ban-do-khach-hang'), nameKey: 'page.kinhDoanh.modules.banDoKhachHang' },
        { id: BASE('kinh-doanh', 'lich-cham-soc'), nameKey: 'page.kinhDoanh.modules.lichChamSoc' },
      ]},
      { groupTitleKey: 'page.kinhDoanh.groupBanHangDonHang', modules: [
        { id: BASE('kinh-doanh', 'co-hoi-ban-hang'), nameKey: 'page.kinhDoanh.modules.coHoiBanHang' },
        { id: BASE('kinh-doanh', 'don-hang-ban'), nameKey: 'page.kinhDoanh.modules.donHangBan' },
        { id: BASE('kinh-doanh', 'bang-gia'), nameKey: 'page.kinhDoanh.modules.bangGia' },
      ]},
      { groupTitleKey: 'page.kinhDoanh.groupBaoGiaHopDong', modules: [
        { id: BASE('kinh-doanh', 'bao-gia'), nameKey: 'page.kinhDoanh.modules.baoGia' },
        { id: BASE('kinh-doanh', 'hop-dong-ban'), nameKey: 'page.kinhDoanh.modules.hopDongBan' },
      ]},
      { groupTitleKey: 'page.kinhDoanh.groupCongNoThuTien', modules: [
        { id: BASE('kinh-doanh', 'cong-no-khach-hang'), nameKey: 'page.kinhDoanh.modules.congNoKhachHang' },
        { id: BASE('kinh-doanh', 'phieu-thu'), nameKey: 'page.kinhDoanh.modules.phieuThu' },
      ]},
      { groupTitleKey: 'page.kinhDoanh.groupBaoCao', modules: [
        { id: BASE('kinh-doanh', 'bao-cao-doanh-so'), nameKey: 'page.kinhDoanh.modules.baoCaoDoanhSo' },
        { id: BASE('kinh-doanh', 'bao-cao-cong-no'), nameKey: 'page.kinhDoanh.modules.baoCaoCongNo' },
      ]},
    ],
  },
  {
    id: 'marketing',
    nameKey: 'nav.marketing',
    color: 'pink',
    groups: [
      { groupTitleKey: 'page.marketing.groupChienDich', modules: [
        { id: BASE('marketing', 'chien-dich'), nameKey: 'page.marketing.modules.chienDich' },
        { id: BASE('marketing', 'email-marketing'), nameKey: 'page.marketing.modules.emailMarketing' },
        { id: BASE('marketing', 'sms-thong-bao'), nameKey: 'page.marketing.modules.smsThongBao' },
        { id: BASE('marketing', 'mang-xa-hoi'), nameKey: 'page.marketing.modules.mangXaHoi' },
        { id: BASE('marketing', 'bao-cao-chien-dich'), nameKey: 'page.marketing.modules.baoCaoChienDich' },
        { id: BASE('marketing', 'thiet-lap-chien-dich'), nameKey: 'page.marketing.modules.thietLapChienDich' },
      ]},
      { groupTitleKey: 'page.marketing.groupNoiDungTruyenThong', modules: [
        { id: BASE('marketing', 'quan-ly-noi-dung'), nameKey: 'page.marketing.modules.quanLyNoiDung' },
        { id: BASE('marketing', 'thu-vien-tai-san'), nameKey: 'page.marketing.modules.thuVienTaiSan' },
        { id: BASE('marketing', 'landing-page'), nameKey: 'page.marketing.modules.landingPage' },
        { id: BASE('marketing', 'form-thu-thap-lead'), nameKey: 'page.marketing.modules.formThuThapLead' },
        { id: BASE('marketing', 'thiet-lap-noi-dung'), nameKey: 'page.marketing.modules.thietLapNoiDung' },
      ]},
    ],
  },
  {
    id: 'tai-chinh',
    nameKey: 'nav.taiChinh',
    color: 'violet',
    groups: [
      { groupTitleKey: 'page.taiChinh.groupQuanLyChiPhi', modules: [
        { id: BASE('tai-chinh', 'de-xuat-chi-phi'), nameKey: 'page.taiChinh.modules.deXuatChiPhi' },
        { id: BASE('tai-chinh', 'ke-hoach-chi-phi'), nameKey: 'page.taiChinh.modules.keHoachChiPhi' },
      ]},
      { groupTitleKey: 'page.taiChinh.groupQuanLyTaiChinh', modules: [
        { id: BASE('tai-chinh', 'danh-muc-tai-chinh'), nameKey: 'page.taiChinh.modules.danhMucTaiChinh' },
        { id: BASE('tai-chinh', 'tai-khoan'), nameKey: 'page.taiChinh.modules.taiKhoan' },
        { id: BASE('tai-chinh', 'thu-chi'), nameKey: 'page.taiChinh.modules.thuChi' },
        { id: BASE('tai-chinh', 'bao-cao-tai-chinh'), nameKey: 'page.taiChinh.modules.baoCaoTaiChinh' },
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
        { id: BASE('mua-hang', 'danh-sach-doi-tac'), nameKey: 'page.muaHang.modules.danhSachDoiTac' },
        { id: BASE('mua-hang', 'thanh-toan-doi-tac'), nameKey: 'page.muaHang.modules.thanhToanDoiTac' },
        { id: BASE('mua-hang', 'bao-cao-de-xuat-vat-tu'), nameKey: 'page.muaHang.modules.baoCaoDeXuatVatTu' },
        { id: BASE('mua-hang', 'thiet-lap-de-xuat-vat-tu'), nameKey: 'page.muaHang.modules.thietLapDeXuatVatTu' },
      ]},
    ],
  },
  {
    id: 'kho-van',
    nameKey: 'nav.khoVan',
    color: 'cyan',
    groups: [
      { groupTitleKey: 'page.khoVan.groupNhapXuatKho', modules: [
        { id: BASE('kho-van', 'phieu-kho'), nameKey: 'page.khoVan.modules.phieuKho' },
        { id: BASE('kho-van', 'phieu-de-xuat-vat-tu'), nameKey: 'page.khoVan.modules.phieuDeXuatVatTu' },
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
    id: 'dieu-hanh',
    nameKey: 'nav.dieuHanh',
    color: 'teal',
    groups: [
      { groupTitleKey: 'page.dieuHanh.groupDinhHuongPhanTich', modules: [
        { id: BASE('dieu-hanh', 'su-menh-tam-nhin'), nameKey: 'page.dieuHanh.modules.suMenhTamNhin' },
        { id: BASE('dieu-hanh', 'tam-nhin-quy-mo-thi-phan'), nameKey: 'page.dieuHanh.modules.tamNhinQuyMoThiPhan' },
        { id: BASE('dieu-hanh', 'phan-tich-doi-thu'), nameKey: 'page.dieuHanh.modules.phanTichDoiThu' },
        { id: BASE('dieu-hanh', 'phan-tich-swot'), nameKey: 'page.dieuHanh.modules.phanTichSwot' },
      ]},
      { groupTitleKey: 'page.dieuHanh.groupChienLuocVaKpi', modules: [
        { id: BASE('dieu-hanh', 'chien-luoc'), nameKey: 'page.dieuHanh.modules.chienLuoc' },
        { id: BASE('dieu-hanh', 'hanh-dong-cot-loi'), nameKey: 'page.dieuHanh.modules.hanhDongCotLoi' },
        { id: BASE('dieu-hanh', 'tieu-chi-kpi'), nameKey: 'page.dieuHanh.modules.tieuChiKpi' },
        { id: BASE('dieu-hanh', 'theo-doi-danh-gia'), nameKey: 'page.dieuHanh.modules.theoDoiDanhGia' },
      ]},
    ],
  },
  {
    id: 'he-thong',
    nameKey: 'nav.system',
    color: 'slate',
    groups: [
      { groupTitleKey: 'permission.matrix.systemGroup', modules: [
        { id: 'he-thong/nhan-vien', nameKey: 'permission.module.employeeList' },
        { id: 'he-thong/phong-ban', nameKey: 'permission.module.departmentChart' },
        { id: 'he-thong/chuc-vu', nameKey: 'permission.module.positionRole' },
        { id: 'he-thong/cap-bac', nameKey: 'permission.module.jobLevel' },
        { id: 'he-thong/thong-tin-cong-ty', nameKey: 'permission.module.companyInfo' },
        { id: 'he-thong/chi-nhanh', nameKey: 'permission.module.branch' },
        { id: 'he-thong/chuc-nang-nhiem-vu', nameKey: 'permission.module.functionTask' },
        { id: 'he-thong/sao-luu', nameKey: 'permission.module.dataSecurity' },
        { id: 'he-thong/thiet-bi-dang-nhap', nameKey: 'permission.module.loginDevice' },
        { id: 'he-thong/phan-quyen', nameKey: 'permission.module.permission' },
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
