import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { generate } from '@/plugin/generator';

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
    expect(routesContent).toContain(`import P0 from '../pages/about.tsx';`);
    expect(routesContent).toContain(
      `import P2 from '../pages/users/show.vue';`,
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
    expect(routesContent).toContain(`import P1 from '../pages/_layout.tsx';`);
    expect(routesContent).toContain(`import P2 from '../pages/_root.tsx';`);
    expect(routesContent).toContain(
      `import P3 from '../pages/users/_layout.tsx';`,
    );

    // Check that specialPages object is correct
    expect(routesContent).toContain('export const specialPages = {');
    expect(routesContent).toContain(`  "_layout": P1,`);
    expect(routesContent).toContain(`  "_root": P2,`);
    expect(routesContent).toContain(`  "users/_layout": P3,`);
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
    expect(routesContent).toContain(
      `import P0 from '../pages/users/index.tsx';`,
    );
    expect(routesContent).not.toContain(`import P0 from '../pages/users.tsx';`);

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
});
