import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllThuChi,
  getThuChiById,
  createThuChi,
  updateThuChi,
  deleteThuChi,
  deleteThuChiMany,
  getThuChiStatsByLoai,
  getThuChiStatsByTaiKhoan,
  getThuChiStatsByDanhMuc,
} from '../services/thu-chi-service';
import type { ThuChiFormValues } from '../core/schema';

const QUERY_KEY = ['thu-chi'];

export const useThuChiList = () =>
  useQuery({ queryKey: QUERY_KEY, queryFn: getAllThuChi });

export const useThuChiById = (id: string | undefined) =>
  useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getThuChiById(id!),
    enabled: !!id,
  });

export const useCreateThuChi = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ThuChiFormValues) => createThuChi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      onSuccess?.();
    },
  });
};

export const useUpdateThuChi = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThuChiFormValues }) => updateThuChi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      onSuccess?.();
    },
  });
};

export const useDeleteThuChi = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteThuChi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      onSuccess?.();
    },
  });
};

export const useDeleteThuChiMany = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteThuChiMany(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      onSuccess?.();
    },
  });
};

export const useThuChiStatsByLoai = (tuNgay: string, denNgay: string) =>
  useQuery({
    queryKey: [...QUERY_KEY, 'stats-by-loai', tuNgay, denNgay],
    queryFn: () => getThuChiStatsByLoai(tuNgay, denNgay),
    enabled: !!tuNgay && !!denNgay,
  });

export const useThuChiStatsByTaiKhoan = (tuNgay: string, denNgay: string) =>
  useQuery({
    queryKey: [...QUERY_KEY, 'stats-by-taikhoan', tuNgay, denNgay],
    queryFn: () => getThuChiStatsByTaiKhoan(tuNgay, denNgay),
    enabled: !!tuNgay && !!denNgay,
  });

export const useThuChiStatsByDanhMuc = (tuNgay: string, denNgay: string) =>
  useQuery({
    queryKey: [...QUERY_KEY, 'stats-by-danhmuc', tuNgay, denNgay],
    queryFn: () => getThuChiStatsByDanhMuc(tuNgay, denNgay),
    enabled: !!tuNgay && !!denNgay,
  });
