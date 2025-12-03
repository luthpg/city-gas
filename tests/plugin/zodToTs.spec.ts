import { type Expression, Project } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { zodToTs } from '@/plugin/zodToTs';

const project = new Project();

function parseExpression(code: string): Expression {
  const sourceFile = project.createSourceFile(
    'test.ts',
    `const schema = ${code};`,
    { overwrite: true },
  );
  const declaration = sourceFile.getVariableDeclaration('schema');
  return declaration?.getInitializer() as Expression;
}

describe('zodToTs', () => {
  describe('Primitives', () => {
    it('should convert primitive types', () => {
      const node = parseExpression('z.string()');
      expect(zodToTs(node)).toBe('string');
    });

    it('should convert number and boolean', () => {
      expect(zodToTs(parseExpression('z.number()'))).toBe('number');
      expect(zodToTs(parseExpression('z.boolean()'))).toBe('boolean');
    });

    it('should convert any, unknown, void', () => {
      expect(zodToTs(parseExpression('z.any()'))).toBe('any');
      expect(zodToTs(parseExpression('z.unknown()'))).toBe('unknown');
    });
  });

  describe('Modifiers', () => {
    it('should handle optional', () => {
      const node = parseExpression('z.string().optional()');
      expect(zodToTs(node)).toBe('string | undefined');
    });

    it('should handle nullable', () => {
      const node = parseExpression('z.number().nullable()');
      expect(zodToTs(node)).toBe('number | null');
    });

    it('should handle nullish (optional + nullable)', () => {
      const node = parseExpression('z.string().nullish()');
      const res = zodToTs(node);
      expect(res).toContain('string');
      expect(res).toContain('null');
      expect(res).toContain('undefined');
    });

    it('should treat .default() as optional for input', () => {
      const node = parseExpression('z.string().default("foo")');
      expect(zodToTs(node)).toBe('string | undefined');
    });
  });

  describe('Coercion', () => {
    it('should handle z.coerce.number()', () => {
      const node = parseExpression('z.coerce.number()');
      expect(zodToTs(node)).toBe('number');
    });

    it('should handle z.coerce.boolean().optional()', () => {
      const node = parseExpression('z.coerce.boolean().optional()');
      expect(zodToTs(node)).toBe('boolean | undefined');
    });
  });

  describe('Validations', () => {
    it('should ignore validation methods', () => {
      const node = parseExpression('z.string().min(1).email().max(10).trim()');
      expect(zodToTs(node)).toBe('string');
    });

    it('should ignore validation but keep optional', () => {
      const node = parseExpression('z.string().min(1).optional()');
      expect(zodToTs(node)).toBe('string | undefined');
    });

    it('should ignore .transform()', () => {
      const node = parseExpression('z.string().transform(s => s.length)');
      expect(zodToTs(node)).toBe('string');
    });
  });

  describe('Collections', () => {
    it('should convert z.enum', () => {
      const node = parseExpression("z.enum(['a', 'b'])");
      // Note: ts-morph might add spaces.
      expect(zodToTs(node).replace(/\s/g, '')).toBe('"a"|"b"');
    });

    it('should convert z.literal', () => {
      expect(zodToTs(parseExpression('z.literal("hello")'))).toBe('"hello"');
      expect(zodToTs(parseExpression('z.literal(123)'))).toBe('123');
      expect(zodToTs(parseExpression('z.literal(true)'))).toBe('true');
    });

    it('should convert z.array(z.string())', () => {
      const node = parseExpression('z.array(z.string())');
      expect(zodToTs(node)).toBe('string[]');
    });

    it('should convert z.string().array()', () => {
      const node = parseExpression('z.string().array()');
      expect(zodToTs(node)).toBe('string[]');
    });

    it('should convert z.record', () => {
      const node = parseExpression('z.record(z.number())');
      expect(zodToTs(node)).toBe('Record<string, number>');
    });

    it('should convert z.tuple', () => {
      const node = parseExpression('z.tuple([z.string(), z.number()])');
      expect(zodToTs(node).replace(/\s/g, '')).toBe('[string,number]');
    });

    it('should convert z.union', () => {
      const node = parseExpression('z.union([z.string(), z.number()])');
      expect(zodToTs(node).replace(/\s/g, '')).toBe('string|number');
    });
  });

  describe('Objects', () => {
    it('should convert object', () => {
      const code = `
        z.object({
          name: z.string(),
          age: z.number().optional(),
          active: z.boolean().default(true),
          nullableField: z.string().nullable()
        })
      `;
      const node = parseExpression(code);
      const result = zodToTs(node);

      // Normalize whitespace for comparison
      const normalized = result.replace(/\s/g, '');
      expect(normalized).toContain('name:string');
      expect(normalized).toContain('age?:number');
      expect(normalized).toContain('active?:boolean');
      expect(normalized).toContain('nullableField:string|null');
    });

    it('should convert nested object', () => {
      const code = `
        z.object({
          user: z.object({
            id: z.string()
          })
        })
      `;
      const node = parseExpression(code);
      const result = zodToTs(node);
      expect(result.replace(/\s/g, '')).toMatch(/{user:{id:string}}/);
    });
  });
});

describe('Complex Scenarios', () => {
  it('should resolve schema from variable reference', () => {
    const sourceFile = project.createSourceFile(
      'test_ref.ts',
      `
        import { z } from 'zod';
        const stringSchema = z.string().min(1);
        const schema = z.object({
          name: stringSchema,
          age: z.number()
        });
      `,
      { overwrite: true },
    );
    const declaration = sourceFile.getVariableDeclaration('schema');
    const node = declaration?.getInitializer() as Expression;
    const result = zodToTs(node);
    expect(result).toContain('name: string');
    expect(result).toContain('age: number');
  });

  it('should handle aliased zod import', () => {
    const sourceFile = project.createSourceFile(
      'test_alias.ts',
      `
        import { z as customZ } from 'zod';
        const schema = customZ.array(customZ.string());
      `,
      { overwrite: true },
    );
    const declaration = sourceFile.getVariableDeclaration('schema');
    const node = declaration?.getInitializer() as Expression;
    expect(zodToTs(node)).toBe('string[]');
  });

  it('should handle aliased zod import with object', () => {
    const sourceFile = project.createSourceFile(
      'test_alias_obj.ts',
      `
        import { z as customZ } from 'zod';
        const schema = customZ.object({
          id: customZ.number()
        });
      `,
      { overwrite: true },
    );
    const declaration = sourceFile.getVariableDeclaration('schema');
    const node = declaration?.getInitializer() as Expression;
    const result = zodToTs(node);
    expect(result.replace(/\s/g, '')).toBe('{id:number}');
  });
});
