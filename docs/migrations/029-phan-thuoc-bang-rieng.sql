-- 029: Submenu "Phân thuốc" — bộ bảng kho riêng `fp_pt_*`, KHÔNG dùng chung dữ liệu với Nhà sơ chế.
--
-- Nhân bản cấu trúc nhóm kho của Nhà sơ chế (`fp_farm_*`: hàng hoá, phiếu kho, kiểm kê, đề xuất mua
-- hàng, tiến độ mua hàng) sang tên mới. Định nghĩa lấy từ DB thật ngày 2026-10-09 (pg_dump + pg_get_functiondef)
-- rồi chỉ đổi tên, nên hành vi giống hệt bản Sơ chế. Bảng mới bắt đầu trống, id đếm lại từ 1.
-- App: features/quan-ly-nha-so-che/kho-bien-the/bien-the.ts (BIEN_THE_PHAN_THUOC) phải khớp các tên dưới đây.
--
-- Dùng chung với Sơ chế / Mua hàng (cố ý): danh sách kho `fp_mh_danh_sach_kho`, nhân viên `fp_var_nhan_vien`.
-- Số phiếu: PNK- / PXK- / PCK- (phiếu kho), PDX- (đề xuất, app ghép), PKK-YYYY-NNNN (đợt kiểm kê, app ghép).
--
-- Chạy: bash scripts/db-backup.sh truoc-029
--       bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/029-phan-thuoc-bang-rieng.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Sequence cấp số phiếu / mã đợt
-- ---------------------------------------------------------------------------

CREATE SEQUENCE public.fp_pt_de_xuat_mua_hang_so_seq;
CREATE SEQUENCE public.fp_pt_dot_kiem_ke_ma_seq;
CREATE SEQUENCE public.fp_pt_phieu_kho_so_seq_chuyen;
CREATE SEQUENCE public.fp_pt_phieu_kho_so_seq_nhap;
CREATE SEQUENCE public.fp_pt_phieu_kho_so_seq_xuat;

-- ---------------------------------------------------------------------------
-- 2. Bảng
-- ---------------------------------------------------------------------------

CREATE TABLE public.fp_pt_danh_muc_hang_hoa (
    id bigint NOT NULL,
    ma_danh_muc text,
    ten_danh_muc text,
    danh_muc_cha_id bigint,
    thu_tu smallint,
    mo_ta text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.fp_pt_danh_sach_hang_hoa (
    id bigint NOT NULL,
    danh_muc_id bigint,
    danh_muc_cha_id bigint,
    ma_hang_hoa text,
    ten_hang_hoa text,
    dvt text,
    don_gia numeric,
    mo_ta text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    pham_cap text,
    dinh_muc numeric(18,4),
    CONSTRAINT fp_pt_danh_sach_hang_hoa_dinh_muc_check CHECK (((dinh_muc IS NULL) OR (dinh_muc >= (0)::numeric)))
);

CREATE TABLE public.fp_pt_de_xuat_mua_hang (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    ngay_can date NOT NULL,
    id_noi_de_xuat bigint NOT NULL,
    id_nguoi_de_xuat bigint NOT NULL,
    id_nguoi_duyet bigint,
    ghi_chu text,
    trang_thai text DEFAULT 'Chờ duyệt'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.fp_pt_de_xuat_mua_hang_chi_tiet (
    id bigint NOT NULL,
    id_de_xuat_mua_hang bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong numeric(18,4) NOT NULL,
    don_vi_tinh text,
    thong_so text,
    ghi_chu text,
    id_tien_do_mh bigint,
    ten_tien_do_mh text,
    trao_doi text,
    so_phieu text,
    ngay date,
    ngay_can date,
    ten_noi_de_xuat text,
    ten_nguoi_de_xuat text,
    ten_nguoi_duyet text,
    trang_thai_phieu text
);

CREATE TABLE public.fp_pt_dot_kiem_ke (
    id bigint NOT NULL,
    ma_dot text NOT NULL,
    ten_dot text NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_ket_thuc date NOT NULL,
    trang_thai text DEFAULT 'draft'::text NOT NULL,
    id_nguoi_phu_trach bigint NOT NULL,
    id_nguoi_tao bigint,
    ghi_chu text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.fp_pt_dot_kiem_ke_chi_tiet (
    id bigint NOT NULL,
    id_dot_kiem_ke_pt bigint NOT NULL,
    id_kho bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong_so numeric(18,4) DEFAULT 0 NOT NULL,
    so_luong_thuc_te numeric(18,4),
    ket_qua text DEFAULT 'chua_kiem'::text NOT NULL,
    ghi_chu_dong text,
    id_nguoi_kiem bigint,
    ngay_kiem timestamp with time zone,
    id_phieu_kho_dieu_chinh bigint,
    so_luong_dieu_chinh numeric(18,4),
    tg_dieu_chinh_ton timestamp with time zone,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.fp_pt_dot_kiem_ke_kho (
    id_dot_kiem_ke_pt bigint NOT NULL,
    id_kho bigint NOT NULL
);

CREATE TABLE public.fp_pt_phieu_kho (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    loai text NOT NULL,
    kho_id bigint NOT NULL,
    ten_kho text,
    kho_den_id bigint,
    ten_kho_den text,
    trang_thai text DEFAULT 'Chờ duyệt'::text NOT NULL,
    mo_ta text,
    trao_doi text,
    id_nguoi_duyet bigint,
    nguoi_tao_id bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    id_de_xuat_mua_hang bigint,
    so_phieu_de_xuat text,
    CONSTRAINT fp_pt_phieu_kho_loai_check CHECK ((loai = ANY (ARRAY['nhập'::text, 'xuất'::text, 'chuyển'::text])))
);

CREATE TABLE public.fp_pt_phieu_kho_chi_tiet (
    id bigint NOT NULL,
    id_phieu_kho bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    ten_hang_hoa text,
    don_vi_tinh text,
    so_luong numeric(18,4) NOT NULL,
    don_gia numeric(18,4) DEFAULT 0,
    thanh_tien numeric(18,4) DEFAULT 0,
    so_lot text,
    ghi_chu text,
    nguoi_tao_id bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    pham_cap text,
    CONSTRAINT fp_pt_phieu_kho_chi_tiet_so_luong_check CHECK ((so_luong > (0)::numeric))
);

CREATE TABLE public.fp_pt_tien_do_mua_hang (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    mau text,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone,
    tg_cap_nhat timestamp with time zone
);

ALTER TABLE public.fp_pt_danh_muc_hang_hoa ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_danh_muc_hang_hoa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_danh_sach_hang_hoa ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_danh_sach_hang_hoa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_de_xuat_mua_hang_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_de_xuat_mua_hang_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_de_xuat_mua_hang ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_de_xuat_mua_hang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_dot_kiem_ke_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_dot_kiem_ke_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_dot_kiem_ke ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_dot_kiem_ke_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_phieu_kho_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_phieu_kho_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_phieu_kho ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_pt_phieu_kho_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.fp_pt_tien_do_mua_hang ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_pt_tien_do_mua_hang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Khoá chính / unique

ALTER TABLE ONLY public.fp_pt_danh_muc_hang_hoa
    ADD CONSTRAINT fp_pt_danh_muc_hang_hoa_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_danh_sach_hang_hoa
    ADD CONSTRAINT fp_pt_danh_sach_hang_hoa_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_de_xuat_mua_hang_chi_tiet
    ADD CONSTRAINT fp_pt_de_xuat_mua_hang_chi_tiet_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_de_xuat_mua_hang
    ADD CONSTRAINT fp_pt_de_xuat_mua_hang_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_pt_dot_kiem_ke_chi_ti_id_dot_kiem_ke_pt_id_kho_id_h_key UNIQUE (id_dot_kiem_ke_pt, id_kho, id_hang_hoa);

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_pt_dot_kiem_ke_chi_tiet_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_kho
    ADD CONSTRAINT fp_pt_dot_kiem_ke_kho_pkey PRIMARY KEY (id_dot_kiem_ke_pt, id_kho);

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke
    ADD CONSTRAINT fp_pt_dot_kiem_ke_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_phieu_kho_chi_tiet
    ADD CONSTRAINT fp_pt_phieu_kho_chi_tiet_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_phieu_kho
    ADD CONSTRAINT fp_pt_phieu_kho_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fp_pt_tien_do_mua_hang
    ADD CONSTRAINT fp_pt_tien_do_mua_hang_ma_key UNIQUE (ma);

ALTER TABLE ONLY public.fp_pt_tien_do_mua_hang
    ADD CONSTRAINT fp_pt_tien_do_mua_hang_pkey PRIMARY KEY (id);

-- Chỉ mục

CREATE INDEX idx_fp_pt_danh_muc_hang_hoa_danh_muc_cha_id ON public.fp_pt_danh_muc_hang_hoa USING btree (danh_muc_cha_id);

CREATE INDEX idx_fp_pt_danh_muc_hang_hoa_thu_tu ON public.fp_pt_danh_muc_hang_hoa USING btree (thu_tu);

CREATE INDEX idx_fp_pt_danh_sach_hang_hoa_danh_muc_cha_id ON public.fp_pt_danh_sach_hang_hoa USING btree (danh_muc_cha_id);

CREATE INDEX idx_fp_pt_danh_sach_hang_hoa_danh_muc_id ON public.fp_pt_danh_sach_hang_hoa USING btree (danh_muc_id);

CREATE INDEX idx_fp_pt_danh_sach_hang_hoa_ma_trgm ON public.fp_pt_danh_sach_hang_hoa USING gin (ma_hang_hoa public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_danh_sach_hang_hoa_ten_trgm ON public.fp_pt_danh_sach_hang_hoa USING gin (ten_hang_hoa public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_ghi_chu_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (ghi_chu public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_so_phieu_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (so_phieu public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_ten_nguoi_duyet_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (ten_nguoi_duyet public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_ten_nguoi_dx_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (ten_nguoi_de_xuat public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_ten_noi_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (ten_noi_de_xuat public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_ten_tien_do_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (ten_tien_do_mh public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_thong_so_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (thong_so public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mh_ct_trao_doi_trgm ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING gin (trao_doi public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_ct_id_hang_hoa ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING btree (id_hang_hoa);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_ct_id_phieu ON public.fp_pt_de_xuat_mua_hang_chi_tiet USING btree (id_de_xuat_mua_hang);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_ghi_chu_trgm ON public.fp_pt_de_xuat_mua_hang USING gin (ghi_chu public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_id_nguoi_de_xuat ON public.fp_pt_de_xuat_mua_hang USING btree (id_nguoi_de_xuat);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_id_noi_de_xuat ON public.fp_pt_de_xuat_mua_hang USING btree (id_noi_de_xuat);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_ngay ON public.fp_pt_de_xuat_mua_hang USING btree (ngay);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_ngay_can ON public.fp_pt_de_xuat_mua_hang USING btree (ngay_can);

CREATE UNIQUE INDEX idx_fp_pt_de_xuat_mua_hang_so_phieu ON public.fp_pt_de_xuat_mua_hang USING btree (so_phieu);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_so_phieu_trgm ON public.fp_pt_de_xuat_mua_hang USING gin (so_phieu public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_trang_thai ON public.fp_pt_de_xuat_mua_hang USING btree (trang_thai);

CREATE INDEX idx_fp_pt_de_xuat_mua_hang_trang_thai_trgm ON public.fp_pt_de_xuat_mua_hang USING gin (trang_thai public.gin_trgm_ops);

CREATE INDEX idx_fp_pt_dot_kk_ct_id_dot ON public.fp_pt_dot_kiem_ke_chi_tiet USING btree (id_dot_kiem_ke_pt);

CREATE INDEX idx_fp_pt_dot_kk_ct_id_hang_hoa ON public.fp_pt_dot_kiem_ke_chi_tiet USING btree (id_hang_hoa);

CREATE INDEX idx_fp_pt_dot_kk_ct_id_kho ON public.fp_pt_dot_kiem_ke_chi_tiet USING btree (id_kho);

CREATE INDEX idx_fp_pt_dot_kk_ct_phieu ON public.fp_pt_dot_kiem_ke_chi_tiet USING btree (id_phieu_kho_dieu_chinh) WHERE (id_phieu_kho_dieu_chinh IS NOT NULL);

CREATE INDEX idx_fp_pt_dot_kk_kho_id_dot ON public.fp_pt_dot_kiem_ke_kho USING btree (id_dot_kiem_ke_pt);

CREATE INDEX idx_fp_pt_dot_kk_kho_id_kho ON public.fp_pt_dot_kiem_ke_kho USING btree (id_kho);

CREATE UNIQUE INDEX idx_fp_pt_dot_kk_ma_dot ON public.fp_pt_dot_kiem_ke USING btree (ma_dot);

CREATE INDEX idx_fp_pt_dot_kk_ngay_bat_dau ON public.fp_pt_dot_kiem_ke USING btree (ngay_bat_dau);

CREATE INDEX idx_fp_pt_dot_kk_ngay_ket_thuc ON public.fp_pt_dot_kiem_ke USING btree (ngay_ket_thuc);

CREATE INDEX idx_fp_pt_dot_kk_nguoi_phu_trach ON public.fp_pt_dot_kiem_ke USING btree (id_nguoi_phu_trach);

CREATE INDEX idx_fp_pt_dot_kk_nguoi_tao ON public.fp_pt_dot_kiem_ke USING btree (id_nguoi_tao);

CREATE INDEX idx_fp_pt_dot_kk_trang_thai ON public.fp_pt_dot_kiem_ke USING btree (trang_thai);

CREATE INDEX idx_fp_pt_phieu_kho_ct_id_phieu ON public.fp_pt_phieu_kho_chi_tiet USING btree (id_phieu_kho);

CREATE INDEX idx_fp_pt_phieu_kho_id_de_xuat_mua_hang ON public.fp_pt_phieu_kho USING btree (id_de_xuat_mua_hang) WHERE (id_de_xuat_mua_hang IS NOT NULL);

CREATE INDEX idx_fp_pt_phieu_kho_kho_id ON public.fp_pt_phieu_kho USING btree (kho_id);

CREATE INDEX idx_fp_pt_phieu_kho_loai ON public.fp_pt_phieu_kho USING btree (loai);

CREATE INDEX idx_fp_pt_phieu_kho_ngay ON public.fp_pt_phieu_kho USING btree (ngay);

CREATE UNIQUE INDEX idx_fp_pt_phieu_kho_so_phieu_loai ON public.fp_pt_phieu_kho USING btree (so_phieu, loai);

CREATE UNIQUE INDEX uq_fp_pt_danh_muc_hang_hoa_ma ON public.fp_pt_danh_muc_hang_hoa USING btree (ma_danh_muc);

CREATE UNIQUE INDEX uq_fp_pt_danh_sach_hang_hoa_ma ON public.fp_pt_danh_sach_hang_hoa USING btree (ma_hang_hoa);

-- Khoá ngoại (bảng mới trống nên tạo VALID luôn)

ALTER TABLE ONLY public.fp_pt_danh_muc_hang_hoa
    ADD CONSTRAINT fp_pt_danh_muc_hang_hoa_danh_muc_cha_id_fkey FOREIGN KEY (danh_muc_cha_id) REFERENCES public.fp_pt_danh_muc_hang_hoa(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.fp_pt_danh_sach_hang_hoa
    ADD CONSTRAINT fp_pt_danh_sach_hang_hoa_danh_muc_cha_id_fkey FOREIGN KEY (danh_muc_cha_id) REFERENCES public.fp_pt_danh_muc_hang_hoa(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.fp_pt_danh_sach_hang_hoa
    ADD CONSTRAINT fp_pt_danh_sach_hang_hoa_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.fp_pt_danh_muc_hang_hoa(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.fp_pt_de_xuat_mua_hang_chi_tiet
    ADD CONSTRAINT fp_pt_de_xuat_mua_hang_chi_tiet_id_de_xuat_mua_hang_fkey FOREIGN KEY (id_de_xuat_mua_hang) REFERENCES public.fp_pt_de_xuat_mua_hang(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.fp_pt_de_xuat_mua_hang_chi_tiet
    ADD CONSTRAINT fp_pt_de_xuat_mua_hang_chi_tiet_id_hang_hoa_fkey FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_pt_danh_sach_hang_hoa(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_pt_dot_kiem_ke_chi_tiet_id_dot_kiem_ke_pt_fkey FOREIGN KEY (id_dot_kiem_ke_pt) REFERENCES public.fp_pt_dot_kiem_ke(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_pt_dot_kiem_ke_chi_tiet_id_hang_hoa_fkey FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_pt_danh_sach_hang_hoa(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke
    ADD CONSTRAINT fp_pt_dot_kiem_ke_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_kho
    ADD CONSTRAINT fp_pt_dot_kiem_ke_kho_id_dot_kiem_ke_pt_fkey FOREIGN KEY (id_dot_kiem_ke_pt) REFERENCES public.fp_pt_dot_kiem_ke(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.fp_pt_dot_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_pt_dot_kk_ct_phieu_fkey FOREIGN KEY (id_phieu_kho_dieu_chinh) REFERENCES public.fp_pt_phieu_kho(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.fp_pt_phieu_kho_chi_tiet
    ADD CONSTRAINT fp_pt_phieu_kho_chi_tiet_id_hang_hoa_fkey FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_pt_danh_sach_hang_hoa(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.fp_pt_phieu_kho_chi_tiet
    ADD CONSTRAINT fp_pt_phieu_kho_chi_tiet_id_phieu_kho_fkey FOREIGN KEY (id_phieu_kho) REFERENCES public.fp_pt_phieu_kho(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. View (security_invoker — RLS của bảng gốc vẫn áp)
-- ---------------------------------------------------------------------------

CREATE VIEW public.v_pt_de_xuat_mua_hang_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id,
    ct.id_de_xuat_mua_hang,
    ct.id_hang_hoa,
    ct.so_luong,
    ct.don_vi_tinh,
    ct.thong_so,
    ct.ghi_chu,
    ct.id_tien_do_mh,
    ct.ten_tien_do_mh,
    ct.trao_doi,
    ct.so_phieu,
    ct.ngay,
    ct.ngay_can,
    ct.ten_noi_de_xuat,
    ct.ten_nguoi_de_xuat,
    ct.ten_nguoi_duyet,
    ct.trang_thai_phieu,
    hh.ma_hang_hoa AS ref_ma_hang_hoa,
    hh.ten_hang_hoa AS ref_ten_hang_hoa
   FROM (public.fp_pt_de_xuat_mua_hang_chi_tiet ct
     LEFT JOIN public.fp_pt_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));

CREATE VIEW public.v_pt_de_xuat_mua_hang_summary WITH (security_invoker='true') AS
 SELECT p.id,
    p.so_phieu,
    p.ngay,
    p.ngay_can,
    p.id_noi_de_xuat,
    p.id_nguoi_de_xuat,
    p.id_nguoi_duyet,
    p.ghi_chu,
    p.trang_thai,
    p.tg_tao,
    p.tg_cap_nhat,
    kho_ref.ten_kho AS ref_ten_noi_de_xuat,
    nv_dx.ho_va_ten AS ref_ten_nguoi_de_xuat,
    ('NV'::text || (nv_dx.id)::text) AS ref_ma_nguoi_de_xuat,
    nv_du.ho_va_ten AS ref_ten_nguoi_duyet,
        CASE
            WHEN (p.id_nguoi_duyet IS NOT NULL) THEN ('NV'::text || (p.id_nguoi_duyet)::text)
            ELSE NULL::text
        END AS ref_ma_nguoi_duyet,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.ref_chi_tiet_tim_kiem, ''::text) AS ref_chi_tiet_tim_kiem,
    TRIM(BOTH ' '::text FROM concat_ws(' '::text, NULLIF(btrim(COALESCE((p.ngay)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.ngay_can)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.tg_tao)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.tg_cap_nhat)::text, ''::text)), ''::text))) AS ref_ngay_va_thoi_gian_tim_kiem,
    kho_ref.chi_nhanh_id AS ref_id_chi_nhanh_noi_de_xuat
   FROM ((((public.fp_pt_de_xuat_mua_hang p
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = p.id_noi_de_xuat)))
     LEFT JOIN public.fp_var_nhan_vien nv_dx ON ((nv_dx.id = p.id_nguoi_de_xuat)))
     LEFT JOIN public.fp_var_nhan_vien nv_du ON ((nv_du.id = p.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            NULLIF(string_agg(DISTINCT concat_ws(' '::text, NULLIF(btrim(COALESCE(hh.ma_hang_hoa, ''::text)), ''::text), NULLIF(btrim(COALESCE(hh.ten_hang_hoa, ''::text)), ''::text), NULLIF(btrim(COALESCE(ct.thong_so, ''::text)), ''::text), NULLIF(btrim(COALESCE(ct.ghi_chu, ''::text)), ''::text)), ' '::text), ''::text) AS ref_chi_tiet_tim_kiem
           FROM (public.fp_pt_de_xuat_mua_hang_chi_tiet ct
             LEFT JOIN public.fp_pt_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)))
          WHERE (ct.id_de_xuat_mua_hang = p.id)) agg ON (true));

CREATE VIEW public.v_pt_phieu_kho_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id AS chi_tiet_id,
    ct.id_phieu_kho,
    ct.id_hang_hoa,
    ct.ten_hang_hoa,
    ct.don_vi_tinh,
    COALESCE(NULLIF(btrim(ct.pham_cap), ''::text), NULLIF(btrim(hh.pham_cap), ''::text)) AS pham_cap,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien,
    ct.so_lot,
    ct.ghi_chu,
    ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
    ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
    ct.tg_tao AS chi_tiet_tg_tao,
    ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
    pk.id AS phieu_id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.nguoi_tao_id AS phieu_nguoi_tao_id,
    pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
    pk.id_nguoi_duyet,
    pk.tg_tao AS phieu_tg_tao,
    pk.tg_cap_nhat AS phieu_tg_cap_nhat,
    hh.ma_hang_hoa AS ma_hang
   FROM ((public.fp_pt_phieu_kho_chi_tiet ct
     JOIN public.fp_pt_phieu_kho pk ON ((pk.id = ct.id_phieu_kho)))
     LEFT JOIN public.fp_pt_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));

CREATE VIEW public.v_pt_phieu_kho_summary WITH (security_invoker='true') AS
 SELECT pk.id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.id_nguoi_duyet,
    pk.nguoi_tao_id,
    pk.ten_nguoi_tao,
    pk.tg_tao,
    pk.tg_cap_nhat,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.tong_tien, (0)::numeric) AS tong_tien,
    kho_ref.ten_kho AS ref_ten_kho,
    kho_den_ref.ten_kho AS ref_ten_kho_den,
    nv_t.ho_va_ten AS ref_ten_nguoi_tao,
    nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
    pk.id_de_xuat_mua_hang,
    pk.so_phieu_de_xuat
   FROM (((((public.fp_pt_phieu_kho pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_pt_phieu_kho_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));

CREATE VIEW public.v_pt_ton_kho WITH (security_invoker='true') AS
 SELECT id_kho,
    id_hang_hoa,
    (sum(delta))::numeric(18,4) AS so_luong
   FROM ( SELECT pk.kho_id AS id_kho,
            ct.id_hang_hoa,
            ct.so_luong AS delta
           FROM (public.fp_pt_phieu_kho pk
             JOIN public.fp_pt_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'nhập'::text) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong)
           FROM (public.fp_pt_phieu_kho pk
             JOIN public.fp_pt_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'xuất'::text) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong)
           FROM (public.fp_pt_phieu_kho pk
             JOIN public.fp_pt_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'chuyển'::text) AND (pk.kho_den_id IS NOT NULL) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_den_id,
            ct.id_hang_hoa,
            ct.so_luong
           FROM (public.fp_pt_phieu_kho pk
             JOIN public.fp_pt_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'chuyển'::text) AND (pk.kho_den_id IS NOT NULL) AND (pk.trang_thai <> 'Không duyệt'::text))) t
  GROUP BY id_kho, id_hang_hoa;

CREATE VIEW public.v_xuat_pt_phieu_kho WITH (security_invoker='true') AS
 SELECT id,
    so_phieu,
    ngay,
    loai,
    trang_thai,
    kho_id,
    COALESCE(ref_ten_kho, ten_kho) AS ten_kho,
    kho_den_id,
        CASE
            WHEN (kho_den_id IS NOT NULL) THEN COALESCE(ref_ten_kho_den, ten_kho_den)
            ELSE NULL::text
        END AS ten_kho_den,
    mo_ta,
    trao_doi,
    nguoi_tao_id,
        CASE
            WHEN (nguoi_tao_id IS NOT NULL) THEN COALESCE(ten_nguoi_tao, ref_ten_nguoi_tao)
            ELSE NULL::text
        END AS ten_nguoi_tao,
    id_nguoi_duyet,
        CASE
            WHEN (id_nguoi_duyet IS NOT NULL) THEN ref_ten_nguoi_duyet
            ELSE NULL::text
        END AS ten_nguoi_duyet,
    tg_tao,
    tg_cap_nhat,
    so_dong AS tong_so_dong,
    tong_so_luong,
    tong_tien
   FROM public.v_pt_phieu_kho_summary s;

-- ---------------------------------------------------------------------------
-- 4. Hàm: trigger nghiệp vụ + RPC (bản sao của hàm fp_farm_* / *_farm_*)
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.fp_pt_de_xuat_mua_hang_after_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE fp_pt_de_xuat_mua_hang_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         ngay_can = NEW.ngay_can,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_de_xuat_mua_hang = NEW.id;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.fp_pt_de_xuat_mua_hang_ct_sync_phieu()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, ngay_can, trang_thai
    INTO p
    FROM fp_pt_de_xuat_mua_hang
   WHERE id = NEW.id_de_xuat_mua_hang;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.ngay_can := p.ngay_can;
    NEW.trang_thai_phieu := p.trang_thai;
    -- ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet do app điền (cần join kho/nhân viên)
  END IF;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.fp_pt_de_xuat_mua_hang_tg_cap_nhat()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.fp_pt_dot_kiem_ke_tg_cap_nhat()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.fp_pt_phieu_kho_before_delete_clear_kiem_ke()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.fp_pt_dot_kiem_ke_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = NULL,
    so_luong_dieu_chinh = NULL,
    tg_dieu_chinh_ton = NULL
  WHERE id_phieu_kho_dieu_chinh = OLD.id;
  RETURN OLD;
END;
$function$;

CREATE FUNCTION public.fp_pt_phieu_kho_ct_thanh_tien()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.fp_pt_phieu_kho_tg_cap_nhat()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.fp_pt_tien_do_mua_hang_set_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.tg_tao      := COALESCE(NEW.tg_tao, now());
    NEW.tg_cap_nhat := now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.tg_cap_nhat := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.get_next_ma_dot_pt_kiem_ke()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN nextval('fp_pt_dot_kiem_ke_ma_seq');
END;
$function$;

CREATE FUNCTION public.get_next_so_phieu_pt_de_xuat_mua_hang()
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT nextval('fp_pt_de_xuat_mua_hang_so_seq');
$function$;

CREATE FUNCTION public.get_next_so_phieu_pt_phieu_kho(p_loai text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_val bigint;
  prefix text;
BEGIN
  IF p_loai = 'nhập' THEN
    next_val := nextval('fp_pt_phieu_kho_so_seq_nhap');
    prefix := 'PNK-';
  ELSIF p_loai = 'xuất' THEN
    next_val := nextval('fp_pt_phieu_kho_so_seq_xuat');
    prefix := 'PXK-';
  ELSIF p_loai = 'chuyển' THEN
    next_val := nextval('fp_pt_phieu_kho_so_seq_chuyen');
    prefix := 'PCK-';
  ELSE
    RAISE EXCEPTION 'Invalid loai: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$function$;

CREATE FUNCTION public.pt_kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id_kho bigint;
  v_id_hh bigint;
  v_so_so numeric;
  v_so_tt numeric;
  v_id_phieu_old bigint;
  v_dot_tt text;
  v_ma_dot text;
  v_ngay date;
  v_delta numeric;
  v_loai text;
  v_so_phieu text;
  v_id_phieu bigint;
  v_ten_kho text;
  v_ten_hh text;
  v_dvt text;
  v_pham_cap text;
  v_ten_nv text;
BEGIN
  SELECT
    ct.id_kho,
    ct.id_hang_hoa,
    ct.so_luong_so,
    ct.so_luong_thuc_te,
    ct.id_phieu_kho_dieu_chinh,
    d.trang_thai,
    d.ma_dot,
    d.ngay_ket_thuc::date
  INTO
    v_id_kho,
    v_id_hh,
    v_so_so,
    v_so_tt,
    v_id_phieu_old,
    v_dot_tt,
    v_ma_dot,
    v_ngay
  FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
  JOIN public.fp_pt_dot_kiem_ke d ON d.id = ct.id_dot_kiem_ke_pt
  WHERE ct.id = p_id_chi_tiet
  FOR UPDATE OF ct;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kiem_ke_chi_tiet_not_found';
  END IF;

  IF v_dot_tt IS DISTINCT FROM 'dang_kiem_ke' THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_dang_kiem_ke';
  END IF;

  IF v_id_phieu_old IS NOT NULL THEN
    RAISE EXCEPTION 'kiem_ke_already_adjusted';
  END IF;

  IF v_so_tt IS NULL THEN
    RAISE EXCEPTION 'kiem_ke_no_thuc_te';
  END IF;

  v_delta := v_so_tt - v_so_so;
  -- Chi tiết phiếu kho farm có CHECK (so_luong > 0) nên delta = 0 phải chặn ở đây.
  IF v_delta = 0 THEN
    RAISE EXCEPTION 'kiem_ke_no_variance';
  END IF;

  IF v_delta > 0 THEN
    v_loai := 'nhập';
  ELSE
    v_loai := 'xuất';
  END IF;

  SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = v_id_kho;
  SELECT h.ten_hang_hoa, h.dvt, h.pham_cap
    INTO v_ten_hh, v_dvt, v_pham_cap
    FROM public.fp_pt_danh_sach_hang_hoa h WHERE h.id = v_id_hh;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  v_so_phieu := get_next_so_phieu_pt_phieu_kho(v_loai);

  INSERT INTO public.fp_pt_phieu_kho (
    so_phieu,
    ngay,
    loai,
    kho_id,
    ten_kho,
    kho_den_id,
    ten_kho_den,
    trang_thai,
    mo_ta,
    nguoi_tao_id,
    ten_nguoi_tao
  ) VALUES (
    v_so_phieu,
    COALESCE(v_ngay, CURRENT_DATE),
    v_loai,
    v_id_kho,
    v_ten_kho,
    NULL,
    NULL,
    'Đã duyệt',
    format('Điều chỉnh tồn kiểm kê — Đợt %s', v_ma_dot),
    p_nguoi_tao_id,
    v_ten_nv
  )
  RETURNING id INTO v_id_phieu;

  INSERT INTO public.fp_pt_phieu_kho_chi_tiet (
    id_phieu_kho,
    id_hang_hoa,
    ten_hang_hoa,
    don_vi_tinh,
    pham_cap,
    so_luong,
    don_gia,
    ghi_chu,
    nguoi_tao_id,
    ten_nguoi_tao
  ) VALUES (
    v_id_phieu,
    v_id_hh,
    v_ten_hh,
    v_dvt,
    v_pham_cap,
    abs(v_delta),
    0,
    format('Điều chỉnh tồn kiểm kê — dòng chi tiết #%s', p_id_chi_tiet),
    p_nguoi_tao_id,
    v_ten_nv
  );

  UPDATE public.fp_pt_dot_kiem_ke_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = v_id_phieu,
    so_luong_dieu_chinh = abs(v_delta),
    tg_dieu_chinh_ton = now()
  WHERE id = p_id_chi_tiet;

  RETURN v_id_phieu;
END;
$function$;

CREATE FUNCTION public.pt_kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dot_tt text;
  v_ma_dot text;
  v_ngay date;
  v_ten_nv text;
  v_updated int := 0;
  rec_grp RECORD;
  v_so_phieu text;
  v_id_phieu bigint;
  v_ten_kho text;
  v_ten_hh text;
  v_dvt text;
  v_pham_cap text;
  line_rec RECORD;
BEGIN
  SELECT d.trang_thai, d.ma_dot, d.ngay_ket_thuc::date
  INTO v_dot_tt, v_ma_dot, v_ngay
  FROM public.fp_pt_dot_kiem_ke d
  WHERE d.id = p_id_dot
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_found';
  END IF;

  IF v_dot_tt IS DISTINCT FROM 'dang_kiem_ke' THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_dang_kiem_ke';
  END IF;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  -- Khoá trước mọi dòng sắp điều chỉnh, tránh hai người bấm cùng lúc sinh hai phiếu.
  PERFORM 1
  FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
  WHERE ct.id_dot_kiem_ke_pt = p_id_dot
    AND ct.id_phieu_kho_dieu_chinh IS NULL
    AND ct.so_luong_thuc_te IS NOT NULL
    AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  FOR UPDATE OF ct;

  FOR rec_grp IN
    SELECT DISTINCT
      ct.id_kho,
      CASE WHEN (ct.so_luong_thuc_te - ct.so_luong_so) > 0 THEN 'nhập'::text ELSE 'xuất'::text END AS loai
    FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
    WHERE ct.id_dot_kiem_ke_pt = p_id_dot
      AND ct.id_phieu_kho_dieu_chinh IS NULL
      AND ct.so_luong_thuc_te IS NOT NULL
      AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  LOOP
    SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = rec_grp.id_kho;

    v_so_phieu := get_next_so_phieu_pt_phieu_kho(rec_grp.loai);

    INSERT INTO public.fp_pt_phieu_kho (
      so_phieu,
      ngay,
      loai,
      kho_id,
      ten_kho,
      kho_den_id,
      ten_kho_den,
      trang_thai,
      mo_ta,
      nguoi_tao_id,
      ten_nguoi_tao
    ) VALUES (
      v_so_phieu,
      COALESCE(v_ngay, CURRENT_DATE),
      rec_grp.loai,
      rec_grp.id_kho,
      v_ten_kho,
      NULL,
      NULL,
      'Đã duyệt',
      format('Điều chỉnh tồn kiểm kê — Đợt %s (toàn đợt)', v_ma_dot),
      p_nguoi_tao_id,
      v_ten_nv
    )
    RETURNING id INTO v_id_phieu;

    FOR line_rec IN
      SELECT ct.id, ct.id_hang_hoa, abs(ct.so_luong_thuc_te - ct.so_luong_so) AS sl_dc
      FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
      WHERE ct.id_dot_kiem_ke_pt = p_id_dot
        AND ct.id_kho = rec_grp.id_kho
        AND ct.id_phieu_kho_dieu_chinh IS NULL
        AND ct.so_luong_thuc_te IS NOT NULL
        AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
        AND (
          (rec_grp.loai = 'nhập' AND (ct.so_luong_thuc_te - ct.so_luong_so) > 0)
          OR (rec_grp.loai = 'xuất' AND (ct.so_luong_thuc_te - ct.so_luong_so) < 0)
        )
      ORDER BY ct.id
    LOOP
      SELECT h.ten_hang_hoa, h.dvt, h.pham_cap
        INTO v_ten_hh, v_dvt, v_pham_cap
        FROM public.fp_pt_danh_sach_hang_hoa h WHERE h.id = line_rec.id_hang_hoa;

      INSERT INTO public.fp_pt_phieu_kho_chi_tiet (
        id_phieu_kho,
        id_hang_hoa,
        ten_hang_hoa,
        don_vi_tinh,
        pham_cap,
        so_luong,
        don_gia,
        ghi_chu,
        nguoi_tao_id,
        ten_nguoi_tao
      ) VALUES (
        v_id_phieu,
        line_rec.id_hang_hoa,
        v_ten_hh,
        v_dvt,
        v_pham_cap,
        line_rec.sl_dc,
        0,
        format('Điều chỉnh tồn kiểm kê — dòng chi tiết #%s', line_rec.id),
        p_nguoi_tao_id,
        v_ten_nv
      );

      UPDATE public.fp_pt_dot_kiem_ke_chi_tiet
      SET
        id_phieu_kho_dieu_chinh = v_id_phieu,
        so_luong_dieu_chinh = line_rec.sl_dc,
        tg_dieu_chinh_ton = now()
      WHERE id = line_rec.id;

      v_updated := v_updated + 1;
    END LOOP;
  END LOOP;

  RETURN v_updated;
END;
$function$;

CREATE FUNCTION public.rpc_pt_de_xuat_mua_hang_stats(p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_trang_thai text[] DEFAULT NULL::text[], p_id_noi_de_xuat bigint[] DEFAULT NULL::bigint[], p_id_nguoi_de_xuat bigint[] DEFAULT NULL::bigint[], p_id_nguoi_duyet bigint[] DEFAULT NULL::bigint[])
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
WITH base AS (
  SELECT p.*
  FROM public.fp_pt_de_xuat_mua_hang p
  WHERE
    (p_date_from IS NULL OR p.ngay::date >= p_date_from)
    AND (p_date_to IS NULL OR p.ngay::date <= p_date_to)
    AND (p_trang_thai IS NULL OR cardinality(p_trang_thai) = 0 OR p.trang_thai = ANY (p_trang_thai))
    AND (p_id_noi_de_xuat IS NULL OR cardinality(p_id_noi_de_xuat) = 0 OR p.id_noi_de_xuat = ANY (p_id_noi_de_xuat))
    AND (p_id_nguoi_de_xuat IS NULL OR cardinality(p_id_nguoi_de_xuat) = 0 OR p.id_nguoi_de_xuat = ANY (p_id_nguoi_de_xuat))
    AND (
      p_id_nguoi_duyet IS NULL OR cardinality(p_id_nguoi_duyet) = 0
      OR (p.id_nguoi_duyet IS NOT NULL AND p.id_nguoi_duyet = ANY (p_id_nguoi_duyet))
    )
),
fullset AS (
  SELECT * FROM public.fp_pt_de_xuat_mua_hang
),
chip_status AS (
  SELECT
    CASE p.trang_thai
      WHEN 'Chờ duyệt' THEN 'Pending'
      WHEN 'Đợi duyệt' THEN 'Waiting'
      WHEN 'Đã duyệt' THEN 'Approved'
      WHEN 'Không duyệt' THEN 'Rejected'
      ELSE 'Pending'
    END AS status_key,
    count(*)::int AS cnt
  FROM fullset p
  GROUP BY 1
),
chip_noi AS (
  SELECT p.id_noi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_de_xuat AS (
  SELECT p.id_nguoi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_duyet AS (
  SELECT p.id_nguoi_duyet::text AS id, count(*)::int AS cnt
  FROM fullset p
  WHERE p.id_nguoi_duyet IS NOT NULL
  GROUP BY 1
)
SELECT jsonb_build_object(
  'summary', (
    SELECT jsonb_build_object(
      'total', count(*)::int,
      'pending', coalesce(sum(CASE WHEN trang_thai = 'Chờ duyệt' THEN 1 ELSE 0 END), 0)::int,
      'waiting', coalesce(sum(CASE WHEN trang_thai = 'Đợi duyệt' THEN 1 ELSE 0 END), 0)::int,
      'approved', coalesce(sum(CASE WHEN trang_thai = 'Đã duyệt' THEN 1 ELSE 0 END), 0)::int,
      'rejected', coalesce(sum(CASE WHEN trang_thai = 'Không duyệt' THEN 1 ELSE 0 END), 0)::int
    ) FROM base
  ),
  'byTrangThai', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', status_key, 'count', cnt))
    FROM (
      SELECT
        CASE trang_thai
          WHEN 'Chờ duyệt' THEN 'Pending'
          WHEN 'Đợi duyệt' THEN 'Waiting'
          WHEN 'Đã duyệt' THEN 'Approved'
          WHEN 'Không duyệt' THEN 'Rejected'
          ELSE 'Pending'
        END AS status_key,
        count(*)::int AS cnt
      FROM base
      GROUP BY 1
    ) s
  ), '[]'::jsonb),
  'byNoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(k.ten_kho, b.id_noi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = b.id_noi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDuyet', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_duyet::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_duyet
      WHERE b.id_nguoi_duyet IS NOT NULL
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byMonth', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', label, 'value', cnt) ORDER BY ym)
    FROM (
      SELECT to_char(b.ngay::date, 'YYYY-MM') AS ym,
             to_char(b.ngay::date, 'MM') || '/' || to_char(b.ngay::date, 'YYYY') AS label,
             count(*)::int AS cnt
      FROM base b
      WHERE b.ngay IS NOT NULL
      GROUP BY 1, 2
    ) m
  ), '[]'::jsonb),
  'chipByStatusKey', coalesce((SELECT jsonb_object_agg(status_key, cnt) FROM chip_status), '{}'::jsonb),
  'chipByNoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_noi), '{}'::jsonb),
  'chipByNguoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_de_xuat), '{}'::jsonb),
  'chipByNguoiDuyetId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_duyet), '{}'::jsonb)
);
$function$;

CREATE FUNCTION public.rpc_pt_ton_kho_theo_ky(p_tu date, p_den date, p_chi_da_duyet boolean DEFAULT false)
 RETURNS TABLE(id_kho bigint, id_hang_hoa bigint, ton_dau numeric, nhap numeric, xuat numeric, chuyen_den numeric, chuyen_di numeric, ton_cuoi numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    WITH phieu AS (
        SELECT pk.id, pk.ngay, pk.loai, pk.kho_id, pk.kho_den_id,
               (p_tu IS NOT NULL AND pk.ngay < p_tu) AS truoc_ky
        FROM fp_pt_phieu_kho pk
        WHERE pk.trang_thai <> 'Không duyệt'
          AND (NOT p_chi_da_duyet OR pk.trang_thai = 'Đã duyệt')
          AND (p_den IS NULL OR pk.ngay <= p_den)
          AND (pk.loai <> 'chuyển' OR pk.kho_den_id IS NOT NULL)
    ),
    mv AS (
        -- Một dòng biến động / kho: kind = nhap | xuat | chuyen_den | chuyen_di
        SELECT p.kho_id AS id_kho, ct.id_hang_hoa, p.truoc_ky, ct.so_luong AS sl,
               CASE p.loai WHEN 'nhập' THEN 'nhap' WHEN 'xuất' THEN 'xuat' ELSE 'chuyen_di' END AS kind
        FROM phieu p
        JOIN fp_pt_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
        UNION ALL
        SELECT p.kho_den_id, ct.id_hang_hoa, p.truoc_ky, ct.so_luong, 'chuyen_den'
        FROM phieu p
        JOIN fp_pt_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
        WHERE p.loai = 'chuyển'
    ),
    agg AS (
        SELECT mv.id_kho, mv.id_hang_hoa,
               COALESCE(sum(CASE WHEN mv.truoc_ky THEN
                   CASE WHEN mv.kind IN ('nhap', 'chuyen_den') THEN mv.sl ELSE -mv.sl END END), 0) AS ton_dau,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'nhap'), 0)       AS nhap,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'xuat'), 0)       AS xuat,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'chuyen_den'), 0) AS chuyen_den,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'chuyen_di'), 0)  AS chuyen_di
        FROM mv
        GROUP BY mv.id_kho, mv.id_hang_hoa
    )
    SELECT a.id_kho, a.id_hang_hoa,
           a.ton_dau::numeric(18,4), a.nhap::numeric(18,4), a.xuat::numeric(18,4),
           a.chuyen_den::numeric(18,4), a.chuyen_di::numeric(18,4),
           (a.ton_dau + a.nhap - a.xuat + a.chuyen_den - a.chuyen_di)::numeric(18,4)
    FROM agg a
$function$;

-- Hàng hoá Phân thuốc đang được phiếu nào dùng — chặn xoá + báo rõ phiếu (giống migration 026).
-- `loai` mang tiền tố pt_ để app mở đúng trang /phan-thuoc/... (lib/hang-hoa-dang-dung.ts).
CREATE FUNCTION public.rpc_pt_hang_hoa_dang_dung(p_ids bigint[])
 RETURNS TABLE(id_hang_hoa bigint, loai text, id_phieu bigint, so_phieu text, ngay date, trang_thai text, so_dong integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    SELECT ct.id_hang_hoa, 'pt_phieu_kho', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_pt_phieu_kho_chi_tiet ct
    JOIN fp_pt_phieu_kho p ON p.id = ct.id_phieu_kho
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'pt_de_xuat_mua_hang', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_pt_de_xuat_mua_hang_chi_tiet ct
    JOIN fp_pt_de_xuat_mua_hang p ON p.id = ct.id_de_xuat_mua_hang
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'pt_dot_kiem_ke', p.id, p.ma_dot::text, p.ngay_bat_dau::date, p.trang_thai::text, count(*)::integer
    FROM fp_pt_dot_kiem_ke_chi_tiet ct
    JOIN fp_pt_dot_kiem_ke p ON p.id = ct.id_dot_kiem_ke_pt
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
$function$;

-- Quyền gọi hàm: Postgres mặc định cho PUBLIC → thu lại, chỉ cấp authenticated cho RPC.

REVOKE ALL ON FUNCTION public.fp_pt_de_xuat_mua_hang_after_update() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_de_xuat_mua_hang_ct_sync_phieu() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_de_xuat_mua_hang_tg_cap_nhat() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_dot_kiem_ke_tg_cap_nhat() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_phieu_kho_before_delete_clear_kiem_ke() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_phieu_kho_ct_thanh_tien() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_phieu_kho_tg_cap_nhat() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_pt_tien_do_mua_hang_set_timestamps() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_next_ma_dot_pt_kiem_ke() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_next_ma_dot_pt_kiem_ke() TO authenticated;
REVOKE ALL ON FUNCTION public.get_next_so_phieu_pt_de_xuat_mua_hang() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_next_so_phieu_pt_de_xuat_mua_hang() TO authenticated;
REVOKE ALL ON FUNCTION public.get_next_so_phieu_pt_phieu_kho(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_next_so_phieu_pt_phieu_kho(text) TO authenticated;
REVOKE ALL ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_dot(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_dot(bigint, bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.rpc_pt_de_xuat_mua_hang_stats(date, date, text[], bigint[], bigint[], bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_pt_de_xuat_mua_hang_stats(date, date, text[], bigint[], bigint[], bigint[]) TO authenticated;
REVOKE ALL ON FUNCTION public.rpc_pt_ton_kho_theo_ky(date, date, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_pt_ton_kho_theo_ky(date, date, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.rpc_pt_hang_hoa_dang_dung(bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_pt_hang_hoa_dang_dung(bigint[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Trigger: nghiệp vụ, nhật ký thay đổi (016), thông báo (outbox), đồng bộ Google Sheet (012)
-- ---------------------------------------------------------------------------

CREATE TRIGGER tr_fp_pt_de_xuat_mua_hang_after_update AFTER UPDATE ON public.fp_pt_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_pt_de_xuat_mua_hang_after_update();

CREATE TRIGGER tr_fp_pt_de_xuat_mua_hang_ct_sync_phieu BEFORE INSERT OR UPDATE OF id_de_xuat_mua_hang ON public.fp_pt_de_xuat_mua_hang_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_pt_de_xuat_mua_hang_ct_sync_phieu();

CREATE TRIGGER tr_fp_pt_de_xuat_mua_hang_tg_cap_nhat BEFORE UPDATE ON public.fp_pt_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_pt_de_xuat_mua_hang_tg_cap_nhat();

CREATE TRIGGER tr_fp_pt_dot_kk_ct_tg_cap_nhat BEFORE UPDATE ON public.fp_pt_dot_kiem_ke_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_pt_dot_kiem_ke_tg_cap_nhat();

CREATE TRIGGER tr_fp_pt_dot_kk_tg_cap_nhat BEFORE UPDATE ON public.fp_pt_dot_kiem_ke FOR EACH ROW EXECUTE FUNCTION public.fp_pt_dot_kiem_ke_tg_cap_nhat();

CREATE TRIGGER tr_fp_pt_phieu_kho_before_delete_clear_kiem_ke BEFORE DELETE ON public.fp_pt_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fp_pt_phieu_kho_before_delete_clear_kiem_ke();

CREATE TRIGGER tr_fp_pt_phieu_kho_ct_thanh_tien BEFORE INSERT OR UPDATE ON public.fp_pt_phieu_kho_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_pt_phieu_kho_ct_thanh_tien();

CREATE TRIGGER tr_fp_pt_phieu_kho_tg_cap_nhat BEFORE UPDATE ON public.fp_pt_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fp_pt_phieu_kho_tg_cap_nhat();

CREATE TRIGGER tr_fp_pt_tien_do_mua_hang_timestamps BEFORE INSERT OR UPDATE ON public.fp_pt_tien_do_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_pt_tien_do_mua_hang_set_timestamps();

CREATE TRIGGER tr_thong_bao_fp_pt_de_xuat_mua_hang AFTER INSERT OR UPDATE ON public.fp_pt_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('phan-thuoc/de-xuat-mua-hang', 'trang_thai');

CREATE TRIGGER tr_thong_bao_fp_pt_phieu_kho AFTER INSERT OR UPDATE ON public.fp_pt_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('phan-thuoc/phieu-kho-phan-thuoc', 'trang_thai');

CREATE TRIGGER trg_dong_bo_sheet_danh_dau AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_phieu_kho FOR EACH STATEMENT EXECUTE FUNCTION public.fn_dong_bo_sheet_danh_dau();

CREATE TRIGGER trg_dong_bo_sheet_danh_dau AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_phieu_kho_chi_tiet FOR EACH STATEMENT EXECUTE FUNCTION public.fn_dong_bo_sheet_danh_dau();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_danh_muc_hang_hoa FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_danh_sach_hang_hoa FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_de_xuat_mua_hang_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_dot_kiem_ke FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_dot_kiem_ke_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_dot_kiem_ke_kho FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_phieu_kho_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR DELETE OR UPDATE ON public.fp_pt_tien_do_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

-- ---------------------------------------------------------------------------
-- 6. RLS + quyền bảng (giống bảng Sơ chế; không cấp gì cho anon)
-- ---------------------------------------------------------------------------

ALTER TABLE public.fp_pt_danh_muc_hang_hoa ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_danh_sach_hang_hoa ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_de_xuat_mua_hang ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_de_xuat_mua_hang_chi_tiet ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_dot_kiem_ke ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_dot_kiem_ke_chi_tiet ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_dot_kiem_ke_kho ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_phieu_kho ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_phieu_kho_chi_tiet ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fp_pt_tien_do_mua_hang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow delete tien_do_mua_hang_pt" ON public.fp_pt_tien_do_mua_hang FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow insert tien_do_mua_hang_pt" ON public.fp_pt_tien_do_mua_hang FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow select tien_do_mua_hang_pt" ON public.fp_pt_tien_do_mua_hang FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow update tien_do_mua_hang_pt" ON public.fp_pt_tien_do_mua_hang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_danh_muc_hang_hoa_delete ON public.fp_pt_danh_muc_hang_hoa FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_danh_muc_hang_hoa_insert ON public.fp_pt_danh_muc_hang_hoa FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_danh_muc_hang_hoa_select ON public.fp_pt_danh_muc_hang_hoa FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_danh_muc_hang_hoa_update ON public.fp_pt_danh_muc_hang_hoa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_danh_sach_hang_hoa_delete ON public.fp_pt_danh_sach_hang_hoa FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_danh_sach_hang_hoa_insert ON public.fp_pt_danh_sach_hang_hoa FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_danh_sach_hang_hoa_select ON public.fp_pt_danh_sach_hang_hoa FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_danh_sach_hang_hoa_update ON public.fp_pt_danh_sach_hang_hoa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_ct_delete ON public.fp_pt_de_xuat_mua_hang_chi_tiet FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_ct_insert ON public.fp_pt_de_xuat_mua_hang_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_ct_select ON public.fp_pt_de_xuat_mua_hang_chi_tiet FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_ct_update ON public.fp_pt_de_xuat_mua_hang_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_delete ON public.fp_pt_de_xuat_mua_hang FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_insert ON public.fp_pt_de_xuat_mua_hang FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_select ON public.fp_pt_de_xuat_mua_hang FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_de_xuat_mua_hang_update ON public.fp_pt_de_xuat_mua_hang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_dot_kiem_ke_chi_tiet_delete ON public.fp_pt_dot_kiem_ke_chi_tiet FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_dot_kiem_ke_chi_tiet_insert ON public.fp_pt_dot_kiem_ke_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_dot_kiem_ke_chi_tiet_select ON public.fp_pt_dot_kiem_ke_chi_tiet FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_dot_kiem_ke_chi_tiet_update ON public.fp_pt_dot_kiem_ke_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_dot_kiem_ke_delete ON public.fp_pt_dot_kiem_ke FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_dot_kiem_ke_insert ON public.fp_pt_dot_kiem_ke FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_dot_kiem_ke_kho_delete ON public.fp_pt_dot_kiem_ke_kho FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_dot_kiem_ke_kho_insert ON public.fp_pt_dot_kiem_ke_kho FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_dot_kiem_ke_kho_select ON public.fp_pt_dot_kiem_ke_kho FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_dot_kiem_ke_kho_update ON public.fp_pt_dot_kiem_ke_kho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_dot_kiem_ke_select ON public.fp_pt_dot_kiem_ke FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_dot_kiem_ke_update ON public.fp_pt_dot_kiem_ke FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_phieu_kho_ct_delete ON public.fp_pt_phieu_kho_chi_tiet FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_phieu_kho_ct_insert ON public.fp_pt_phieu_kho_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_phieu_kho_ct_select ON public.fp_pt_phieu_kho_chi_tiet FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_phieu_kho_ct_update ON public.fp_pt_phieu_kho_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY fp_pt_phieu_kho_delete ON public.fp_pt_phieu_kho FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_pt_phieu_kho_insert ON public.fp_pt_phieu_kho FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY fp_pt_phieu_kho_select ON public.fp_pt_phieu_kho FOR SELECT TO authenticated USING (true);

CREATE POLICY fp_pt_phieu_kho_update ON public.fp_pt_phieu_kho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.fp_pt_danh_muc_hang_hoa TO authenticated;

GRANT ALL ON SEQUENCE public.fp_pt_danh_muc_hang_hoa_id_seq TO authenticated;

GRANT ALL ON TABLE public.fp_pt_danh_sach_hang_hoa TO authenticated;

GRANT ALL ON SEQUENCE public.fp_pt_danh_sach_hang_hoa_id_seq TO authenticated;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_pt_de_xuat_mua_hang TO authenticated;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_pt_de_xuat_mua_hang_chi_tiet TO authenticated;

GRANT SELECT,USAGE ON SEQUENCE public.fp_pt_de_xuat_mua_hang_chi_tiet_id_seq TO authenticated;

GRANT SELECT,USAGE ON SEQUENCE public.fp_pt_de_xuat_mua_hang_id_seq TO authenticated;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_pt_dot_kiem_ke TO authenticated;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_pt_dot_kiem_ke_chi_tiet TO authenticated;

GRANT SELECT,USAGE ON SEQUENCE public.fp_pt_dot_kiem_ke_chi_tiet_id_seq TO authenticated;

GRANT SELECT,USAGE ON SEQUENCE public.fp_pt_dot_kiem_ke_id_seq TO authenticated;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_pt_dot_kiem_ke_kho TO authenticated;

GRANT ALL ON TABLE public.fp_pt_phieu_kho TO authenticated;

GRANT ALL ON TABLE public.fp_pt_phieu_kho_chi_tiet TO authenticated;

GRANT ALL ON SEQUENCE public.fp_pt_phieu_kho_chi_tiet_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.fp_pt_phieu_kho_id_seq TO authenticated;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_pt_tien_do_mua_hang TO authenticated;

GRANT SELECT,USAGE ON SEQUENCE public.fp_pt_tien_do_mua_hang_id_seq TO authenticated;

GRANT SELECT ON TABLE public.v_pt_de_xuat_mua_hang_chi_tiet_flat TO authenticated;

GRANT SELECT ON TABLE public.v_pt_de_xuat_mua_hang_summary TO authenticated;

GRANT SELECT ON TABLE public.v_pt_phieu_kho_chi_tiet_flat TO authenticated;

GRANT ALL ON TABLE public.v_pt_phieu_kho_summary TO authenticated;

GRANT ALL ON TABLE public.v_pt_ton_kho TO authenticated;

GRANT SELECT ON TABLE public.v_xuat_pt_phieu_kho TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Thông báo: chi nhánh của phiếu Phân thuốc (lọc người nhận theo chi nhánh)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_tb_chi_nhanh_phieu(p_bang text, p_ban_ghi_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_chi_nhanh bigint;
BEGIN
  CASE p_bang
    WHEN 'fp_mh_phieu_kho' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_phieu_kho p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_farm_phieu_kho_phan_thuoc' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_farm_phieu_kho_phan_thuoc p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_pt_phieu_kho' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_pt_phieu_kho p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_mh_phieu_de_xuat_vat_tu' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_phieu_de_xuat_vat_tu p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_farm_de_xuat_mua_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_farm_de_xuat_mua_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_pt_de_xuat_mua_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_pt_de_xuat_mua_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_mh_don_dat_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_don_dat_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_kho_nhan
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_tc_quy_thu_chi' THEN
      -- Quỹ tiền mặt gắn thẳng vào chi nhánh (không qua kho).
      SELECT p.id_chi_nhanh::bigint INTO v_chi_nhanh
        FROM public.fp_tc_quy_thu_chi p
       WHERE p.id = p_ban_ghi_id;

    ELSE
      -- fp_hc_cong_viec, fp_hr_phieu_hanh_chinh: không gắn với kho nào.
      v_chi_nhanh := NULL;
  END CASE;

  RETURN v_chi_nhanh;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 8. Thu chi quỹ: phiếu quỹ gắn được với đề xuất mua hàng Phân thuốc
-- ---------------------------------------------------------------------------
ALTER TABLE public.fp_tc_quy_thu_chi DROP CONSTRAINT fp_tc_qtc_loai_chung_tu_check;
ALTER TABLE public.fp_tc_quy_thu_chi ADD CONSTRAINT fp_tc_qtc_loai_chung_tu_check CHECK (
  loai_chung_tu IS NULL
  OR loai_chung_tu = ANY (ARRAY[
    'don_dat_hang'::text, 'phieu_de_xuat_vat_tu'::text, 'de_xuat_mua_hang'::text,
    'chi_phi_tai_san'::text, 'pt_de_xuat_mua_hang'::text
  ])
);

-- ---------------------------------------------------------------------------
-- 9. Phân quyền: chức vụ đang có quyền nhóm Kho của Sơ chế thì có quyền tương ứng ở Phân thuốc
--    (chỉnh lại ở màn Phân quyền nếu cần tách người).
-- ---------------------------------------------------------------------------
INSERT INTO public.fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT pq.chuc_vu_id, replace(pq.module_id, 'quan-ly-nha-so-che/', 'phan-thuoc/'), pq.actions
  FROM public.fp_var_phan_quyen pq
 WHERE pq.module_id IN (
   'quan-ly-nha-so-che/de-xuat-mua-hang',
   'quan-ly-nha-so-che/phieu-kho-phan-thuoc',
   'quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc',
   'quan-ly-nha-so-che/ton-kho-phan-thuoc',
   'quan-ly-nha-so-che/hang-hoa-phan-thuoc',
   'quan-ly-nha-so-che/thiet-lap-de-xuat-mua-hang'
 )
ON CONFLICT (chuc_vu_id, module_id) DO NOTHING;

COMMIT;

-- PostgREST nạp lại schema để thấy bảng / view / RPC mới.
NOTIFY pgrst, 'reload schema';
