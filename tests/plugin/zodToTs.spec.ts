import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { zodToTs } from '@/plugin/zodToTs';

function parseExpression(code: string): {
  node: ts.Expression;
  sourceFile: ts.SourceFile;
} {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
  );

  // ExpressionStatementのexpressionを取得
  const statement = sourceFile.statements[0] as ts.ExpressionStatement;
  return { node: statement?.expression, sourceFile };
}

describe('zodToTs', () => {
  describe('Primitives', () => {
    it('should convert primitive types', () => {
      const { node, sourceFile } = parseExpression('z.string()');
      expect(zodToTs(node, sourceFile)).toBe('string');
    });

    it('should convert number and boolean', () => {
      expect(
        zodToTs(
          parseExpression('z.number()').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('number');
      expect(
        zodToTs(
          parseExpression('z.boolean()').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('boolean');
    });

    it('should convert any, unknown, void', () => {
      expect(
        zodToTs(
          parseExpression('z.any()').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('any');
      expect(
        zodToTs(
          parseExpression('z.unknown()').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('unknown');
    });
  });

  describe('Modifiers', () => {
    it('should handle optional', () => {
      // Input型としては string | undefined
      const { node, sourceFile } = parseExpression('z.string().optional()');
      expect(zodToTs(node, sourceFile)).toBe('string | undefined');
    });

    it('should handle nullable', () => {
      const { node, sourceFile } = parseExpression('z.number().nullable()');
      expect(zodToTs(node, sourceFile)).toBe('number | null');
    });

    it('should handle nullish (optional + nullable)', () => {
      const { node, sourceFile } = parseExpression('z.string().nullish()');
      const res = zodToTs(node, sourceFile);
      // string | null | undefined (順序は実装依存だが含まれているか確認)
      expect(res).toContain('string');
      expect(res).toContain('null');
      expect(res).toContain('undefined');
    });

    it('should treat .default() as optional for input', () => {
      const { node, sourceFile } = parseExpression('z.string().default("foo")');
      expect(zodToTs(node, sourceFile)).toBe('string | undefined');
    });
  });

  describe('Coercion', () => {
    it('should handle z.coerce.number()', () => {
      const { node, sourceFile } = parseExpression('z.coerce.number()');
      expect(zodToTs(node, sourceFile)).toBe('number');
    });

    it('should handle z.coerce.boolean().optional()', () => {
      const { node, sourceFile } = parseExpression(
        'z.coerce.boolean().optional()',
      );
      expect(zodToTs(node, sourceFile)).toBe('boolean | undefined');
    });
  });

  describe('Validations', () => {
    it('should ignore validation methods', () => {
      const { node, sourceFile } = parseExpression(
        'z.string().min(1).email().max(10).trim()',
      );
      expect(zodToTs(node, sourceFile)).toBe('string');
    });

    it('should ignore validation but keep optional', () => {
      const { node, sourceFile } = parseExpression(
        'z.string().min(1).optional()',
      );
      expect(zodToTs(node, sourceFile)).toBe('string | undefined');
    });

    it('should ignore .transform()', () => {
      // transform後の型推論は複雑なので、一旦入力型(string)を維持する挙動が期待される
      // または any になるかもしれないが、現状の実装では内側(string)を返す
      const { node, sourceFile } = parseExpression(
        'z.string().transform(s => s.length)',
      );
      expect(zodToTs(node, sourceFile)).toBe('string');
    });
  });

  describe('Collections', () => {
    it('should convert z.enum', () => {
      const { node, sourceFile } = parseExpression("z.enum(['a', 'b'])");
      expect(zodToTs(node, sourceFile)).toBe('"a" | "b"');
    });

    it('should convert z.literal', () => {
      expect(
        zodToTs(
          parseExpression('z.literal("hello")').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('"hello"');
      expect(
        zodToTs(
          parseExpression('z.literal(123)').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('123');
      expect(
        zodToTs(
          parseExpression('z.literal(true)').node,
          parseExpression('').sourceFile,
        ),
      ).toBe('true');
    });

    it('should convert z.array(z.string())', () => {
      const { node, sourceFile } = parseExpression('z.array(z.string())');
      expect(zodToTs(node, sourceFile)).toBe('string[]');
    });

    it('should convert z.string().array()', () => {
      const { node, sourceFile } = parseExpression('z.string().array()');
      expect(zodToTs(node, sourceFile)).toBe('string[]');
    });

    it('should convert z.record', () => {
      const { node, sourceFile } = parseExpression('z.record(z.number())');
      expect(zodToTs(node, sourceFile)).toBe('Record<string, number>');
    });

    it('should convert z.tuple', () => {
      const { node, sourceFile } = parseExpression(
        'z.tuple([z.string(), z.number()])',
      );
      expect(zodToTs(node, sourceFile)).toBe('[string, number]');
    });

    it('should convert z.union', () => {
      const { node, sourceFile } = parseExpression(
        'z.union([z.string(), z.number()])',
      );
      expect(zodToTs(node, sourceFile)).toBe('string | number');
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
      const { node, sourceFile } = parseExpression(code);
      const result = zodToTs(node, sourceFile);

      // フォーマットは実装依存だが、要素が含まれているか確認
      expect(result).toContain('name: string');
      expect(result).toContain('age?: number'); // optional
      expect(result).toContain('active?: boolean'); // default -> optional
      expect(result).toContain('nullableField: string | null');
    });

    it('should convert nested object', () => {
      const code = `
        z.object({
          user: z.object({
            id: z.string()
          })
        })
      `;
      const { node, sourceFile } = parseExpression(code);
      expect(zodToTs(node, sourceFile)).toMatch(/{ user: { id: string } }/);
    });
  });
});
