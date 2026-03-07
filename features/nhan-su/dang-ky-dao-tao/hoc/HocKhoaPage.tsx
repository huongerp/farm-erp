import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useDangKyById } from '../hooks/use-dang-ky-dao-tao';
import { useTienDoByDangKy, useMarkBaiHocDaXem } from '../hooks/use-tien-do';
import { useKetQuaByDangKy, useSubmitBaiTest } from '../hooks/use-ket-qua-test';
import { useChuongByKhoaHoc } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/hooks/use-thiet-lap-khoa';
import { getBaiHocByChuong, getBaiTestByChuong, getCauHoiByBaiTest } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/services/thiet-lap-khoa-service';
import { computeAccessFromData } from '../services/dang-ky-dao-tao-service';
import type { ChuongKhoaHoc, BaiHoc, BaiTest, CauHoi } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/core/types';
import HocKhoaSidebar from './HocKhoaSidebar';
import BaiHocViewer from './BaiHocViewer';
import BaiTestViewer from './BaiTestViewer';

const HocKhoaPage: React.FC = () => {
  const { idDangKy } = useParams<{ idDangKy: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedBaiHocId, setSelectedBaiHocId] = useState<string | null>(null);
  const [selectedBaiTestId, setSelectedBaiTestId] = useState<string | null>(null);

  const { data: dangKy, isLoading: loadingDangKy } = useDangKyById(idDangKy ?? null);
  const { data: chuongs = [], isLoading: loadingChuong } = useChuongByKhoaHoc(dangKy?.id_khoa_hoc);
  const { data: tienDo = [] } = useTienDoByDangKy(idDangKy ?? null);
  const { data: ketQua = [] } = useKetQuaByDangKy(idDangKy ?? null);

  const baiHocQueries = useQueries({
    queries: chuongs.map((ch) => ({
      queryKey: ['thietLapKhoa', 'baiHoc', ch.id],
      queryFn: () => getBaiHocByChuong(ch.id),
    })),
  });
  const baiTestQueries = useQueries({
    queries: chuongs.map((ch) => ({
      queryKey: ['thietLapKhoa', 'baiTest', ch.id],
      queryFn: () => getBaiTestByChuong(ch.id),
    })),
  });

  const baiHocsByChuong = useMemo(() => {
    const m = new Map<string, BaiHoc[]>();
    chuongs.forEach((ch, i) => {
      const data = baiHocQueries[i]?.data;
      if (data) m.set(ch.id, data);
    });
    return m;
  }, [chuongs, baiHocQueries]);

  const baiTestsByChuong = useMemo(() => {
    const m = new Map<string, BaiTest[]>();
    chuongs.forEach((ch, i) => {
      const data = baiTestQueries[i]?.data;
      if (data) m.set(ch.id, data);
    });
    return m;
  }, [chuongs, baiTestQueries]);

  const access = useMemo(
    () =>
      computeAccessFromData(
        chuongs,
        baiHocsByChuong,
        baiTestsByChuong,
        tienDo,
        ketQua
      ),
    [chuongs, baiHocsByChuong, baiTestsByChuong, tienDo, ketQua]
  );

  const markViewed = useMarkBaiHocDaXem(idDangKy ?? '', () => {
    setSelectedBaiHocId(null);
    setSelectedBaiTestId(null);
  });
  const submitTest = useSubmitBaiTest(idDangKy ?? '', () => {
    setSelectedBaiTestId(null);
  });

  const selectedBaiHoc: BaiHoc | null = useMemo(() => {
    if (!selectedBaiHocId) return null;
    for (const arr of baiHocsByChuong.values()) {
      const b = arr.find((x) => x.id === selectedBaiHocId);
      if (b) return b;
    }
    return null;
  }, [selectedBaiHocId, baiHocsByChuong]);

  const selectedBaiTest: BaiTest | null = useMemo(() => {
    if (!selectedBaiTestId) return null;
    for (const arr of baiTestsByChuong.values()) {
      const b = arr.find((x) => x.id === selectedBaiTestId);
      if (b) return b;
    }
    return null;
  }, [selectedBaiTestId, baiTestsByChuong]);

  const { data: cauHoiList = [] } = useQuery({
    queryKey: ['thietLapKhoa', 'cauHoi', selectedBaiTestId ?? ''],
    queryFn: () => getCauHoiByBaiTest(selectedBaiTestId!),
    enabled: !!selectedBaiTestId,
  });

  const ketQuaForTest = selectedBaiTestId
    ? ketQua.find((k) => k.id_bai_test === selectedBaiTestId)
    : null;

  const isLoading = loadingDangKy || loadingChuong;
  const daXemSelected = selectedBaiHocId ? tienDo.some((t) => t.id_bai_hoc === selectedBaiHocId && t.da_xem) : false;

  if (!idDangKy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-4">
        <p className="text-sm text-muted-foreground">{t('dangKyDaoTao.hoc.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/nhan-su/dang-ky-dao-tao')} className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> {t('common.back')}
        </Button>
      </div>
    );
  }

  if (isLoading && !dangKy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]" aria-busy="true">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!dangKy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-4">
        <p className="text-sm text-muted-foreground">{t('dangKyDaoTao.hoc.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/nhan-su/dang-ky-dao-tao')} className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> {t('common.back')}
        </Button>
      </div>
    );
  }

  const totalChuong = chuongs.length;
  const passedChuong = ketQua.filter((k) => k.dat).length;
  const totalBai = Array.from(baiHocsByChuong.values()).reduce((s, arr) => s + arr.length, 0);
  const viewedBai = tienDo.filter((t) => t.da_xem).length;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <header className="shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/nhan-su/dang-ky-dao-tao')}
            className="shrink-0"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">
              {dangKy.ten_khoa_hoc ?? dangKy.ma_khoa_hoc ?? t('dangKyDaoTao.hoc.title')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('dangKyDaoTao.chuong')}: {passedChuong}/{totalChuong} — {t('dangKyDaoTao.daXem')}: {viewedBai}/{totalBai}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <aside className="w-64 shrink-0 hidden sm:block">
          <HocKhoaSidebar
            chuongs={chuongs}
            baiHocsByChuong={baiHocsByChuong}
            baiTestsByChuong={baiTestsByChuong}
            access={access}
            selectedId={selectedBaiHocId ?? selectedBaiTestId}
            selectedType={selectedBaiHocId ? 'baihoc' : selectedBaiTestId ? 'baitest' : null}
            onSelectBaiHoc={(id) => {
              setSelectedBaiHocId(id);
              setSelectedBaiTestId(null);
            }}
            onSelectBaiTest={(id) => {
              setSelectedBaiTestId(id);
              setSelectedBaiHocId(null);
            }}
          />
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto bg-muted/10">
          {selectedBaiHoc && (
            <BaiHocViewer
              baiHoc={selectedBaiHoc}
              daXem={daXemSelected}
              onMarkViewed={() => markViewed.mutate(selectedBaiHoc.id)}
              isMarking={markViewed.isPending}
            />
          )}
          {selectedBaiTest && !selectedBaiHoc && (
            <BaiTestViewer
              cauHoiList={cauHoiList}
              onSubmit={(dapAn) => submitTest.mutate({ id_bai_test: selectedBaiTest.id, dap_an: dapAn })}
              isSubmitting={submitTest.isPending}
              ketQua={ketQuaForTest ? { diem: ketQuaForTest.diem, dat: ketQuaForTest.dat } : undefined}
            />
          )}
          {!selectedBaiHoc && !selectedBaiTest && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <BookOpen size={48} className="text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-foreground">{t('dangKyDaoTao.hoc.chonBai')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dangKyDaoTao.hoc.chonBaiDesc')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HocKhoaPage;
