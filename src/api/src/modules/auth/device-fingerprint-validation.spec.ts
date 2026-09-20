import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DeviceFingerprintDto } from './dto';
describe('DeviceFingerprintDto exactly-one validation', () => {
 it.each([{hash:null},{rawVendorId:null},{},{hash:'a'.repeat(64),rawVendorId:'b'.repeat(16)},{hash:'a'.repeat(64),rawVendorId:null},{hash:''}])('rejects invalid identifiers %j',async payload=>{
   const errors=await validate(plainToInstance(DeviceFingerprintDto,{platform:'web',...payload}));
   expect(errors.length).toBeGreaterThan(0);
 });
 it.each([{hash:'a'.repeat(64)},{rawVendorId:'b'.repeat(16)}])('accepts one valid identifier %j',async payload=>{
   expect(await validate(plainToInstance(DeviceFingerprintDto,{platform:'android',...payload}))).toHaveLength(0);
 });
});
