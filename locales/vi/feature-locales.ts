/**
 * Feature locale vi — gộp static lúc startup (file co-location tại features/.../locales/vi.json).
 * Khi thêm module mới: thêm import + spread ở đây.
 */
import hanhChinh_baoTriSuaChua from '../../features/hanh-chinh/bao-tri-sua-chua/locales/vi.json';
import hanhChinh_capPhatThuHoi from '../../features/hanh-chinh/cap-phat-thu-hoi/locales/vi.json';
import hanhChinh_danhMucTaiSan from '../../features/hanh-chinh/danh-muc-tai-san/locales/vi.json';
import hanhChinh_khauHaoTaiSan from '../../features/hanh-chinh/khau-hao-tai-san/locales/vi.json';
import hanhChinh_kiemKeTaiSan from '../../features/hanh-chinh/kiem-ke-tai-san/locales/vi.json';
import hanhChinh_noiQuanLy from '../../features/hanh-chinh/noi-quan-ly/locales/vi.json';
import hanhChinh_thietLapTaiSan from '../../features/hanh-chinh/thiet-lap-tai-san/locales/vi.json';
import khoVan_baoCaoNhapXuatTon from '../../features/kho-van/bao-cao-nhap-xuat-ton/locales/vi.json';
import khoVan_danhMucHangHoa from '../../features/kho-van/danh-muc-hang-hoa/locales/vi.json';
import khoVan_danhSachDoiTac from '../../features/kho-van/danh-sach-doi-tac/locales/vi.json';
import khoVan_danhSachHangHoa from '../../features/kho-van/danh-sach-hang-hoa/locales/vi.json';
import khoVan_danhSachNhaCungCap from '../../features/kho-van/danh-sach-nha-cung-cap/locales/vi.json';
import khoVan_kiemKeKho from '../../features/kho-van/kiem-ke-kho/locales/vi.json';
import khoVan_phieuDeXuatVatTu from '../../features/kho-van/phieu-de-xuat-vat-tu/locales/vi.json';
import khoVan_phieuKho from '../../features/kho-van/phieu-kho/locales/vi.json';
import khoVan_phieuKiemKe from '../../features/kho-van/phieu-kiem-ke/locales/vi.json';
import khoVan_tonKho from '../../features/kho-van/ton-kho/locales/vi.json';
import muaHang_baoCaoDeXuatVatTu from '../../features/mua-hang/bao-cao-de-xuat-vat-tu/locales/vi.json';
import muaHang_donDatHang from '../../features/mua-hang/don-dat-hang/locales/vi.json';
import muaHang_quanLyHopDong from '../../features/mua-hang/quan-ly-hop-dong/locales/vi.json';
import muaHang_thanhToanDoiTac from '../../features/mua-hang/thanh-toan-doi-tac/locales/vi.json';
import muaHang_thietLapDeXuatVatTu from '../../features/mua-hang/thiet-lap-de-xuat-vat-tu/locales/vi.json';
import quanLyFarm_baoCaoNhanCong from '../../features/quan-ly-farm/bao-cao-nhan-cong/locales/vi.json';
import quanLyFarm_baoCaoSoChe from '../../features/quan-ly-farm/bao-cao-so-che/locales/vi.json';
import quanLyFarm_duBaoSlDongThung from '../../features/quan-ly-farm/du-bao-sl-dong-thung/locales/vi.json';
import quanLyFarm_hangHoaPhanThuoc from '../../features/quan-ly-farm/hang-hoa-phan-thuoc/locales/vi.json';
import quanLyFarm_phieuKhoPhanThuoc from '../../features/quan-ly-farm/phieu-kho-phan-thuoc/locales/vi.json';
import quanLyFarm_thongKeSanXuat from '../../features/quan-ly-farm/thong-ke-san-xuat/locales/vi.json';
import quanLyFarm_thuHoach from '../../features/quan-ly-farm/thu-hoach/locales/vi.json';
import quanLyFarm_tonKhoPhanThuoc from '../../features/quan-ly-farm/ton-kho-phan-thuoc/locales/vi.json';

const featureLocales = {
  ...(hanhChinh_baoTriSuaChua as Record<string, string>),
  ...(hanhChinh_capPhatThuHoi as Record<string, string>),
  ...(hanhChinh_danhMucTaiSan as Record<string, string>),
  ...(hanhChinh_khauHaoTaiSan as Record<string, string>),
  ...(hanhChinh_kiemKeTaiSan as Record<string, string>),
  ...(hanhChinh_noiQuanLy as Record<string, string>),
  ...(hanhChinh_thietLapTaiSan as Record<string, string>),
  ...(khoVan_baoCaoNhapXuatTon as Record<string, string>),
  ...(khoVan_danhMucHangHoa as Record<string, string>),
  ...(khoVan_danhSachDoiTac as Record<string, string>),
  ...(khoVan_danhSachHangHoa as Record<string, string>),
  ...(khoVan_danhSachNhaCungCap as Record<string, string>),
  ...(khoVan_kiemKeKho as Record<string, string>),
  ...(khoVan_phieuDeXuatVatTu as Record<string, string>),
  ...(khoVan_phieuKho as Record<string, string>),
  ...(khoVan_phieuKiemKe as Record<string, string>),
  ...(khoVan_tonKho as Record<string, string>),
  ...(muaHang_baoCaoDeXuatVatTu as Record<string, string>),
  ...(muaHang_donDatHang as Record<string, string>),
  ...(muaHang_quanLyHopDong as Record<string, string>),
  ...(muaHang_thanhToanDoiTac as Record<string, string>),
  ...(muaHang_thietLapDeXuatVatTu as Record<string, string>),
  ...(quanLyFarm_baoCaoNhanCong as Record<string, string>),
  ...(quanLyFarm_baoCaoSoChe as Record<string, string>),
  ...(quanLyFarm_duBaoSlDongThung as Record<string, string>),
  ...(quanLyFarm_hangHoaPhanThuoc as Record<string, string>),
  ...(quanLyFarm_phieuKhoPhanThuoc as Record<string, string>),
  ...(quanLyFarm_thongKeSanXuat as Record<string, string>),
  ...(quanLyFarm_thuHoach as Record<string, string>),
  ...(quanLyFarm_tonKhoPhanThuoc as Record<string, string>),
};

export default featureLocales;
