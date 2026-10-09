import { useCallback, useState } from 'react';
import { uploadAnhThung } from '../utils/anh-thung';

/** Upload ảnh thùng kèm đếm số ảnh đang tải — để khoá nút Lưu, tránh lưu khi ảnh chưa up xong. */
export function useUploadAnhThung() {
  const [dangTai, setDangTai] = useState(0);
  const upload = useCallback(async (file: File) => {
    setDangTai((n) => n + 1);
    try {
      return await uploadAnhThung(file);
    } finally {
      setDangTai((n) => n - 1);
    }
  }, []);
  return { upload, dangTai: dangTai > 0 };
}
