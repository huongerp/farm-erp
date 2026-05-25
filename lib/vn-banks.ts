/**
 * Danh sách ngân hàng Việt Nam theo chuẩn Napas247 / VietQR.
 *  - `bin`: 6 chữ số (lưu vào Supabase, dùng build URL VietQR.io).
 *  - `code`: mã viết tắt phổ biến.
 *  - `ten`: tên đầy đủ tiếng Việt.
 *  - `shortName`: tên gọi ngắn quen thuộc (hiển thị UI).
 *
 * Khi build URL VietQR:
 *   https://img.vietqr.io/image/{bin}-{soTaiKhoan}-compact2.png?accountName={ten}
 */
export interface VnBank {
  bin: string;
  code: string;
  ten: string;
  shortName: string;
}

export const VN_BANKS: VnBank[] = [
  { bin: '970436', code: 'VCB',         ten: 'Ngân hàng TMCP Ngoại Thương Việt Nam',                   shortName: 'Vietcombank' },
  { bin: '970418', code: 'BIDV',        ten: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',           shortName: 'BIDV' },
  { bin: '970422', code: 'MB',          ten: 'Ngân hàng TMCP Quân Đội',                                 shortName: 'MB Bank' },
  { bin: '970415', code: 'CTG',         ten: 'Ngân hàng TMCP Công thương Việt Nam',                    shortName: 'VietinBank' },
  { bin: '970405', code: 'VBA',         ten: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', shortName: 'Agribank' },
  { bin: '970407', code: 'TCB',         ten: 'Ngân hàng TMCP Kỹ Thương Việt Nam',                      shortName: 'Techcombank' },
  { bin: '970432', code: 'VPB',         ten: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',                    shortName: 'VPBank' },
  { bin: '970416', code: 'ACB',         ten: 'Ngân hàng TMCP Á Châu',                                  shortName: 'ACB' },
  { bin: '970403', code: 'STB',         ten: 'Ngân hàng TMCP Sài Gòn Thương Tín',                      shortName: 'Sacombank' },
  { bin: '970423', code: 'TPB',         ten: 'Ngân hàng TMCP Tiên Phong',                              shortName: 'TPBank' },
  { bin: '970437', code: 'HDB',         ten: 'Ngân hàng TMCP Phát triển TP. HCM',                      shortName: 'HDBank' },
  { bin: '970454', code: 'VCCB',        ten: 'Ngân hàng TMCP Bản Việt',                                shortName: 'BVBank' },
  { bin: '970429', code: 'SCB',         ten: 'Ngân hàng TMCP Sài Gòn',                                 shortName: 'SCB' },
  { bin: '970441', code: 'VIB',         ten: 'Ngân hàng TMCP Quốc tế Việt Nam',                        shortName: 'VIB' },
  { bin: '970448', code: 'OCB',         ten: 'Ngân hàng TMCP Phương Đông',                             shortName: 'OCB' },
  { bin: '970426', code: 'MSB',         ten: 'Ngân hàng TMCP Hàng Hải',                                shortName: 'MSB' },
  { bin: '970431', code: 'EIB',         ten: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam',                 shortName: 'Eximbank' },
  { bin: '970443', code: 'SHB',         ten: 'Ngân hàng TMCP Sài Gòn - Hà Nội',                        shortName: 'SHB' },
  { bin: '970440', code: 'SEAB',        ten: 'Ngân hàng TMCP Đông Nam Á',                              shortName: 'SeABank' },
  { bin: '970409', code: 'BAB',         ten: 'Ngân hàng TMCP Bắc Á',                                   shortName: 'BacABank' },
  { bin: '970419', code: 'NCB',         ten: 'Ngân hàng TMCP Quốc Dân',                                shortName: 'NCB' },
  { bin: '970424', code: 'SHBVN',       ten: 'Ngân hàng TNHH MTV Shinhan Việt Nam',                    shortName: 'Shinhan Bank' },
  { bin: '970425', code: 'ABB',         ten: 'Ngân hàng TMCP An Bình',                                 shortName: 'ABBANK' },
  { bin: '970427', code: 'VAB',         ten: 'Ngân hàng TMCP Việt Á',                                  shortName: 'VietABank' },
  { bin: '970428', code: 'NAB',         ten: 'Ngân hàng TMCP Nam Á',                                   shortName: 'Nam A Bank' },
  { bin: '970430', code: 'PGB',         ten: 'Ngân hàng TMCP Xăng dầu Petrolimex',                     shortName: 'PG Bank' },
  { bin: '970433', code: 'VIETBANK',    ten: 'Ngân hàng TMCP Việt Nam Thương Tín',                     shortName: 'VietBank' },
  { bin: '970434', code: 'IVB',         ten: 'Ngân hàng TNHH Indovina',                                shortName: 'Indovina Bank' },
  { bin: '970438', code: 'BVB',         ten: 'Ngân hàng TMCP Bảo Việt',                                shortName: 'BaoVietBank' },
  { bin: '970442', code: 'HLBVN',       ten: 'Ngân hàng TNHH MTV Hong Leong Việt Nam',                 shortName: 'Hong Leong Bank' },
  { bin: '970444', code: 'CBB',         ten: 'Ngân hàng TM TNHH MTV Xây dựng Việt Nam',                shortName: 'CBBank' },
  { bin: '970446', code: 'COOPBANK',    ten: 'Ngân hàng Hợp tác xã Việt Nam',                          shortName: 'Co-opBank' },
  { bin: '970449', code: 'LPB',         ten: 'Ngân hàng TMCP Lộc Phát Việt Nam',                       shortName: 'LPBank' },
  { bin: '970452', code: 'KLB',         ten: 'Ngân hàng TMCP Kiên Long',                               shortName: 'KienLongBank' },
  { bin: '970455', code: 'IBKHN',       ten: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội',       shortName: 'IBK - HN' },
  { bin: '970456', code: 'IBKHCM',      ten: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP.HCM',      shortName: 'IBK - HCM' },
  { bin: '970457', code: 'WOO',         ten: 'Ngân hàng Woori Việt Nam',                               shortName: 'Woori Bank' },
  { bin: '970458', code: 'UOB',         ten: 'Ngân hàng United Overseas Bank Việt Nam',                shortName: 'UOB' },
  { bin: '970460', code: 'KEBHANAHCM',  ten: 'KEB Hana Bank - Chi nhánh TP.HCM',                        shortName: 'KEB Hana - HCM' },
  { bin: '970462', code: 'KEBHANAHN',   ten: 'KEB Hana Bank - Chi nhánh Hà Nội',                        shortName: 'KEB Hana - HN' },
  { bin: '970463', code: 'MAFC',        ten: 'Công ty Tài chính TNHH MTV Mirae Asset (Việt Nam)',       shortName: 'Mirae Asset' },
  { bin: '970464', code: 'CITIBANK',    ten: 'Citibank, N.A. - Chi nhánh Hà Nội',                       shortName: 'Citibank' },
  { bin: '970465', code: 'KBHN',        ten: 'KookminBank HN',                                          shortName: 'KookminBank HN' },
  { bin: '970466', code: 'KBHCM',       ten: 'KookminBank HCM',                                         shortName: 'KookminBank HCM' },
  { bin: '422589', code: 'CIMB',        ten: 'Ngân hàng TNHH MTV CIMB Việt Nam',                       shortName: 'CIMB' },
  { bin: '796500', code: 'DBS',         ten: 'DBS Bank - Chi nhánh TP.HCM',                            shortName: 'DBS Bank' },
  { bin: '970439', code: 'PBVN',        ten: 'Ngân hàng Public Bank Việt Nam',                         shortName: 'Public Bank' },
  { bin: '970412', code: 'PVCB',        ten: 'Ngân hàng TMCP Đại Chúng Việt Nam',                      shortName: 'PVcomBank' },
  { bin: '970414', code: 'OCEANBANK',   ten: 'Ngân hàng TM TNHH MTV Đại Dương',                        shortName: 'OceanBank' },
  { bin: '970421', code: 'VRB',         ten: 'Ngân hàng Liên doanh Việt - Nga',                        shortName: 'VRB' },
  { bin: '963388', code: 'TIMO',        ten: 'Ngân hàng số Timo by Bản Việt',                          shortName: 'Timo' },
];

export const getBankByBin = (bin: string | null | undefined): VnBank | undefined => {
  if (!bin) return undefined;
  return VN_BANKS.find((b) => b.bin === bin);
};

export const formatBankLabel = (bank: VnBank): string => `${bank.shortName} (${bank.code})`;
