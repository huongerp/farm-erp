import { useQuery } from '@tanstack/react-query';
import { getNhomTaiLieuList } from '../services/nhom-tai-lieu-service';

export const useNhomTaiLieuList = () =>
  useQuery({
    queryKey: ['nhomTaiLieu'],
    queryFn: getNhomTaiLieuList,
  });
