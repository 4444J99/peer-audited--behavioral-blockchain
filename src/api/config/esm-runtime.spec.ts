import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { OnModuleInit } from '@nestjs/common';

interface ContractProvider { getValue(): string; }
const CONTRACT_PROVIDER = Symbol('contract-provider');

@Injectable()
class Consumer implements OnModuleInit {
  initialized = false;
  constructor(@Inject(CONTRACT_PROVIDER) private readonly provider: ContractProvider) {}
  onModuleInit() { this.initialized = true; }
  read() { return this.provider.getValue(); }
}

describe('Nest 12 runtime and decorator metadata', () => {
  it('loads the real ESM exception class through the CommonJS test graph', () => {
    const error = new BadRequestException('invalid');
    expect(error.getStatus()).toBe(400);
    expect(error.message).toBe('invalid');
  });

  it('injects an explicitly token-bound interface without runtime type imports', async () => {
    const module = await Test.createTestingModule({
      providers: [Consumer, { provide: CONTRACT_PROVIDER, useValue: { getValue: () => 'verified' } }],
    }).compile();
    try {
      await module.init();
      expect(module.get(Consumer).initialized).toBe(true);
      expect(module.get(Consumer).read()).toBe('verified');
    } finally {
      await module.close();
    }
  });
});
