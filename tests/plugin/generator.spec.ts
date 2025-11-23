import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { generate, removeFile, updateFile } from '@/plugin/generator';

const tempDir = path.resolve(__dirname, '.temp-gen-spec');

describe('Plugin Generator', () => {
  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate routes and types correctly', async () => {
    const rootDir = path.join(tempDir, 'project');
    const pagesDir = path.join(rootDir, 'src', 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });

    fs.writeFileSync(
      path.join(pagesDir, 'index.tsx'),
      `export const params = { id: { type: 'string' } };`,
    );
    fs.writeFileSync(path.join(pagesDir, 'about.tsx'), '');
    fs.mkdirSync(path.join(pagesDir, 'users'), { recursive: true });
    fs.writeFileSync(
      path.join(pagesDir, 'users', 'show.vue'),
      `<script setup>\nexport const params = { userId: { type: 'string' } };\n</script>`,
    );

    await generate(rootDir);

    const typeContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'router.d.ts'),
      'utf-8',
    );
    expect(typeContent).toContain(
      'export type RouteNames = "/about" | "/" | "/users/show";',
    );

    const routesContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'routes.ts'),
      'utf-8',
    );
    expect(routesContent).toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/about\.tsx';/,
    );
    expect(routesContent).toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/users\/show\.vue';/,
    );
  });

  it('should handle dynamic routes ([param].tsx)', async () => {
    const rootDir = path.join(tempDir, 'project-dynamic');
    const pagesDir = path.join(rootDir, 'src', 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.mkdirSync(path.join(pagesDir, 'users'), { recursive: true });

    // src/pages/users/[userId].tsx
    fs.writeFileSync(
      path.join(pagesDir, 'users', '[userId].tsx'),
      `export const params = { extra: 'string?' };`,
    );

    await generate(rootDir);

    // Check router.d.ts
    const typeContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'router.d.ts'),
      'utf-8',
    );
    // Should contain route name with brackets
    expect(typeContent).toContain('"/users/[userId]"');
    // Should merge path param (userId: string) and dsl param (extra?: string)
    expect(typeContent).toContain('userId: string;');
    expect(typeContent).toContain('extra?: string;');

    // Check routes.ts
    const routesContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'routes.ts'),
      'utf-8',
    );
    // Should export dynamicRoutes
    expect(routesContent).toContain('export const dynamicRoutes = [');
    expect(routesContent).toContain('name: "/users/[userId]"');
    // Check regex pattern generation (note: backslashes are escaped in the file content string)
    // pattern: /^\/users\/([^/]+)$/
    expect(routesContent).toContain('pattern: /^\\/users\\/([^/]+)$/');
    expect(routesContent).toContain('paramNames: ["userId"]');
  });

  it('should handle special files like _layout and _root', async () => {
    const rootDir = path.join(tempDir, 'project-with-layouts');
    const pagesDir = path.join(rootDir, 'src', 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });

    // Create page files
    fs.writeFileSync(path.join(pagesDir, 'index.tsx'), '');

    // Create special files
    fs.writeFileSync(path.join(pagesDir, '_root.tsx'), '');
    fs.writeFileSync(path.join(pagesDir, '_layout.tsx'), '');
    fs.mkdirSync(path.join(pagesDir, 'users'), { recursive: true });
    fs.writeFileSync(path.join(pagesDir, 'users', '_layout.tsx'), '');

    await generate(rootDir);

    const routesContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'routes.ts'),
      'utf-8',
    );

    // Check that special files are imported
    expect(routesContent).toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/_layout\.tsx';/,
    );
    expect(routesContent).toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/_root\.tsx';/,
    );
    expect(routesContent).toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/users\/_layout\.tsx';/,
    );

    // Check that specialPages object is correct
    expect(routesContent).toContain('export const specialPages = {');
    // Check that specialPages object is correct
    expect(routesContent).toContain('export const specialPages = {');
    expect(routesContent).toMatch(/\s+"_layout": P_[a-f0-9]+,/);
    expect(routesContent).toMatch(/\s+"_root": P_[a-f0-9]+,/);
    expect(routesContent).toMatch(/\s+"users\/_layout": P_[a-f0-9]+,/);
  });

  it('should handle route conflicts by prioritizing index files', async () => {
    const rootDir = path.join(tempDir, 'project-with-conflicts');
    const pagesDir = path.join(rootDir, 'src', 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });

    // Create conflicting files
    const userFilePath = path.join(pagesDir, 'users.tsx');
    const userIndexFilePath = path.join(pagesDir, 'users', 'index.tsx');
    fs.writeFileSync(userFilePath, '');
    fs.mkdirSync(path.join(pagesDir, 'users'), { recursive: true });
    fs.writeFileSync(userIndexFilePath, '');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await generate(rootDir);

    const routesContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'routes.ts'),
      'utf-8',
    );

    // Check that the index file is prioritized
    expect(routesContent).toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/users\/index\.tsx';/,
    );
    expect(routesContent).not.toMatch(
      /import P_[a-f0-9]+ from '\.\.\/pages\/users\.tsx';/,
    );

    const typeContent = fs.readFileSync(
      path.join(rootDir, 'src', 'generated', 'router.d.ts'),
      'utf-8',
    );
    expect(typeContent).toContain('export type RouteNames = "/users";');

    const expectedWarning = `[city-gas] Warning: Route conflict detected. ${userFilePath.replaceAll(
      '\\',
      '/',
    )} is ignored because ${userIndexFilePath.replaceAll(
      '\\',
      '/',
    )} takes precedence (route name: "/users").`;

    // Check that a warning was logged
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(expectedWarning),
    );

    warnSpy.mockRestore();
  });

  describe('Cache Strategy', () => {
    const rootDir = path.join(tempDir, 'cache-strategy');
    const pagesDir = path.join(rootDir, 'src', 'pages');

    beforeAll(async () => {
      fs.mkdirSync(pagesDir, { recursive: true });
      // Initial generation to populate cache
      fs.writeFileSync(
        path.join(pagesDir, 'index.tsx'),
        `export const params = {};`,
      );
      await generate(rootDir);
    });

    it('should NOT read file content if mtimeMs is unchanged (updateFile)', async () => {
      const filePath = path.join(pagesDir, 'index.tsx');
      const statSpy = vi.spyOn(fs, 'statSync');
      const readSpy = vi.spyOn(fs, 'readFileSync');
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      // 1. Get current mtimeMs
      const stat = fs.statSync(filePath);

      // 2. Mock statSync to return the SAME mtimeMs
      statSpy.mockReturnValue({
        ...stat,
        mtimeMs: stat.mtimeMs,
      } as any);

      // 3. Call updateFile
      await updateFile(filePath, rootDir);

      // 4. Verify readFileSync was NOT called (cache hit)
      expect(readSpy).not.toHaveBeenCalled();
      // 5. Verify writeFileSync was NOT called (no change)
      expect(writeSpy).not.toHaveBeenCalled();

      statSpy.mockRestore();
      readSpy.mockRestore();
      writeSpy.mockRestore();
    });

    it('should read file content if mtimeMs changed (updateFile)', async () => {
      const filePath = path.join(pagesDir, 'index.tsx');
      const statSpy = vi.spyOn(fs, 'statSync');
      const readSpy = vi.spyOn(fs, 'readFileSync');
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      // 1. Get current mtimeMs
      const stat = fs.statSync(filePath);

      // 2. Mock statSync to return a NEW mtimeMs
      statSpy.mockReturnValue({
        ...stat,
        mtimeMs: stat.mtimeMs + 1000,
      } as any);

      // 3. Call updateFile
      // Note: We don't need to actually change the file content on disk because we are mocking statSync.
      // However, updateFile will call readFileSync. We let it read the actual file (which hasn't changed content-wise).
      // If content hasn't changed, flushFiles -> generateTypeContent -> contentCache check might prevent writeFileSync.
      // To force a write, we should probably mock readFileSync too or actually change the file.
      // Let's actually change the file to be sure.

      const newContent = `export const params = { updated: 'true' };`;
      fs.writeFileSync(filePath, newContent);

      // Update our mock to return the NEW mtimeMs (since we just wrote it, it would be new anyway, but let's be explicit or just use real stat)
      // Actually, if we write to the file, the real stat will have new mtime.
      // So we don't strictly need to mock statSync if we sleep or ensure time passes, but mocking is safer for tests.
      // Let's rely on the real FS for this test to be more integration-like, but spy on the calls.

      statSpy.mockRestore(); // Use real stat

      // We need to wait a bit or manually touch mtime to ensure it's different if the OS resolution is low?
      // Node.js fs.writeFileSync usually updates mtime.

      await updateFile(filePath, rootDir);

      // 4. Verify readFileSync WAS called
      expect(readSpy).toHaveBeenCalledWith(
        expect.stringMatching(/index\.tsx$/),
        'utf-8',
      );

      // 5. Verify writeFileSync WAS called (because content changed -> types changed)
      expect(writeSpy).toHaveBeenCalled();

      readSpy.mockRestore();
      writeSpy.mockRestore();
    });

    it('should remove file from cache and update routes on unlink (removeFile)', async () => {
      const filePath = path.join(pagesDir, 'index.tsx');
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      // 1. Call removeFile
      await removeFile(filePath, rootDir);

      // 2. Verify writeFileSync WAS called (to remove route)
      expect(writeSpy).toHaveBeenCalled();

      // Verify content of routes.ts (optional, but good check)
      const routesContent = fs.readFileSync(
        path.join(rootDir, 'src', 'generated', 'routes.ts'),
        'utf-8',
      );
      expect(routesContent).not.toContain('index.tsx');

      writeSpy.mockRestore();
    });

    it('should add new file to cache and update routes (updateFile - new file)', async () => {
      const newFilePath = path.join(pagesDir, 'new-page.tsx');
      fs.writeFileSync(newFilePath, `export const params = {};`);

      const readSpy = vi.spyOn(fs, 'readFileSync');
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      // 1. Call updateFile
      await updateFile(newFilePath, rootDir);

      // 2. Verify readFileSync WAS called
      expect(readSpy).toHaveBeenCalledWith(
        expect.stringMatching(/new-page\.tsx$/),
        'utf-8',
      );

      // 3. Verify writeFileSync WAS called
      expect(writeSpy).toHaveBeenCalled();

      const routesContent = fs.readFileSync(
        path.join(rootDir, 'src', 'generated', 'routes.ts'),
        'utf-8',
      );
      expect(routesContent).toContain('new-page.tsx');

      readSpy.mockRestore();
      writeSpy.mockRestore();
    });
  });
});
