import {
  type ArrayLiteralExpression,
  type Expression,
  type Identifier,
  Node,
  type ObjectLiteralExpression,
  SyntaxKind,
} from 'ts-morph';

interface ZodMeta {
  type: string;
  isOptional: boolean;
  isNullable: boolean;
}

function getNodeKey(node: Node): string {
  return `${node.getSourceFile().getFilePath()}:${node.getPos()}:${node.getEnd()}`;
}

/**
 * ZodのASTノードを解析してTypeScriptの型定義文字列に変換する (エントリーポイント)
 */
export function zodToTs(node: Expression, seen?: Set<string>): string {
  // 再帰呼び出しでない場合、seenセットを初期化
  const seenInScope = seen ?? new Set<string>();
  const meta = parseZodNode(node, seenInScope);

  let typeStr = meta.type;

  // nullableは | null とする
  if (meta.isNullable) {
    if (typeStr !== 'any' && typeStr !== 'unknown') {
      typeStr = `${typeStr} | null`;
    }
  }

  // optional または default() は | undefined を付与
  if (meta.isOptional) {
    if (typeStr !== 'any' && typeStr !== 'unknown') {
      typeStr = `${typeStr} | undefined`;
    }
  }

  return typeStr;
}

/**
 * 再帰的にZodチェーンを解析するコアロジック
 */
function parseZodNode(node: Node, seen: Set<string>): ZodMeta {
  const key = getNodeKey(node);
  if (seen.has(key)) {
    return { type: 'any', isOptional: false, isNullable: false };
  }
  seen.add(key);

  const meta: ZodMeta = {
    type: 'any',
    isOptional: false,
    isNullable: false,
  };

  // 1. CallExpression (例: z.string(), .optional())
  if (Node.isCallExpression(node)) {
    const expression = node.getExpression();
    const args = node.getArguments();

    if (Node.isPropertyAccessExpression(expression)) {
      const methodName = expression.getName();
      const innerExpression = expression.getExpression();

      // --- Modifiers (型修飾) ---
      if (methodName === 'optional') {
        return { ...parseZodNode(innerExpression, seen), isOptional: true };
      }
      if (methodName === 'nullable') {
        return { ...parseZodNode(innerExpression, seen), isNullable: true };
      }
      if (methodName === 'nullish') {
        return {
          ...parseZodNode(innerExpression, seen),
          isOptional: true,
          isNullable: true,
        };
      }
      if (methodName === 'default') {
        return { ...parseZodNode(innerExpression, seen), isOptional: true };
      }

      // --- Collections (配列) ---
      if (methodName === 'array') {
        // z.array(z.string())
        if (args.length > 0) {
          const itemType = zodToTs(args[0] as Expression, seen);
          return { ...meta, type: `${wrapUnion(itemType)}[]` };
        }
        // z.string().array()
        if (
          Node.isPropertyAccessExpression(innerExpression) ||
          Node.isCallExpression(innerExpression)
        ) {
          const innerMeta = parseZodNode(innerExpression, seen);
          let innerType = innerMeta.type;
          if (innerMeta.isNullable) innerType += ' | null';
          if (innerMeta.isOptional) innerType += ' | undefined';
          return {
            type: `${wrapUnion(innerType)}[]`,
            isOptional: false,
            isNullable: false,
          };
        }
        return { ...meta, type: 'any[]' };
      }

      // --- Primitives & Creators ---
      const validationMethods = new Set([
        'min', 'max', 'length', 'email', 'url', 'uuid', 'cuid', 'cuid2', 'ulid',
        'regex', 'includes', 'startsWith', 'endsWith', 'datetime', 'ip', 'trim',
        'toLowerCase', 'toUpperCase', 'refine', 'superRefine', 'transform',
        'catch', 'describe', 'brand', 'readonly',
      ]);

      if (validationMethods.has(methodName)) {
        return parseZodNode(innerExpression, seen);
      }

      switch (methodName) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'bigint':
        case 'date':
        case 'symbol':
        case 'undefined':
        case 'void':
        case 'any':
        case 'unknown':
        case 'never':
          return { ...meta, type: methodName };
        case 'null':
          return { ...meta, type: 'null' };
        case 'literal':
          return args.length > 0
            ? { ...meta, type: getLiteralText(args[0]) }
            : { ...meta, type: 'any' };
        case 'enum':
          if (args.length > 0 && Node.isArrayLiteralExpression(args[0])) {
            const elements = (args[0] as ArrayLiteralExpression)
              .getElements()
              .map((e) => getLiteralText(e));
            return { ...meta, type: elements.join(' | ') };
          }
          return { ...meta, type: 'string' }; // Fallback
        case 'nativeEnum':
          if (args.length > 0 && Node.isIdentifier(args[0])) {
            return { ...meta, type: (args[0] as Identifier).getText() };
          }
          return { ...meta, type: 'string | number' };
        case 'object':
          if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
            return {
              ...meta,
              type: parseZodObject(args[0] as ObjectLiteralExpression, seen),
            };
          }
          return { ...meta, type: '{}' };
        case 'record':
          if (args.length === 1) {
            const valType = zodToTs(args[0] as Expression, seen);
            return { ...meta, type: `Record<string, ${valType}>` };
          } else if (args.length === 2) {
            const keyType = zodToTs(args[0] as Expression, seen);
            const valType = zodToTs(args[1] as Expression, seen);
            return { ...meta, type: `Record<${keyType}, ${valType}>` };
          }
          return { ...meta, type: 'Record<string, any>' };
        case 'tuple':
          if (args.length > 0 && Node.isArrayLiteralExpression(args[0])) {
            const types = (args[0] as ArrayLiteralExpression)
              .getElements()
              .map((e) => zodToTs(e as Expression, seen));
            return { ...meta, type: `[${types.join(', ')}]` };
          }
          return { ...meta, type: '[]' };

        case 'union':
          if (args.length > 0 && Node.isArrayLiteralExpression(args[0])) {
            const types = (args[0] as ArrayLiteralExpression)
              .getElements()
              .map((e) => zodToTs(e as Expression, seen));
            return { ...meta, type: types.join(' | ') };
          }
          return { ...meta, type: 'any' };
        case 'intersection':
          if (args.length === 2) {
            const left = zodToTs(args[0] as Expression, seen);
            const right = zodToTs(args[1] as Expression, seen);
            return {
              ...meta,
              type: `${wrapUnion(left)} & ${wrapUnion(right)}`,
            };
          }
          break;
      }
      return parseZodNode(innerExpression, seen);
    }
  }

  // 2. Identifier (変数参照)
  if (Node.isIdentifier(node)) {
    const symbol = node.getSymbol();
    const declaration = symbol?.getValueDeclaration();

    if (declaration && Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer();
      if (initializer) {
        return parseZodNode(initializer, seen);
      }
    }
  }

  return meta;
}

/**
 * z.object({ ... }) の中身を解析
 */
function parseZodObject(node: ObjectLiteralExpression, seen: Set<string>): string {
  const props: string[] = [];

  for (const prop of node.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const name = prop.getName();
      const valueNode = prop.getInitializer();

      if (valueNode) {
        const meta = parseZodNode(valueNode, seen);
        const isOptionalProp = meta.isOptional;
        let typeStr = meta.type;

        if (meta.isNullable) {
          if (typeStr !== 'any') typeStr += ' | null';
        }

        const separator = isOptionalProp ? '?:' : ':';
        props.push(`${name}${separator} ${typeStr}`);
      }
    }
  }

  if (props.length === 0) return '{}';
  return `{ ${props.join('; ')} }`;
}

/**
 * Helper: リテラル値のテキスト取得
 */
function getLiteralText(node: Node): string {
  if (Node.isStringLiteral(node)) {
    return `"${node.getLiteralValue()}"`;
  }
  if (Node.isNumericLiteral(node)) {
    return node.getLiteralText();
  }
  if (node.getKind() === SyntaxKind.TrueKeyword) return 'true';
  if (node.getKind() === SyntaxKind.FalseKeyword) return 'false';
  if (node.getKind() === SyntaxKind.NullKeyword) return 'null';

  return node.getText(); // Fallback
}

/**
 * Helper: Union型などが来た場合に括弧で囲む
 */
function wrapUnion(type: string): string {
  if (type.includes('|') || type.includes('&')) {
    if (!type.trim().startsWith('{')) {
      return `(${type})`;
    }
  }
  return type;
}
