import { AnomalyService } from './anomaly.service';

jest.mock('sharp', () => {
  return jest.fn().mockImplementation((input: any) => {
    let exif: Buffer | undefined;
    let iptc: Buffer | undefined = Buffer.from('some-iptc');
    if (input === 'exif-old') {
      exif = Buffer.from('2020:01:01 12:00:00', 'binary');
    } else if (input === 'exif-software') {
      exif = Buffer.from('Adobe Photoshop 2024', 'utf-8');
    } else if (input === 'exif-none') {
      exif = undefined;
      iptc = undefined;
    }
    return {
      metadata: jest.fn().mockResolvedValue({
        exif,
        iptc,
        xmp: undefined,
      }),
    };
  });
});

describe('AnomalyService', () => {
  let service: AnomalyService;

  beforeEach(() => {
    service = new AnomalyService();
  });

  describe('analyze', () => {
    it('should flag old EXIF timestamps', async () => {
      const result = await service.analyze('exif-old' as any, 'user-1', 'uri-1');
      expect(result.flags).toContain('EXIF_TIMESTAMP_DISCREPANCY');
    });

    it('should flag software manipulation', async () => {
      const result = await service.analyze('exif-software' as any, 'user-1', 'uri-1');
      expect(result.flags).toContain('SOFTWARE_MANIPULATION_DETECTED');
    });

    it('should flag stripped metadata', async () => {
      const result = await service.analyze('exif-none' as any, 'user-1', 'uri-1');
      expect(result.flags).toContain('STRIPPED_METADATA');
    });

    it('should pass for clean media (no flags)', async () => {
      const recentDate = new Date().toISOString().replace(/-/g, ':').replace('T', ' ').split('.')[0];
      const sharp = require('sharp');
      sharp.mockImplementationOnce(() => ({
        metadata: jest.fn().mockResolvedValue({
          exif: Buffer.from(recentDate, 'binary'),
          iptc: Buffer.from('some-iptc'),
        })
      }));

      const result = await service.analyze(Buffer.from('fake-media'), 'user-1', 'uri-1');
      expect(result.flags).toHaveLength(0);
    });
  });
});
