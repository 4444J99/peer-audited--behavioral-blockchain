import { Command } from 'commander';
import path from 'path';
import { SeedAnalyzer } from './analyzers/seed/index';
import { AestheticAnalyzer } from './analyzers/aesthetic/index';
import { BehavioralAnalyzer } from './analyzers/behavioral/index';
import { SuiteResult } from './types/index';

const program = new Command();

program
  .name('ergon-test')
  .description('Validation & Simulation Suite for ORGAN-III')
  .version('0.0.1')
  .requiredOption('-r, --repo <path>', 'Path to the repository to audit')
  .option('-u, --url <url>', 'URL for aesthetic audit (optional)')
  .action(async (options) => {
    const targetRepo = path.resolve(process.cwd(), options.repo);
    console.log(`🚀 Starting Ergon Audit for: ${targetRepo}`);
    
    const results: SuiteResult[] = [];
    
    // 1. Seed Analyzer
    const seedAnalyzer = new SeedAnalyzer(targetRepo);
    results.push(seedAnalyzer.analyze());

    // 2. Behavioral Analyzer
    const behavioralAnalyzer = new BehavioralAnalyzer(targetRepo);
    results.push(behavioralAnalyzer.analyze());

    // 3. Aesthetic Analyzer (Conditional)
    if (options.url) {
      console.log(`🎨 Running Aesthetic Audit for: ${options.url}`);
      const aestheticAnalyzer = new AestheticAnalyzer(options.url);
      results.push(await aestheticAnalyzer.analyze());
    }
    
    // Output Results
    console.log('\n--- Audit Results ---');
    results.forEach(suite => {
      console.log(`\nAnalyzer: ${suite.analyzer.toUpperCase()}`);
      suite.results.forEach(res => {
        const icon = res.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} [${res.check}] ${res.status}${res.message ? `: ${res.message}` : ''}`);
      });
    });

    const hasFailures = results.some(suite => suite.results.some(res => res.status === 'FAIL'));
    if (hasFailures) {
      console.log('\n❌ Audit failed.');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed.');
      process.exit(0);
    }
  });

program.parse();
