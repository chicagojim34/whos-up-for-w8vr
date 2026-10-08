// Wrangler bundles .sql files as text (its default module rules).
declare module '*.sql' {
  const sql: string;
  export default sql;
}
