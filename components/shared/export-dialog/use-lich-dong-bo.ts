import { useCallback, useEffect, useState } from 'react';
import { sheetsClient, type LichDongBo } from '../../../lib/sheets-client';

export interface TrangThaiLich {
  hoTro: boolean;
  duocTao: boolean;
  lyDo: string | null;
  dsLich: LichDongBo[];
}

/** Lịch đồng bộ của người đang đăng nhập cho một module + quyền tạo lịch (server quyết định). */
export function useLichDongBo(moduleId: string | undefined, enabled: boolean) {
  const [data, setData] = useState<TrangThaiLich | null>(null);
  const [dangTai, setDangTai] = useState(false);

  const taiLai = useCallback(async () => {
    if (!moduleId) return;
    setDangTai(true);
    try {
      setData(await sheetsClient.dsLich(moduleId));
    } catch {
      setData(null);
    } finally {
      setDangTai(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (enabled && moduleId) void taiLai();
  }, [enabled, moduleId, taiLai]);

  const thayLich = useCallback((l: LichDongBo) => {
    setData((d) => (d ? { ...d, dsLich: d.dsLich.map((x) => (x.id === l.id ? l : x)) } : d));
  }, []);

  return { data, dangTai, taiLai, thayLich };
}
