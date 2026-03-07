/**
 * Danh sách ngân hàng Việt Nam (BIN/VietQR).
 * Dùng cho form chọn ngân hàng và sinh VietQR.
 */
export interface BankVN {
  id: string;
  ma_ngan_hang: string;
  ten_ngan_hang: string;
}

export const BANKS_VN: BankVN[] = [
  { id: 'vcb', ma_ngan_hang: '970436', ten_ngan_hang: 'Vietcombank' },
  { id: 'tcb', ma_ngan_hang: '970407', ten_ngan_hang: 'Techcombank' },
  { id: 'bidv', ma_ngan_hang: '970418', ten_ngan_hang: 'BIDV' },
  { id: 'mb', ma_ngan_hang: '970422', ten_ngan_hang: 'MB Bank' },
  { id: 'acb', ma_ngan_hang: '970416', ten_ngan_hang: 'ACB' },
  { id: 'vpb', ma_ngan_hang: '970432', ten_ngan_hang: 'VPBank' },
  { id: 'vtb', ma_ngan_hang: '970415', ten_ngan_hang: 'VietinBank' },
  { id: 'agribank', ma_ngan_hang: '970405', ten_ngan_hang: 'Agribank' },
  { id: 'hdb', ma_ngan_hang: '970437', ten_ngan_hang: 'HDBank' },
  { id: 'tpb', ma_ngan_hang: '970423', ten_ngan_hang: 'TPBank' },
  { id: 'msb', ma_ngan_hang: '970426', ten_ngan_hang: 'MSB' },
  { id: 'vib', ma_ngan_hang: '970441', ten_ngan_hang: 'VIB' },
  { id: 'ocb', ma_ngan_hang: '970448', ten_ngan_hang: 'OCB' },
  { id: 'shb', ma_ngan_hang: '970443', ten_ngan_hang: 'SHB' },
  { id: 'vietcapital', ma_ngan_hang: '970454', ten_ngan_hang: 'Viet Capital Bank' },
  { id: 'scb', ma_ngan_hang: '970429', ten_ngan_hang: 'SCB' },
  { id: 'abbank', ma_ngan_hang: '970425', ten_ngan_hang: 'ABBank' },
  { id: 'vietabank', ma_ngan_hang: '970427', ten_ngan_hang: 'VietABank' },
  { id: 'bacabank', ma_ngan_hang: '970409', ten_ngan_hang: 'Bac A Bank' },
  { id: 'pvcombank', ma_ngan_hang: '970412', ten_ngan_hang: 'PVcomBank' },
  { id: 'oceanbank', ma_ngan_hang: '970414', ten_ngan_hang: 'Oceanbank' },
  { id: 'ncbbank', ma_ngan_hang: '970419', ten_ngan_hang: 'NCB' },
  { id: 'gpbank', ma_ngan_hang: '970408', ten_ngan_hang: 'GPBank' },
  { id: 'donga', ma_ngan_hang: '970406', ten_ngan_hang: 'DongA Bank' },
  { id: 'baovietbank', ma_ngan_hang: '970438', ten_ngan_hang: 'BaoVietBank' },
  { id: 'seabank', ma_ngan_hang: '970440', ten_ngan_hang: 'SeABank' },
  { id: 'vietbank', ma_ngan_hang: '970433', ten_ngan_hang: 'VietBank' },
  { id: 'banviet', ma_ngan_hang: '970449', ten_ngan_hang: 'Ban Viet Bank' },
];
