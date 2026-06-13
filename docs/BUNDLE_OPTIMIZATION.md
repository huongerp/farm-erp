# Tối ưu bundle — farm-erp

## Baseline hiện tại (Phase 4 — 2026-06-13)

Sau lazy i18n feature + Sentry/ImportDialog lazy. Cập nhật số liệu:

```bash
npm run build && npm run update:bundle-baseline
npm run check:bundle
```

| Chunk | Raw (~KB) | Gzip (~KB) | Ghi chú |
|-------|-----------|------------|---------|
| `index-*.js` (main) | **503** | **~140** | Shell + core i18n (không còn ~30 feature JSON) |
| `vendor-xlsx-*.js` | ~419 | ~143 | Chỉ khi export Excel |
| `vendor-jspdf-*.js` | ~408 | ~136 | Chỉ khi in/PDF |
| `vendor-html2canvas-*.js` | ~196 | ~47 | PDF từ HTML |
| `recharts-*.js` | ~376 | ~113 | Tab thống kê / chart |
| `framer-motion-*.js` | ~119 | ~39 | Module có animation |
| `sentry-*.js` | ~11 | ~3 | Chỉ init khi có DSN (dynamic) |

Ngưỡng CI: `npm run check:bundle` — main fail nếu vượt baseline +5% (xem `scripts/bundle-baseline.json`).

## Lịch sử (tham khảo)

| Giai đoạn | Main raw (~KB) | Ghi chú |
|-----------|----------------|---------|
| Trước tối ưu | ~1094 | Monolith export-libs |
| Phase 1–2 | ~519 | Tách vendor, lazy export |
| Phase 3 | ~519 | framer-motion off critical shell |
| Pre–Phase 4 | ~716 | Feature locales gom startup |
| Phase 4 | **503** | Lazy i18n feature + Sentry/ImportDialog cleanup (−213 KB main) |

## Thay đổi đã áp dụng

### Phase 1–2

1. **Tách export libs** — `vendor-xlsx`, `vendor-jspdf`, `vendor-html2canvas`.
2. **Lazy ExportDialog / ImportDialog** — `LazyExportDialog`, `LazyImportDialog`.
3. **Recharts** — tab Thống kê `React.lazy` StatsCharts.

### Phase 3

1. **Shell CSS** — Layout, ConfirmDialog, Login dùng CSS + `usePresenceTransition`.
2. **Dynamic PDF/Excel** — `await import('jspdf')` / `import('xlsx')` trong handler.

### Phase 4 (mới)

1. **Lazy feature i18n** — [lib/feature-i18n.ts](../lib/feature-i18n.ts): locale `features/*/locales/vi.json` load khi mở submenu/preview (`wrapModuleImportWithFeatureI18n`, `lazyWithFeatureI18n`). Core vi ([locales/vi/core.ts](../locales/vi/core.ts)) giữ shell keys.
2. **Sentry dynamic** — [lib/sentry-client.ts](../lib/sentry-client.ts); ErrorBoundary không static import `@sentry/react`.
3. **LazyImportDialog thống nhất** — mọi entry import dùng `LazyImportDialog`.
4. **Bundle baseline** — [scripts/bundle-baseline.json](../scripts/bundle-baseline.json) + `check:bundle` so sánh +5% main.

## Đo lường

```bash
npm run build:analyze          # dist/stats.html
npm run build && npm run check:bundle
npm run update:bundle-baseline # sau khi chấp nhận kích thước mới
```

Critical path: reload `/dang-nhap` → không thấy `vendor-xlsx`, `vendor-jspdf`, `recharts`, feature locale chunks.

## Quy ước khi thêm module

- Locale feature: thêm loader trong [lib/feature-i18n.ts](../lib/feature-i18n.ts) (không spread vào `core.ts`).
- Export/import: `LazyExportDialog` / `LazyImportDialog`.
- Thư viện >50KB gzip: dynamic import hoặc lazy component.
- Shell global: CSS + `usePresenceTransition`, tránh `framer-motion`.

## PWA

Precache chỉ HTML/shell/fonts — xem `vite.config.ts` workbox `globPatterns`.
