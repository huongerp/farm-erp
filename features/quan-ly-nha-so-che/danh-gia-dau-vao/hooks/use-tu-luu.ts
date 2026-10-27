import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ô nhập tự lưu: giữ giá trị đang gõ ở local, lưu sau `treMs` không gõ (hoặc khi rời ô / gỡ ô),
 * các lượt lưu chạy NỐI TIẾP (không đè nhau khi mạng chậm). Giá trị gốc đổi từ ngoài (cache sau khi
 * lưu, người khác sửa) chỉ được nạp lại khi ô không còn thay đổi chưa lưu.
 */
export function useTuLuu<T>(
  goc: T,
  luu: (v: T) => Promise<unknown>,
  bang: (a: T, b: T) => boolean,
  treMs = 700
) {
  const [giaTri, setGiaTriState] = useState(goc);
  const [gocTruoc, setGocTruoc] = useState(goc);
  const [dangSua, setDangSua] = useState(false);
  if (!bang(goc, gocTruoc)) {
    setGocTruoc(goc);
    if (!dangSua) setGiaTriState(goc);
  }

  const luuRef = useRef(luu);
  const moiNhat = useRef(goc);
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chuoi = useRef<Promise<unknown>>(Promise.resolve());
  const soLuotCho = useRef(0);

  useEffect(() => {
    luuRef.current = luu;
  }, [luu]);

  const thucHien = useCallback(() => {
    if (hen.current) {
      clearTimeout(hen.current);
      hen.current = null;
    }
    const v = moiNhat.current;
    soLuotCho.current += 1;
    chuoi.current = chuoi.current
      .then(() => luuRef.current(v))
      .catch(() => undefined)
      .finally(() => {
        soLuotCho.current -= 1;
        if (soLuotCho.current === 0 && !hen.current) setDangSua(false);
      });
  }, []);

  const setGiaTri = useCallback(
    (v: T) => {
      setGiaTriState(v);
      setDangSua(true);
      moiNhat.current = v;
      if (hen.current) clearTimeout(hen.current);
      hen.current = setTimeout(thucHien, treMs);
    },
    [thucHien, treMs]
  );

  /** Lưu ngay nếu còn thay đổi đang chờ (rời ô). */
  const flush = useCallback(() => {
    if (hen.current) thucHien();
  }, [thucHien]);

  // Gỡ ô (đổi ngày, đóng drawer) khi còn thay đổi đang chờ → lưu luôn, không mất số.
  useEffect(() => () => flush(), [flush]);

  return { giaTri, setGiaTri, flush, dangSua };
}
