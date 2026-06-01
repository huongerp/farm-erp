import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import {
  DO_DAI_PHAN_SO_MAX,
  DO_DAI_PHAN_SO_MIN,
  SO_DONG_TOI_DA_MAX,
  SO_DONG_TOI_DA_MIN,
  SO_NGAY_MAC_DINH_NGAY_CAN_MAX,
  SO_NGAY_MAC_DINH_NGAY_CAN_MIN,
  THOI_HAN_DUYET_MAX,
  THOI_HAN_DUYET_MIN,
} from './constants';

const statusSchema = {
  ma: z.string().min(1, { message: i18n.t('thietLapDeXuatVatTu.validation.maRequired') }),
  ten: z.string().min(1, { message: i18n.t('thietLapDeXuatVatTu.validation.tenRequired') }),
  thu_tu: z.coerce.number().min(0, { message: i18n.t('thietLapDeXuatVatTu.validation.thuTuMin') }),
  mau: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
};

export const trangThaiDoiTacSchema = z.object(statusSchema);
export type TrangThaiDoiTacFormValues = z.infer<typeof trangThaiDoiTacSchema>;

export const trangThaiThanhToanDoiTacSchema = z.object(statusSchema);
export type TrangThaiThanhToanDoiTacFormValues = z.infer<typeof trangThaiThanhToanDoiTacSchema>;

export const tienDoMuaHangSchema = z.object(statusSchema);
export type TienDoMuaHangFormValues = z.infer<typeof tienDoMuaHangSchema>;

export const cauHinhChungSchema = z.object({
  so_ngay_mac_dinh_ngay_can: z.coerce
    .number()
    .min(SO_NGAY_MAC_DINH_NGAY_CAN_MIN)
    .max(SO_NGAY_MAC_DINH_NGAY_CAN_MAX),
  trang_thai_mac_dinh: z.union([z.literal(0), z.literal(1)]),
  cho_phep_sua_sau_duyet: z.boolean(),
});
export type CauHinhChungFormValues = z.infer<typeof cauHinhChungSchema>;

export const mauPhieuSoPhieuSchema = z.object({
  tien_to_so_phieu: z.string().min(1),
  tu_sinh_so_phieu: z.boolean(),
  do_dai_phan_so: z.coerce.number().min(DO_DAI_PHAN_SO_MIN).max(DO_DAI_PHAN_SO_MAX),
  so_thu_tu_tiep_theo: z.coerce.number().min(1),
  ngay_can_bat_buoc: z.boolean(),
  ghi_chu_bat_buoc: z.boolean(),
  so_dong_toi_da: z.coerce.number().min(SO_DONG_TOI_DA_MIN).max(SO_DONG_TOI_DA_MAX),
});
export type MauPhieuSoPhieuFormValues = z.infer<typeof mauPhieuSoPhieuSchema>;

export const quyTrinhDuyetSchema = z.object({
  thoi_han_duyet_ngay: z.coerce.number().min(THOI_HAN_DUYET_MIN).max(THOI_HAN_DUYET_MAX),
  bat_canh_bao_qua_han: z.boolean(),
});
export type QuyTrinhDuyetFormValues = z.infer<typeof quyTrinhDuyetSchema>;
