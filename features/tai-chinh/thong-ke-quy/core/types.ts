/** Kết quả RPC rpc_tc_quy_thu_chi_stats (đã chuẩn hóa về number). */
export interface ThongKeQuyRow {
  id?: string;
  ten?: string;
  thang?: string;
  nguon?: string;
  thu: number;
  chi: number;
  so_phieu?: number;
}

export interface ThongKeQuyStats {
  ton_dau_ky: number;
  tong_thu: number;
  tong_chi: number;
  ton_cuoi_ky: number;
  so_phieu: number;
  theo_hang_muc: ThongKeQuyRow[];
  theo_thang: ThongKeQuyRow[];
  theo_chi_nhanh: ThongKeQuyRow[];
  theo_nguon_chung_tu: ThongKeQuyRow[];
}

export interface ThongKeQuyParams {
  tuNgay: string;
  denNgay: string;
  /** null = mọi chi nhánh (chỉ khi viewAll) */
  chiNhanhIds: number[] | null;
  loai: 'thu' | 'chi' | null;
  hangMucIds: number[];
}
