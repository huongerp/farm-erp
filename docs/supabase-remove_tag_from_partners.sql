-- =============================================================================
-- RPC: remove_tag_from_partners / remove_tags_from_partners
-- Thay cho vòng lặp update từng dòng trong app (doi-tac-service deleteTag).
-- Giả định: fp_mh_danh_sach_doi_tac.tag_ids là integer[] (PostgreSQL array).
-- Nếu DB dùng jsonb, cần đổi hàm cho phù hợp.
-- =============================================================================

CREATE OR REPLACE FUNCTION remove_tag_from_partners(p_tag_id int)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE fp_mh_danh_sach_doi_tac
  SET tag_ids = array_remove(tag_ids, p_tag_id)
  WHERE tag_ids IS NOT NULL AND p_tag_id = ANY(tag_ids);
$$;

CREATE OR REPLACE FUNCTION remove_tags_from_partners(p_tag_ids int[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, tag_ids
    FROM fp_mh_danh_sach_doi_tac
    WHERE tag_ids IS NOT NULL AND tag_ids && p_tag_ids
  LOOP
    UPDATE fp_mh_danh_sach_doi_tac
    SET tag_ids = COALESCE(
      ARRAY(
        SELECT x
        FROM unnest(r.tag_ids) AS x
        WHERE NOT (x = ANY(p_tag_ids))
      ),
      ARRAY[]::int[]
    )
    WHERE id = r.id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_tag_from_partners(int) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_tags_from_partners(int[]) TO authenticated;
