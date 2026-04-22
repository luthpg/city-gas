import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generate } from '../../src/plugin/generator';

describe('generator reserved words', () => {
  it('should throw an error if "page" is used as a schema key', async () => {
    const rootDir = path.resolve(__dirname, '../../');
    const testPagesDir = path.resolve(
      rootDir,
      'tests/plugin/fixtures/invalid-schema',
    );

    // Make sure the directory exists
    if (!fs.existsSync(testPagesDir)) {
      fs.mkdirSync(testPagesDir, { recursive: true });
    }

    // Write a test page with "page" key
    const testFilePath = path.join(testPagesDir, 'test.tsx');
    fs.writeFileSync(
      testFilePath,
      `import { z } from 'zod'; export const schema = z.object({ page: z.string() });`,
    );

    // Run generate and expect it to throw
    await expect(generate(rootDir, testPagesDir)).rejects.toThrow(
      '[city-gas] Reserved word "page" is not allowed in schema definition.',
    );

    // Cleanup
    fs.unlinkSync(testFilePath);
    fs.rmdirSync(testPagesDir);
  });
});
