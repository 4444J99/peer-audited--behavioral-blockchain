import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

const DATABASE_POOL = 'DATABASE_POOL';

function buildConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgres'; // allow-secret
  const db = process.env.POSTGRES_DB || 'styx';

  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
}

const poolProvider = {
  provide: DATABASE_POOL,
  useFactory: () => {
    return new Pool({
      connectionString: buildConnectionString(),
      max: 20,
    });
  },
};

@Global()
@Module({
  providers: [
    poolProvider,
    {
      provide: Pool,
      useExisting: DATABASE_POOL,
    },
  ],
  exports: [Pool, DATABASE_POOL],
})
export class DatabaseModule {}
