export const NKPP_MODULE_ID = 'quan-ly-nha-so-che/nhat-ky-pha-phen';

/** Năm khung giờ pha phèn trong ngày: lần 1 là đầu ca, 4 lần sau là bổ sung. */
export const KHUNG_GIO_PHA = ['07:00', '09:00', '11:00', '15:00', '17:00'] as const;

export const SO_LAN_PHA = KHUNG_GIO_PHA.length;
