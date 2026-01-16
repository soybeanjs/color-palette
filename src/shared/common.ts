export function keysOf<TRecord extends Record<string, unknown>>(record: TRecord) {
  return Object.keys(record) as (keyof TRecord)[];
}
