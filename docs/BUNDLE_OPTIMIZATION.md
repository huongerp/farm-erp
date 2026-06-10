# Tối ưu bundle — farm-erp

## Baseline (trước tối ưu)

| Chunk | Raw (~KB) | Gzip (~KB) |
|-------|-----------|------------|
| `index-*.js` (main) | ~1094 | ~249 |
| `export-libs-*.js` (monolith) | ~1052 | ~327 |
| `recharts-*.js` | ~385 | ~113 |

## Sau Phase 1–2 (tham khảo)

| Chunk | Raw (~KB) | Gzip (~KB) |
|-------|-----------|------------|
| `index-*.js` (main) | ~519 | ~141 |
| `core-*.js` (i18n vi core) | ~160 | ~38 |
| `vendor-xlsx-*.js` | ~429 | ~143 |
| `vendor-jspdf-*.js` | ~418 | ~136 |
| `vendor-html2canvas-*.js` | ~201 | ~47 |
| `recharts-*.js` | ~385 | ~113 |

## Sau Phase 3 (tham khảo)

| Chunk | Raw (~KB) | Gzip (~KB) | Ghi chú |
|-------|-----------|------------|---------|
| `index-*.js` (main) | ~519 | ~141 | Không import trực tiếp `framer-motion` |
| `framer-motion-*.js` | ~119 | ~39 | Chỉ load khi mở module có animation (lazy chunks) |

Main chunk giữ nguyên kích thước; lợi ích Phase 3 là **framer-motion không còn trên critical path** (`App` → `Layout`, `ConfirmDialog`, `Login`).

## Thay đổi đã áp dụng

### Phase 1–2

1. **Tách export libs** — `vendor-xlsx`, `vendor-jspdf`, `vendor-html2canvas` (chỉ tải format user chọn).
2. **Lazy ExportDialog / ImportDialog** — `LazyExportDialog`, `LazyImportDialog` (chỉ load khi `open={true}`).
3. **i18n** — Core vi (gồm feature locales) load lúc startup qua `locales/vi/core.ts` + `locales/vi/feature-locales.ts`. Chỉ dùng tiếng Việt.
4. **Gỡ @tiptap** — không dùng trong codebase.
5. **Recharts** — tab Thống kê đã `React.lazy` StatsCharts; recharts chunk load khi mở tab stats.

### Phase 3

1. **Gỡ framer-motion khỏi critical path** — `Layout`, `ConfirmDialog`, `Login` dùng CSS transitions + `lib/usePresenceTransition.ts`; `GenericDrawer`, `ExportDialog`, `ImportDialog` cũng chuyển sang CSS.
2. **CSS presence utilities** — class `.presence-overlay`, `.presence-dialog`, `.presence-drawer`, … trong `index.css` (hỗ trợ `prefers-reduced-motion`).
3. **Audit PDF export** — tất cả `export-*.ts` / `print-*.ts` dùng `await import('jspdf')` / `import('html2canvas')` trong handler; không có static import runtime. PreviewPage giữ static import utils (chỉ load HTML builder, không kéo vendor-jspdf).
4. **lucide-react** — không thay đổi (named import, tree-shake OK).

## Đo lường

```bash
# Build + báo cáo visual (stats.html không precache PWA)
npm run build:analyze
# Mở dist/stats.html trong trình duyệt

# Kiểm tra ngưỡng chunk
npm run build && node scripts/check-bundle-size.mjs
```

Kiểm tra framer-motion không load lúc startup: DevTools → Network → reload `/` hoặc `/dang-nhap` → không thấy `framer-motion-*.js` cho đến khi vào module có animation.

## Quy ước khi thêm dependency

- Thư viện >50KB gzip: **dynamic import** hoặc lazy component.
- Locale module mới: thêm `features/xxx/locales/vi.json` (chỉ vi) + import/spread trong `locales/vi/feature-locales.ts`.
- Export/import: dùng `LazyExportDialog` / `LazyImportDialog`, không import trực tiếp.
- Dialog/drawer trên shell global (`App`, `Layout`): dùng CSS + `usePresenceTransition`, **không** import `framer-motion`.

## PWA

Precache chỉ HTML/shell/fonts — không precache toàn bộ JS chunks (xem `vite.config.ts` workbox `globPatterns`). `stats.html` (bundle analyzer) bị loại khỏi precache qua `globIgnores`.
