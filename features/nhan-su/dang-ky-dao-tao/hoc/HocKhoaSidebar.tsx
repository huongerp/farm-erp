import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, BookOpen, FileQuestion, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChuongKhoaHoc, BaiHoc, BaiTest } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/core/types';

type AccessMap = {
  canAccessLesson: (id: string) => boolean;
  canAccessChapter: (id: string) => boolean;
  canAccessTest: (id: string) => boolean;
  isLessonViewed: (id: string) => boolean;
  isTestPassed: (id: string) => boolean;
};

interface Props {
  chuongs: ChuongKhoaHoc[];
  baiHocsByChuong: Map<string, BaiHoc[]>;
  baiTestsByChuong: Map<string, BaiTest[]>;
  access: AccessMap;
  selectedId: string | null;
  selectedType: 'baihoc' | 'baitest' | null;
  onSelectBaiHoc: (id: string) => void;
  onSelectBaiTest: (id: string) => void;
}

const HocKhoaSidebar: React.FC<Props> = ({
  chuongs,
  baiHocsByChuong,
  baiTestsByChuong,
  access,
  selectedId,
  selectedType,
  onSelectBaiHoc,
  onSelectBaiTest,
}) => {
  const { t } = useTranslation();
  const [expandedChuong, setExpandedChuong] = React.useState<Set<string>>(new Set(chuongs.map((c) => c.id)));

  return (
    <div className="h-full overflow-y-auto border-r border-border bg-muted/20">
      <nav className="p-2 space-y-1">
        {chuongs.map((ch) => {
          const baiHocs = baiHocsByChuong.get(ch.id) ?? [];
          const tests = baiTestsByChuong.get(ch.id) ?? [];
          const isOpen = expandedChuong.has(ch.id);
          const chapterAccess = access.canAccessChapter(ch.id);

          return (
            <div key={ch.id} className="rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setExpandedChuong((prev) => {
                    const next = new Set(prev);
                    if (next.has(ch.id)) next.delete(ch.id);
                    else next.add(ch.id);
                    return next;
                  })
                }
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors',
                  chapterAccess ? 'text-foreground hover:bg-muted/50' : 'text-muted-foreground opacity-75'
                )}
              >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="truncate">{ch.ten}</span>
              </button>
              {isOpen && (
                <div className="pl-4 pb-2 space-y-0.5">
                  {baiHocs.map((bh) => {
                    const canAccess = access.canAccessLesson(bh.id);
                    const viewed = access.isLessonViewed(bh.id);
                    const isSelected = selectedType === 'baihoc' && selectedId === bh.id;
                    return (
                      <button
                        key={bh.id}
                        type="button"
                        onClick={() => canAccess && onSelectBaiHoc(bh.id)}
                        disabled={!canAccess}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-2 text-left text-sm rounded-md transition-colors',
                          canAccess
                            ? isSelected
                              ? 'bg-primary/15 text-primary font-medium'
                              : 'text-foreground hover:bg-muted/50'
                            : 'text-muted-foreground cursor-not-allowed',
                          !canAccess && 'opacity-70'
                        )}
                      >
                        {canAccess ? (
                          viewed ? (
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                          ) : (
                            <BookOpen size={14} className="shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <Lock size={14} className="shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{bh.ten}</span>
                      </button>
                    );
                  })}
                  {tests.map((bt) => {
                    const canAccess = access.canAccessTest(bt.id);
                    const passed = access.isTestPassed(bt.id);
                    const isSelected = selectedType === 'baitest' && selectedId === bt.id;
                    return (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() => canAccess && onSelectBaiTest(bt.id)}
                        disabled={!canAccess}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-2 text-left text-sm rounded-md transition-colors',
                          canAccess
                            ? isSelected
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium'
                              : 'text-foreground hover:bg-muted/50'
                            : 'text-muted-foreground cursor-not-allowed',
                          !canAccess && 'opacity-70'
                        )}
                      >
                        {canAccess ? (
                          passed ? (
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                          ) : (
                            <FileQuestion size={14} className="shrink-0 text-amber-500" />
                          )
                        ) : (
                          <Lock size={14} className="shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{bt.ten}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default HocKhoaSidebar;
