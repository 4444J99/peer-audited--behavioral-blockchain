import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

const DATABASE_POOL = 'DATABASE_POOL';

const poolProvider = {
  provide: DATABASE_POOL,
  useFactory: () => {
    return new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/styx',
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
