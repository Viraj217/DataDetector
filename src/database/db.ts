import { open } from '@op-engineering/op-sqlite';
import { SCHEMA_STATEMENTS } from './schema';

export const db = open({
  name: 'datadetector.sqlite',
});

export const initDatabase = (): void => {
  try {
    console.log('[Database] Initializing database schema...');
    for (const statement of SCHEMA_STATEMENTS) {
      db.executeSync(statement);
    }
    
    // Clean up temporary system.uid_* records to force a clean re-sync with resolved package names
    db.executeSync("DELETE FROM apps WHERE package_name LIKE 'system.uid_%'");
    
    console.log('[Database] Database schema initialized and cleaned successfully.');
  } catch (error) {
    console.error('[Database] Failed to initialize database schema:', error);
    throw error;
  }
};
