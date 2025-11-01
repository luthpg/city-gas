import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generate } from '@/plugin/generator';

const tempDir = path.resolve(__dirname, '.temp');

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
});
