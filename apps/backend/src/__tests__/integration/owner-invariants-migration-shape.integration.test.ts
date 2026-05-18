import {readFileSync} from 'node:fs';
import path from 'node:path';

const OWNER_MIGRATION_FILE = path.join(
  process.cwd(),
  'src',
  'db',
  'migrations',
  '1779048806025_add_polymorphic_owner_columns_for_producers.ts',
);

const OWNER_MIGRATION_SOURCE = readFileSync(OWNER_MIGRATION_FILE, 'utf8');

describe('Owner invariant migration shape integration', () => {
  it('keeps exactly-one-owner constraints declared in migration SQL', () => {
    expect(OWNER_MIGRATION_SOURCE).toContain('listings_exactly_one_owner_chk');
    expect(OWNER_MIGRATION_SOURCE).toContain(
      'seller_earnings_exactly_one_owner_chk',
    );
    expect(OWNER_MIGRATION_SOURCE).toContain('payouts_exactly_one_owner_chk');
    expect(OWNER_MIGRATION_SOURCE).toContain(
      'CHECK ((publisher_user_id IS NOT NULL) <> (publisher_event_producer_id IS NOT NULL))',
    );
    expect(OWNER_MIGRATION_SOURCE).toContain(
      'CHECK ((seller_user_id IS NOT NULL) <> (seller_event_producer_id IS NOT NULL))',
    );
  });
});
