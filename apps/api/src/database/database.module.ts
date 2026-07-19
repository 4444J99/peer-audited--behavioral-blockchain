import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { resolveDatabaseUrl } from '../config/runtime';

const DATABASE_POOL = 'DATABASE_POOL';

const poolProvider = {
  provide: DATABASE_POOL,
  useFactory: () => {
    return new Pool({
      connectionString: resolveDatabaseUrl(),
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
