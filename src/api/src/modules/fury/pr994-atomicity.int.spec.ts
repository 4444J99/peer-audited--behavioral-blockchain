import { Pool } from 'pg';
import { EnforcementService } from './enforcement.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { QuarantineService } from '../ledger/quarantine.service';
import { captureFinancialAlert } from '../../common/monitoring/sentry';
jest.mock('../../common/monitoring/sentry', () => ({ captureFinancialAlert: jest.fn() }));

/** Real PostgreSQL transactions; an isolated schema, never the application database. */
describe('PR994 real-database failure boundaries and concurrency', () => {
  let admin: Pool;
  let pool: Pool;
  let enforcement: EnforcementService;
  let quarantine: QuarantineService;
  const schema = `pr994_${process.pid}_${Date.now()}`;
  beforeAll(async () => {
    const connectionString = process.env.PR994_TEST_DATABASE_URL;
    if (!connectionString) throw new Error('PR994_TEST_DATABASE_URL is required; integration verification cannot silently skip');
    const url = new URL(connectionString);
    if (!['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Integration fixtures require a disposable local PostgreSQL service');
    admin = new Pool({connectionString});
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new Pool({connectionString, options:`-c search_path=${schema}`, max:10});
    await pool.query(`
      CREATE TABLE accounts(id text PRIMARY KEY, name text, status text DEFAULT 'ACTIVE');
      CREATE TABLE users(id text PRIMARY KEY, account_id text, status text DEFAULT 'ACTIVE');
      CREATE TABLE fury_enforcement_cases(id text PRIMARY KEY, reviewer_id text, status text, evidence_json jsonb DEFAULT '{}');
      CREATE TABLE entries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), debit_account_id text REFERENCES accounts(id), credit_account_id text REFERENCES accounts(id), amount bigint CHECK(amount>0), contract_id text, metadata jsonb, idempotency_key text);
      CREATE UNIQUE INDEX entry_key ON entries(idempotency_key) WHERE idempotency_key IS NOT NULL;
      CREATE TABLE fury_penalties(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id text, penalty_type text, amount_cents bigint, ledger_transaction_id uuid REFERENCES entries(id), ledger_debit_account_id text, reversal_transaction_id uuid REFERENCES entries(id), reversed_at timestamptz);
      CREATE TABLE event_log(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sequence_index bigserial UNIQUE, event_type text, payload json, previous_hash text, current_hash text, created_at timestamptz);
      CREATE FUNCTION fail_injected_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected database failure'; END $$;
    `);
    const truth = new TruthLogService(pool);
    enforcement = new EnforcementService(pool, truth, new LedgerService(pool));
    quarantine = new QuarantineService(pool, truth);
  },30000);
  beforeEach(async () => {
    jest.clearAllMocks();
    await pool.query(`TRUNCATE event_log,fury_penalties,entries,users,fury_enforcement_cases,accounts RESTART IDENTITY CASCADE;
      INSERT INTO accounts(id,name) VALUES ('reviewer-account','REVIEWER'),('revenue-account','SYSTEM_REVENUE');
      INSERT INTO users(id,account_id) VALUES ('reviewer','reviewer-account');
      INSERT INTO fury_enforcement_cases(id,reviewer_id,status) VALUES ('case','reviewer','PENDING_REVIEW');`);
  });
  afterAll(async () => {
    if(pool) await pool.end();
    if(admin) {await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await admin.end();}
  });
  async function snapshot() {
    const {rows:[row]}=await pool.query(`SELECT
      (SELECT count(*)::int FROM fury_penalties) AS penalties,
      (SELECT count(*)::int FROM entries) AS entries,
      (SELECT count(*)::int FROM event_log) AS events,
      (SELECT status FROM fury_enforcement_cases WHERE id='case') AS status`);
    return row;
  }
  it.each([['entries','INSERT'],['fury_penalties','UPDATE'],['event_log','INSERT']])('rolls back %s %s failure, then retries cleanly',async(table,operation)=>{
    await pool.query(`CREATE TRIGGER injected_failure BEFORE ${operation} ON ${table} FOR EACH ROW EXECUTE FUNCTION fail_injected_write()`);
    try {
      await expect(enforcement.confirmCase('case','STAKE_SLASH',500)).rejects.toThrow('injected database failure');
      expect(await snapshot()).toEqual({penalties:0,entries:0,events:0,status:'PENDING_REVIEW'});
    } finally { await pool.query(`DROP TRIGGER injected_failure ON ${table}`); }
    await enforcement.confirmCase('case','STAKE_SLASH',500);
    expect(await snapshot()).toEqual({penalties:1,entries:1,events:1,status:'PENALTY_APPLIED'});
    const {rows:[row]} = await pool.query('SELECT p.ledger_transaction_id, e.id, e.amount FROM fury_penalties p JOIN entries e ON e.id=p.ledger_transaction_id');
    expect(row.ledger_transaction_id).toBe(row.id);expect(Number(row.amount)).toBe(500);
  });
  it('serializes concurrent direct penalty calls and posts exactly once',async()=>{
    await Promise.all(Array.from({length:5},()=>enforcement.applyPenalty('case','STAKE_SLASH',500)));
    expect(await snapshot()).toEqual({penalties:1,entries:1,events:1,status:'PENALTY_APPLIED'});
  });
  it('only one concurrent confirmation can claim the pending case',async()=>{
    const results=await Promise.allSettled([enforcement.confirmCase('case','STAKE_SLASH',500),enforcement.confirmCase('case','STAKE_SLASH',500)]);
    expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
    expect(await snapshot()).toEqual({penalties:1,entries:1,events:1,status:'PENALTY_APPLIED'});
  });
  it('missing revenue account cannot record a financial punishment',async()=>{
    await pool.query("DELETE FROM accounts WHERE name='SYSTEM_REVENUE'");
    await expect(enforcement.confirmCase('case','STAKE_SLASH',500)).rejects.toThrow(/accounts are missing/);
    expect(await snapshot()).toEqual({penalties:0,entries:0,events:0,status:'PENDING_REVIEW'});
  });
  it('an appeal audit failure rolls back the refund, link, and resolution status',async()=>{
    await enforcement.confirmCase('case','STAKE_SLASH',500);
    await pool.query("UPDATE fury_enforcement_cases SET status='APPEALED' WHERE id='case'");
    await pool.query('CREATE TRIGGER injected_failure BEFORE INSERT ON event_log FOR EACH ROW EXECUTE FUNCTION fail_injected_write()');
    try {
      await expect(enforcement.resolveAppeal('case','REVERSED')).rejects.toThrow('injected database failure');
      expect(await snapshot()).toEqual({penalties:1,entries:1,events:1,status:'APPEALED'});
      expect((await pool.query('SELECT reversal_transaction_id FROM fury_penalties')).rows[0].reversal_transaction_id).toBeNull();
    } finally {await pool.query('DROP TRIGGER injected_failure ON event_log');}
    expect((await enforcement.resolveAppeal('case','REVERSED')).refundedCents).toBe(500);
    expect(await snapshot()).toEqual({penalties:1,entries:2,events:3,status:'REVERSED'});
  });
  it.each([['users','UPDATE'],['accounts','UPDATE'],['event_log','INSERT']])('does not emit activation or persist partial quarantine when %s fails',async(table,operation)=>{
    await pool.query(`CREATE TRIGGER injected_failure BEFORE ${operation} ON ${table} FOR EACH ROW EXECUTE FUNCTION fail_injected_write()`);
    try {
      await expect(quarantine.activateQuarantine('reviewer-account','test incident')).rejects.toThrow('injected database failure');
      expect(captureFinancialAlert).not.toHaveBeenCalled();
      expect((await pool.query("SELECT status FROM users WHERE id='reviewer'")).rows[0].status).toBe('ACTIVE');
      expect((await pool.query("SELECT status FROM accounts WHERE id='reviewer-account'")).rows[0].status).toBe('ACTIVE');
      expect((await snapshot()).events).toBe(0);
    } finally {await pool.query(`DROP TRIGGER injected_failure ON ${table}`);}
  });
  it('emits the activation event only after quarantine is externally visible',async()=>{
    let observation:Promise<unknown> | undefined;
    (captureFinancialAlert as jest.Mock).mockImplementationOnce(()=>{
      observation=pool.query("SELECT status FROM accounts WHERE id='reviewer-account'").then(result=>result.rows[0].status);
    });
    await quarantine.activateQuarantine('reviewer-account','test incident');
    expect(captureFinancialAlert).toHaveBeenCalledTimes(1);expect(await observation).toBe('QUARANTINED');
    expect((await snapshot()).events).toBe(1);
  });
});
