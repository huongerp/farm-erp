/** Chuỗi ổn định cho queryKey React Query (object tham chiếu không ổn định). */
export function stableListQueryKeyPart(value: unknown): string {
  return JSON.stringify(value);
}
