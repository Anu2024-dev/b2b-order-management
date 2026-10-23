import { testConnection, query } from './src/config/db.js';

try {
  console.log('Connection:', await testConnection());

  const result = await query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      to_regclass('public.categories') AS categories,
      to_regclass('public.products') AS products
  `);

  console.log('Tables:', result.rows);
} catch (error) {
  console.error('Database error:', error.message);
} finally {
  process.exit();
}