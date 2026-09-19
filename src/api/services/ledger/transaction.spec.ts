import { Pool } from 'pg';
import { inTransaction } from './transaction';
describe('inTransaction',()=>{
 it('commits and releases the same client once',async()=>{
  const client={query:jest.fn().mockResolvedValue({}),release:jest.fn()};const pool={connect:jest.fn().mockResolvedValue(client)};
  expect(await inTransaction(pool as unknown as Pool,async c=>{expect(c).toBe(client);return 42;})).toBe(42);
  expect(client.query.mock.calls).toEqual([['BEGIN'],['COMMIT']]);expect(client.release).toHaveBeenCalledTimes(1);
 });
 it('preserves the primary failure and evicts a rollback-failed client',async()=>{
  const primary=new Error('ledger failed');const rollback=new Error('connection lost');
  const client={query:jest.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(rollback),release:jest.fn()};const pool={connect:jest.fn().mockResolvedValue(client)};
  await expect(inTransaction(pool as unknown as Pool,async()=>{throw primary;})).rejects.toBe(primary);
  expect(client.release).toHaveBeenCalledWith(rollback);
 });
});
