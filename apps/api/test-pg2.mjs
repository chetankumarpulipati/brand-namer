import pg from 'pg';
const client = new pg.Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'brandnamer',
});
try {
  await client.connect();
  console.log('Connected via pg!');
  const res = await client.query('SELECT current_user, version()');
  console.log(res.rows[0]);
  await client.end();
} catch (e) {
  console.error('Error:', e.message);
}
