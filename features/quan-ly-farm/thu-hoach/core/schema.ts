import { z } from 'zod';
import { THU_HOACH_DAY_SUFFIXES } from './types';
import i18n from '../../../../lib/i18n';

const dayNum = z.coerce.number().finite().default(0);

function preprocessOptionalNumber(val: unknown): unknown {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
}

function keHoachShape() {
  const o: Record<string, z.ZodNumber> = {};
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    o[`ke_hoach_${s}`] = dayNum;
  }
  return o;
}

function thucTeShape() {
  const o: Record<string, z.ZodNumber> = {};
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    o[`thuc_te_${s}`] = dayNum;
  }
  return o;
}

const reqMsg = (key: string) => i18n.t(key);

/** Form tab Nhập liệu — chỉ kế hoạch + khóa nghiệp vụ (năm, tuần, chi nhánh bắt buộc) */
export const thuHoachKeHoachFormSchema = z.object({
  nam: z.preprocess(
    preprocessOptionalNumber,
    z
      .number({
        required_error: reqMsg('thuHoach.validation.namRequired'),
        invalid_type_error: reqMsg('thuHoach.validation.namRequired'),
      })
      .int()
      .min(2000, { message: reqMsg('thuHoach.validation.namRange') })
      .max(2100, { message: reqMsg('thuHoach.validation.namRange') })
  ),
  tuan: z.preprocess(
    preprocessOptionalNumber,
    z
      .number({
        required_error: reqMsg('thuHoach.validation.tuanRequired'),
        invalid_type_error: reqMsg('thuHoach.validation.tuanRequired'),
      })
      .int()
      .min(1, { message: reqMsg('thuHoach.validation.tuanRange') })
      .max(53, { message: reqMsg('thuHoach.validation.tuanRange') })
  ),
  id_chi_nhanh: z.string().min(1, { message: reqMsg('thuHoach.validation.branchRequired') }),
  ten_chi_nhanh: z.string().optional(),
  ghi_chu: z.string().optional(),
  trao_doi: z.string().optional(),
  ...keHoachShape(),
});

export type ThuHoachKeHoachFormValues = z.infer<typeof thuHoachKeHoachFormSchema>;

/** Popup Thực tế — chỉ cập nhật thực tế theo ngày (trao đổi chỉnh qua popup riêng trên detail). */
export const thuHoachThucTeFormSchema = z.object({
  ...thucTeShape(),
});

export type ThuHoachThucTeFormValues = z.infer<typeof thuHoachThucTeFormSchema>;

/** Popup thêm dòng trao đổi (nối vào lịch sử). */
export const thuHoachTraoDoiAppendSchema = z.object({
  noi_dung: z
    .string()
    .trim()
    .min(1, { message: reqMsg('thuHoach.validation.traoDoiNoiDungRequired') }),
});

export type ThuHoachTraoDoiAppendValues = z.infer<typeof thuHoachTraoDoiAppendSchema>;
