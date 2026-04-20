import { join } from 'path';
import { config } from 'dotenv';
import runner from 'node-pg-migrate';
import { logger } from '../src/utils/logger';

// Load environment variables
config();

const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');

    // Build database URL from environment variables
    const databaseUrl =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'risk_analyzer'}`;

    logger.info('Database URL configured', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'risk_analyzer',
    });

    // Run migrations
    await runner({
      databaseUrl,
      dir: join(__dirname, '../migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      count: Infinity,
      verbose: true,
      checkOrder: true,
      decamelize: true,
    });

    logger.info('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
};

runMigrations();
