import { getDataSource } from '@/lib/config/database';
import { History } from '@/lib/entities/History';
import { uploadToR2, generateR2Key } from '@/lib/services/r2.service';

async function migrateHistoryToR2() {
  console.log('=== Starting migration to Cloudflare R2 ===');

  const dataSource = await getDataSource();
  const historyRepository = dataSource.getRepository(History);

  const allHistory = await historyRepository.find();
  console.log(`Found ${allHistory.length} history records`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const history of allHistory) {
    if (history.resultImagePath?.includes('.r2.dev')) {
      console.log(`Skipping ${history.id}: already migrated`);
      skipped++;
      continue;
    }

    try {
      console.log(`Migrating ${history.id}...`);
      
      const response = await fetch(history.resultImagePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      const r2Key = generateR2Key(history.userId);
      const r2Url = await uploadToR2(imageBuffer, r2Key);
      
      history.resultImagePath = r2Url;
      await historyRepository.save(history);
      
      migrated++;
      console.log(`Migrated ${history.id}: ${r2Url}`);
    } catch (error) {
      failed++;
      console.error(`Failed to migrate ${history.id}:`, error);
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total: ${allHistory.length}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  await dataSource.destroy();
  console.log('\nMigration complete!');
}

migrateHistoryToR2().catch(console.error);
