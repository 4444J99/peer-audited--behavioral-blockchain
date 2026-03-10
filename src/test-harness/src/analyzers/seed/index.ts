import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { SeedSchema, SuiteResult, AnalyzerResult } from '../../types/index';

export class SeedAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  public analyze(): SuiteResult {
    const results: AnalyzerResult[] = [];
    const seedPath = path.join(this.repoPath, 'seed.yaml');

    // Check 1: Existence
    if (!fs.existsSync(seedPath)) {
      results.push({
        check: 'seed-exists',
        status: 'FAIL',
        message: `seed.yaml not found at ${seedPath}`,
      });
      return { analyzer: 'seed', results };
    }

    results.push({ check: 'seed-exists', status: 'PASS' });

    try {
      const fileContents = fs.readFileSync(seedPath, 'utf8');
      const data = yaml.load(fileContents);

      // Check 2: Schema Validation
      const parseResult = SeedSchema.safeParse(data);
      if (!parseResult.success) {
        results.push({
          check: 'seed-schema',
          status: 'FAIL',
          message: parseResult.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
        });
      } else {
        results.push({ check: 'seed-schema', status: 'PASS' });
        
        // Check 3: Organ Alignment
        const seed = parseResult.data;
        if (seed.organ !== 'III') {
          results.push({
            check: 'organ-alignment',
            status: 'FAIL',
            message: `Expected organ 'III', found '${seed.organ}'`,
          });
        } else {
          results.push({ check: 'organ-alignment', status: 'PASS' });
        }
      }
    } catch (error: any) {
      results.push({
        check: 'seed-parse',
        status: 'FAIL',
        message: error.message,
      });
    }

    return { analyzer: 'seed', results };
  }
}
