// Shared Snowflake connection + exec helpers for scripts/snowflake-*.ts.
// Auth is key-pair only (SNOWFLAKE_JWT): the private key is read from
// SNOWFLAKE_PRIVATE_KEY_PATH by the driver itself and never printed.
// Portability rule: every account coordinate comes from .env — repointing the
// pipe at a different account is a .env change plus re-running
// snowflake-setup.sql there, zero code changes.
// env.template is loaded as a fallback (.env wins): the SNOWFLAKE_* block holds
// no secrets, so it may live in the template alone.
import dotenv from 'dotenv';
import snowflake from 'snowflake-sdk';

dotenv.config();
dotenv.config({ path: 'env.template' });

export interface SnowflakeEnv {
  account: string;
  username: string;
  privateKeyPath: string;
  role: string;
  warehouse: string;
  database: string;
  schema: string;
}

const ENV_VARS = {
  account: 'SNOWFLAKE_ACCOUNT',
  username: 'SNOWFLAKE_USER',
  privateKeyPath: 'SNOWFLAKE_PRIVATE_KEY_PATH',
  role: 'SNOWFLAKE_ROLE',
  warehouse: 'SNOWFLAKE_WAREHOUSE',
  database: 'SNOWFLAKE_DATABASE',
  schema: 'SNOWFLAKE_SCHEMA',
} as const;

export function readSnowflakeEnv(): SnowflakeEnv {
  const env = Object.fromEntries(
    Object.entries(ENV_VARS).map(([k, v]) => [k, process.env[v] ?? '']),
  ) as Record<keyof typeof ENV_VARS, string>;
  const missing = (Object.keys(ENV_VARS) as Array<keyof typeof ENV_VARS>)
    .filter((k) => !env[k] || env[k] === 'REPLACE_ME')
    .map((k) => ENV_VARS[k]);
  if (missing.length) {
    throw new Error(`missing in .env: ${missing.join(', ')}`);
  }
  return env;
}

export type SfConnection = snowflake.Connection;

export async function connect(env: SnowflakeEnv): Promise<SfConnection> {
  snowflake.configure({ logLevel: 'ERROR' });
  const conn = snowflake.createConnection({
    account: env.account,
    username: env.username,
    authenticator: 'SNOWFLAKE_JWT',
    privateKeyPath: env.privateKeyPath,
    role: env.role,
    warehouse: env.warehouse,
    database: env.database,
    schema: env.schema,
  });
  await new Promise<void>((resolve, reject) => {
    conn.connect((err) => (err ? reject(err) : resolve()));
  });
  return conn;
}

// Rows come back as objects keyed by UPPERCASE column/alias names.
// binds: flat array for scalar binds, or array-of-arrays for bulk inserts.
export function exec(
  conn: SfConnection,
  sqlText: string,
  binds?: unknown[] | unknown[][],
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds: binds as never,
      complete: (err, _stmt, rows) => (err ? reject(err) : resolve(rows ?? [])),
    });
  });
}

export function destroy(conn: SfConnection): Promise<void> {
  return new Promise((resolve) => {
    conn.destroy(() => resolve());
  });
}
