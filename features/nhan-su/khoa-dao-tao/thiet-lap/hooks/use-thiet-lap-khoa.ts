import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../../lib/i18n';
import type { ChuongFormValues, BaiHocFormValues, BaiTestFormValues, CauHoiFormValues } from '../core/schema';
import {
  getChuongByKhoaHoc,
  createChuong,
  updateChuong,
  deleteChuong,
  reorderChuong,
  getBaiHocByChuong,
  createBaiHoc,
  updateBaiHoc,
  deleteBaiHoc,
  reorderBaiHoc,
  getBaiTestByChuong,
  createBaiTest,
  updateBaiTest,
  deleteBaiTest,
  reorderBaiTest,
  getCauHoiByBaiTest,
  createCauHoi,
  updateCauHoi,
  deleteCauHoi,
  reorderCauHoi,
} from '../services/thiet-lap-khoa-service';

const QUERY_KEY_CHUONG = (idKhoa: string) => ['thietLapKhoa', 'chuong', idKhoa];
const QUERY_KEY_BAI_HOC = (idChuong: string) => ['thietLapKhoa', 'baiHoc', idChuong];
const QUERY_KEY_BAI_TEST = (idChuong: string) => ['thietLapKhoa', 'baiTest', idChuong];
const QUERY_KEY_CAU_HOI = (idBaiTest: string) => ['thietLapKhoa', 'cauHoi', idBaiTest];

export const useChuongByKhoaHoc = (idKhoaHoc: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEY_CHUONG(idKhoaHoc ?? ''),
    queryFn: () => getChuongByKhoaHoc(idKhoaHoc!),
    enabled: !!idKhoaHoc,
  });
};

export const useCreateChuong = (idKhoaHoc: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChuongFormValues) => createChuong(idKhoaHoc, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHUONG(idKhoaHoc) });
      toast.success(i18n.t('thietLapKhoa.toast.chuongCreated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateChuong = (idKhoaHoc: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChuongFormValues> }) => updateChuong(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHUONG(idKhoaHoc) });
      toast.success(i18n.t('thietLapKhoa.toast.chuongUpdated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteChuong = (idKhoaHoc: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChuong(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHUONG(idKhoaHoc) });
      toast.success(i18n.t('thietLapKhoa.toast.chuongDeleted'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useReorderChuong = (idKhoaHoc: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderChuong(idKhoaHoc, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHUONG(idKhoaHoc) });
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

// ---------- Bài học ----------
export const useBaiHocByChuong = (idChuong: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEY_BAI_HOC(idChuong ?? ''),
    queryFn: () => getBaiHocByChuong(idChuong!),
    enabled: !!idChuong,
  });
};

export const useCreateBaiHoc = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BaiHocFormValues) => createBaiHoc(idChuong, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_HOC(idChuong) });
      toast.success(i18n.t('thietLapKhoa.toast.baiHocCreated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateBaiHoc = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BaiHocFormValues> }) => updateBaiHoc(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_HOC(idChuong) });
      toast.success(i18n.t('thietLapKhoa.toast.baiHocUpdated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteBaiHoc = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBaiHoc(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_HOC(idChuong) });
      toast.success(i18n.t('thietLapKhoa.toast.baiHocDeleted'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useReorderBaiHoc = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderBaiHoc(idChuong, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_HOC(idChuong) });
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

// ---------- Bài test ----------
export const useBaiTestByChuong = (idChuong: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEY_BAI_TEST(idChuong ?? ''),
    queryFn: () => getBaiTestByChuong(idChuong!),
    enabled: !!idChuong,
  });
};

export const useCreateBaiTest = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BaiTestFormValues) => createBaiTest(idChuong, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_TEST(idChuong) });
      toast.success(i18n.t('thietLapKhoa.toast.baiTestCreated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateBaiTest = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BaiTestFormValues> }) => updateBaiTest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_TEST(idChuong) });
      toast.success(i18n.t('thietLapKhoa.toast.baiTestUpdated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteBaiTest = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBaiTest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_TEST(idChuong) });
      toast.success(i18n.t('thietLapKhoa.toast.baiTestDeleted'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useReorderBaiTest = (idChuong: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderBaiTest(idChuong, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAI_TEST(idChuong) });
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

// ---------- Câu hỏi ----------
export const useCauHoiByBaiTest = (idBaiTest: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEY_CAU_HOI(idBaiTest ?? ''),
    queryFn: () => getCauHoiByBaiTest(idBaiTest!),
    enabled: !!idBaiTest,
  });
};

export const useCreateCauHoi = (idBaiTest: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CauHoiFormValues) => createCauHoi(idBaiTest, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CAU_HOI(idBaiTest) });
      toast.success(i18n.t('thietLapKhoa.toast.cauHoiCreated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateCauHoi = (idBaiTest: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CauHoiFormValues> }) => updateCauHoi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CAU_HOI(idBaiTest) });
      toast.success(i18n.t('thietLapKhoa.toast.cauHoiUpdated'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteCauHoi = (idBaiTest: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCauHoi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CAU_HOI(idBaiTest) });
      toast.success(i18n.t('thietLapKhoa.toast.cauHoiDeleted'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useReorderCauHoi = (idBaiTest: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderCauHoi(idBaiTest, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CAU_HOI(idBaiTest) });
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
