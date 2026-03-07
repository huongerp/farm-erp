import type { NhomTaiLieu } from '../core/types';
import { MOCK_NHOM_TAI_LIEU } from '../../../../mocks/hanh-chinh';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getNhomTaiLieuList = async (): Promise<NhomTaiLieu[]> => {
  await delay(200);
  return [...MOCK_NHOM_TAI_LIEU];
};
