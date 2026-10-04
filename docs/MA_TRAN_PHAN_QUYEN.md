# Ma trận phân quyền

Sinh tự động từ `fp_var_phan_quyen` ngày 04/10/2026 bằng `bash scripts/xuat-ma-tran-quyen.sh` — đừng sửa tay.

**Toàn quyền mọi module** (không cần cấp từng dòng): nhân viên có cấp bậc 1, hoặc chức vụ có thứ tự (tt) = 1.
"Quản trị" / "Toàn quyền" trên một module bao gồm mọi quyền của module đó. Tầng DB kiểm cùng luật này
(`fn_co_quyen_module`) với các bảng: nhân viên, phân quyền, chức vụ, cấp bậc, bảng lương, tiêu chí GSCL.


## Tổng Giám Đốc — toàn quyền (tt = 1)

_1 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/cap-phat-thu-hoi` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/chi-phi-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/cong-viec` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/danh-sach-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/diem-cong-tru` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/khau-hao-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/kiem-ke-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/noi-quan-ly` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/phieu-hanh-chinh` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/thiet-lap-cong-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/thiet-lap-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/cap-bac` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/chi-nhanh` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/chuc-vu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/nhan-vien` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/phan-quyen` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/phong-ban` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/sao-luu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/thiet-bi-dang-nhap` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/thong-tin-cong-ty` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/bao-cao-nhap-xuat-ton` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-muc-hang-hoa` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-sach-doi-tac` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-sach-hang-hoa` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-sach-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/kiem-ke-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/phieu-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/ton-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/bao-cao-de-xuat-vat-tu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/don-dat-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/phieu-de-xuat-vat-tu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/quan-ly-hop-dong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/thanh-toan-doi-tac` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/thiet-lap-de-xuat-vat-tu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/bao-cao-so-che` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thiet-lap-de-xuat-mua-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thu-hoach` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thiet-lap-quy` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thong-ke-quy` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thu-chi-quy` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |

## Quản lý điều hành

_1 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/cap-phat-thu-hoi` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/chi-phi-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/cong-viec` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/danh-sach-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/diem-cong-tru` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/khau-hao-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/kiem-ke-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/noi-quan-ly` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/phieu-hanh-chinh` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/thiet-lap-cong-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/thiet-lap-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/cap-bac` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/chuc-vu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/nhan-vien` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/phan-quyen` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/phong-ban` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/thong-tin-cong-ty` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/bao-cao-nhap-xuat-ton` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-muc-hang-hoa` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-sach-doi-tac` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-sach-hang-hoa` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/danh-sach-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/kiem-ke-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/phieu-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/ton-kho` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/bao-cao-de-xuat-vat-tu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/don-dat-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/phieu-de-xuat-vat-tu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/quan-ly-hop-dong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/thanh-toan-doi-tac` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `mua-hang/thiet-lap-de-xuat-vat-tu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/bao-cao-so-che` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thu-hoach` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thiet-lap-quy` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thong-ke-quy` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thu-chi-quy` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |

## Trưởng nhóm điều hành

_1 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem, Thêm, Sửa, Xoá |
| `hanh-chinh/cap-phat-thu-hoi` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/chi-phi-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/cong-viec` | Xem, Thêm, Sửa, Xoá |
| `hanh-chinh/danh-sach-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/diem-cong-tru` | Xem, Thêm, Sửa, Xoá |
| `hanh-chinh/kiem-ke-tai-san` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `hanh-chinh/phieu-hanh-chinh` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/chi-nhanh` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/sao-luu` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/thiet-bi-dang-nhap` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `kho-van/bao-cao-nhap-xuat-ton` | Xem, Thêm, Sửa |
| `kho-van/danh-muc-hang-hoa` | Xem, Thêm, Sửa |
| `kho-van/danh-sach-doi-tac` | Xem, Thêm, Sửa |
| `kho-van/danh-sach-hang-hoa` | Xem, Thêm, Sửa |
| `kho-van/kiem-ke-kho` | Xem, Thêm, Sửa |
| `kho-van/phieu-kho` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `kho-van/ton-kho` | Xem, Thêm, Sửa |
| `mua-hang/bao-cao-de-xuat-vat-tu` | Xem, Thêm |
| `mua-hang/don-dat-hang` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `mua-hang/phieu-de-xuat-vat-tu` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `mua-hang/quan-ly-hop-dong` | Xem, Thêm, Sửa |
| `mua-hang/thanh-toan-doi-tac` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem, Thêm |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `quan-ly-nha-so-che/thiet-lap-de-xuat-mua-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem, Thêm |
| `quan-ly-nha-so-che/thu-hoach` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |

## Quản lý bộ phận Nhân Sự

_2 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem, Thêm, Sửa |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm |
| `hanh-chinh/chi-phi-tai-san` | Xem, Thêm |
| `hanh-chinh/cong-viec` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/kiem-ke-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `he-thong/thong-tin-cong-ty` | Xem |
| `kho-van/bao-cao-nhap-xuat-ton` | Xem |
| `kho-van/kiem-ke-kho` | Xem |
| `kho-van/phieu-kho` | Xem, Thêm, Sửa |
| `kho-van/ton-kho` | Xem, Thêm |
| `mua-hang/bao-cao-de-xuat-vat-tu` | Xem, Thêm |
| `mua-hang/don-dat-hang` | Xem, Thêm |
| `mua-hang/phieu-de-xuat-vat-tu` | Xem, Thêm, Sửa |
| `mua-hang/quan-ly-hop-dong` | Xem, Thêm |
| `mua-hang/thanh-toan-doi-tac` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Xem |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem, Thêm |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem, Thêm |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem, Thêm |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |
| `tai-chinh/thong-ke-quy` | Xem, Thêm |
| `tai-chinh/thu-chi-quy` | Xem, Thêm |

## Nhân viên hàn chính

_4 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm |
| `hanh-chinh/chi-phi-tai-san` | Xem, Thêm |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/kiem-ke-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `he-thong/thong-tin-cong-ty` | Xem |
| `kho-van/bao-cao-nhap-xuat-ton` | Xem |
| `kho-van/kiem-ke-kho` | Xem |
| `kho-van/phieu-kho` | Xem, Thêm, Sửa |
| `kho-van/ton-kho` | Xem, Thêm |
| `mua-hang/don-dat-hang` | Xem, Thêm |
| `mua-hang/phieu-de-xuat-vat-tu` | Xem, Thêm, Sửa |
| `mua-hang/quan-ly-hop-dong` | Xem, Thêm |
| `mua-hang/thanh-toan-doi-tac` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Xem |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem, Thêm |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem, Thêm |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem, Thêm |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |
| `tai-chinh/thong-ke-quy` | Xem, Thêm |
| `tai-chinh/thu-chi-quy` | Xem, Thêm |

## Quản lý điều hành

_3 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm, Sửa |
| `hanh-chinh/chi-phi-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/kiem-ke-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `kho-van/bao-cao-nhap-xuat-ton` | Xem, Thêm |
| `kho-van/danh-muc-hang-hoa` | Xem, Thêm, Sửa |
| `kho-van/danh-sach-doi-tac` | Xem, Thêm, Sửa |
| `kho-van/danh-sach-hang-hoa` | Xem, Thêm, Sửa |
| `kho-van/kiem-ke-kho` | Xem, Thêm, Sửa |
| `kho-van/phieu-kho` | Xem, Thêm, Sửa |
| `kho-van/ton-kho` | Xem, Thêm, Sửa |
| `mua-hang/don-dat-hang` | Xem, Thêm, Sửa |
| `mua-hang/phieu-de-xuat-vat-tu` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `mua-hang/thanh-toan-doi-tac` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `tai-chinh/thong-ke-quy` | Xem |
| `tai-chinh/thu-chi-quy` | Xem, Thêm, Sửa |

## Nhân viên Mua hàng

_5 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm, Sửa |
| `hanh-chinh/chi-phi-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/kiem-ke-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `kho-van/bao-cao-nhap-xuat-ton` | Xem |
| `kho-van/danh-muc-hang-hoa` | Xem |
| `kho-van/danh-sach-hang-hoa` | Xem, Thêm |
| `kho-van/kiem-ke-kho` | Xem |
| `kho-van/phieu-kho` | Xem, Thêm, Sửa |
| `kho-van/ton-kho` | Xem, Thêm |
| `mua-hang/don-dat-hang` | Xem, Thêm, Sửa |
| `mua-hang/phieu-de-xuat-vat-tu` | Xem, Thêm, Sửa, Xoá, Duyệt |
| `mua-hang/thanh-toan-doi-tac` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `tai-chinh/thong-ke-quy` | Xem |
| `tai-chinh/thu-chi-quy` | Xem, Thêm, Sửa |

## QA NSC

_1 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm, Sửa |
| `hanh-chinh/cong-viec` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/kiem-ke-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/bao-cao-so-che` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Sửa, Duyệt |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thu-hoach` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## Giám sát điều hành

_2 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm, Sửa |
| `hanh-chinh/cong-viec` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/kiem-ke-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `he-thong/nhan-vien` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Sửa, Duyệt |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa, Duyệt |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thu-hoach` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## QC điều hành

_5 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm, Sửa |
| `hanh-chinh/cong-viec` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## Nhân viên Sản xuất

_9 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/cap-phat-thu-hoi` | Xem, Thêm, Sửa |
| `hanh-chinh/danh-sach-tai-san` | Xem, Thêm, Sửa |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## Quản lý điều hành

_2 nhân viên_

| Module | Quyền |
|---|---|
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Xem |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa, Duyệt |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |

## Nhân viên Kinh doanh

_2 nhân viên_

| Module | Quyền |
|---|---|
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa, Duyệt |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## Quản lý bộ phận Kho Vận

_1 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/diem-cong-tru` | Xem, Thêm, Sửa |
| `hanh-chinh/phieu-hanh-chinh` | Toàn quyền (xem, thêm, sửa, xoá, duyệt) |
| `he-thong/nhan-vien` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-nhan-cong` | Xem |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem |
| `quan-ly-nha-so-che/du-bao-sl-dong-thung` | Xem |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem, Thêm |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## Nhân viên Kho vận

_10 nhân viên_

| Module | Quyền |
|---|---|
| `hanh-chinh/bang-luong` | Xem |
| `hanh-chinh/diem-cong-tru` | Xem |
| `hanh-chinh/phieu-hanh-chinh` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/bao-cao-so-che` | Xem, Thêm |
| `quan-ly-nha-so-che/dang-ky-nhan-hang` | Xem, Thêm |
| `quan-ly-nha-so-che/de-xuat-mua-hang` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/giam-sat-chat-luong` | Xem, Thêm |
| `quan-ly-nha-so-che/hang-hoa-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc` | Xem |
| `quan-ly-nha-so-che/phieu-kho-phan-thuoc` | Xem, Thêm, Sửa |
| `quan-ly-nha-so-che/thong-ke-san-xuat` | Xem |
| `quan-ly-nha-so-che/thu-hoach` | Xem |
| `quan-ly-nha-so-che/ton-kho-phan-thuoc` | Xem, Thêm |

## Kỹ thuật

_0 nhân viên_

| Module | Quyền |
|---|---|
| `mua-hang/phieu-de-xuat-vat-tu` | Xem |
| `mua-hang/thanh-toan-doi-tac` | Xem |
