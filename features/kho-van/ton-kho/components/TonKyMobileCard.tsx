import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronUp, Warehouse } from "lucide-react";
import { cn, formatNumberVN } from "../../../../lib/utils";

/** Số trong thẻ: tối đa 2 chữ số lẻ, 0 hiện "—" để thẻ đỡ rối. */
const so = (n: number) =>
  n !== 0 ? formatNumberVN(n, { maxFractionDigits: 2 }) : "—";

/** Số có dấu cho Nhập (+) / Xuất (−). */
const soCoDau = (n: number, dau: "+" | "−") =>
  n !== 0
    ? `${dau}${formatNumberVN(Math.abs(n), { maxFractionDigits: 2 })}`
    : "—";

/** Số kho hiện sẵn trên thẻ — dư thì gom vào nút "+n kho". */
const SO_KHO_HIEN_SAN = 3;

export interface TonKyMobileChiTiet {
  key: string;
  nhan: string;
  so: number;
  /** nhap → xanh "+n", xuat → cam "−n", mặc định số thường. */
  kieu?: "nhap" | "xuat";
}

export interface TonKyMobileKho {
  id: string;
  ten: string;
  so: number;
  canhBao?: boolean;
}

export interface TonKyMobileCardProps {
  tenHang: string;
  maHang: string;
  donVi?: string;
  danhMuc?: string;
  /** Số to bên phải: tồn cuối kỳ / tồn hiện tại. */
  soChinh: number;
  nhanSoChinh: string;
  soChinhCanhBao?: boolean;
  /** Lưới Đầu kỳ / Nhập / Xuất / Chuyển — bỏ trống thì không vẽ. */
  chiTiet?: TonKyMobileChiTiet[];
  /** Nhãn cảnh báo (vd "Dưới định mức 200"). */
  canhBao?: string;
  /** Hàng không còn trong danh mục — tô mờ tên. */
  moCoi?: boolean;
  theoKho?: TonKyMobileKho[];
  onClick?: () => void;
}

/** Thẻ một mặt hàng trên điện thoại (< md) cho các màn Tồn kho — thay bảng nhiều cột. */
const TonKyMobileCard: React.FC<TonKyMobileCardProps> = ({
  tenHang,
  maHang,
  donVi,
  danhMuc,
  soChinh,
  nhanSoChinh,
  soChinhCanhBao,
  chiTiet,
  canhBao,
  moCoi,
  theoKho = [],
  onClick,
}) => {
  const { t } = useTranslation();
  const [moRongKho, setMoRongKho] = useState(false);
  const khoHien = moRongKho ? theoKho : theoKho.slice(0, SO_KHO_HIEN_SAN);
  const soKhoAn = theoKho.length - SO_KHO_HIEN_SAN;

  const noiDung = (
    <>
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <h4
            className={cn(
              "text-sm font-semibold leading-snug line-clamp-2",
              moCoi ? "text-muted-foreground italic" : "text-foreground",
            )}
          >
            {tenHang}
          </h4>
          <div className="flex flex-wrap items-center gap-x-1.5 mt-1 text-xs text-muted-foreground">
            <span className="font-mono">{maHang}</span>
            {danhMuc ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate max-w-[10rem]">{danhMuc}</span>
              </>
            ) : null}
          </div>
          {canhBao ? (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-2xs font-medium">
              <AlertTriangle size={11} />
              {canhBao}
            </span>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span
              className={cn(
                "text-lg font-bold tabular-nums leading-tight",
                soChinhCanhBao || soChinh < 0
                  ? "text-destructive"
                  : "text-foreground",
              )}
            >
              {formatNumberVN(soChinh, { maxFractionDigits: 2 })}
            </span>
            {donVi && donVi !== "—" ? (
              <span className="text-xs text-muted-foreground">{donVi}</span>
            ) : null}
          </div>
          <div className="text-2xs text-muted-foreground mt-0.5">
            {nhanSoChinh}
          </div>
        </div>
      </div>

      {chiTiet && chiTiet.length > 0 ? (
        <div
          className="grid border-t border-border/70 bg-muted/30 divide-x divide-border/70"
          style={{
            gridTemplateColumns: `repeat(${chiTiet.length}, minmax(0, 1fr))`,
          }}
        >
          {chiTiet.map((c) => (
            <div key={c.key} className="px-2 py-1.5 text-center min-w-0">
              <div className="text-2xs text-muted-foreground truncate">
                {c.nhan}
              </div>
              <div
                className={cn(
                  "text-xs font-semibold tabular-nums truncate",
                  c.kieu === "nhap" &&
                    c.so !== 0 &&
                    "text-emerald-600 dark:text-emerald-400",
                  c.kieu === "xuat" &&
                    c.so !== 0 &&
                    "text-amber-600 dark:text-amber-400",
                  !c.kieu && c.so < 0 && "text-destructive",
                )}
              >
                {c.kieu === "nhap"
                  ? soCoDau(c.so, "+")
                  : c.kieu === "xuat"
                    ? soCoDau(c.so, "−")
                    : so(c.so)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {theoKho.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-t border-border/70">
          <Warehouse
            size={12}
            className="text-muted-foreground shrink-0"
            aria-hidden
          />
          {khoHien.map((k) => (
            <span
              key={k.id}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-2xs border",
                k.canhBao
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              <span className="truncate max-w-[7rem]">{k.ten}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  !k.canhBao && "text-foreground",
                )}
              >
                {so(k.so)}
              </span>
            </span>
          ))}
          {soKhoAn > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMoRongKho((v) => !v);
              }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-2xs font-medium text-primary hover:bg-primary/10"
            >
              {moRongKho
                ? t("tonKho.mobile.anBotKho")
                : t("tonKho.mobile.themKho", { count: soKhoAn })}
              {moRongKho ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
  const khung =
    "bg-card rounded-xl border border-border shadow-sm overflow-hidden";

  if (!onClick) return <div className={khung}>{noiDung}</div>;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        khung,
        "cursor-pointer active:bg-muted/40 transition-colors",
      )}
    >
      {noiDung}
    </div>
  );
};

export default TonKyMobileCard;

interface KyDangXemBarProps {
  /** `<DateRangePicker>` dùng chung value/onChange với bộ lọc desktop. */
  picker?: React.ReactNode;
  soMatHang: number;
}

/**
 * Dải dưới toolbar trên điện thoại (< 640px, nơi chip lọc bị gom vào nút Filter):
 * luôn thấy kỳ đang xem + đổi kỳ một chạm, kèm số mặt hàng.
 */
export const KyDangXemBar: React.FC<KyDangXemBarProps> = ({
  picker,
  soMatHang,
}) => {
  const { t } = useTranslation();
  return (
    <div className="sm:hidden shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/20">
      <div className="min-w-0">{picker}</div>
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {t("tonKho.mobile.soMatHang", { count: soMatHang })}
      </span>
    </div>
  );
};
