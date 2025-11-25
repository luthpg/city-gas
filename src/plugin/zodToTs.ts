import ts from 'typescript';

interface ZodMeta {
  type: string;
  isOptional: boolean;
  isNullable: boolean;
}

/**
 * ZodのASTノードを解析してTypeScriptの型定義文字列に変換する
 */
export function zodToTs(
  node: ts.Expression,
  sourceFile: ts.SourceFile,
): string {
  const meta = parseZodNode(node, sourceFile);

  let typeStr = meta.type;

  // 入力用型定義(navigateの引数)としては、nullableは | null とする
  if (meta.isNullable) {
    if (typeStr === 'any' || typeStr === 'unknown') {
      // any | null は any なので何もしない
    } else {
      typeStr = `${typeStr} | null`;
    }
  }

  // optional または default() が指定されている場合は | undefined を付与
  if (meta.isOptional) {
    if (typeStr === 'any' || typeStr === 'unknown') {
      // any | undefined は any
    } else {
      // 既にユニオン型の場合は括弧をつけるなどの考慮も可能だが、
      // TSは `string | number | undefined` を正しく解釈するためそのまま結合
      typeStr = `${typeStr} | undefined`;
    }
  }

  return typeStr;
}

/**
 * 再帰的にZodチェーンを解析するコアロジック
 */
function parseZodNode(node: ts.Expression, sourceFile: ts.SourceFile): ZodMeta {
  // デフォルト: 解析不能なものは any とする
  const meta: ZodMeta = {
    type: 'any',
    isOptional: false,
    isNullable: false,
  };

  // 1. CallExpression (例: z.string(), .optional(), .min())
  if (ts.isCallExpression(node)) {
    const { expression, arguments: args } = node;

    // プロパティアクセス (例: z.string(), thing.optional())
    if (ts.isPropertyAccessExpression(expression)) {
      const methodName = expression.name.text;

      // --- Modifiers (型修飾) ---
      if (methodName === 'optional') {
        const innerMeta = parseZodNode(expression.expression, sourceFile);
        return { ...innerMeta, isOptional: true };
      }
      if (methodName === 'nullable') {
        const innerMeta = parseZodNode(expression.expression, sourceFile);
        return { ...innerMeta, isNullable: true };
      }
      if (methodName === 'nullish') {
        const innerMeta = parseZodNode(expression.expression, sourceFile);
        return { ...innerMeta, isOptional: true, isNullable: true };
      }
      if (methodName === 'default') {
        // default値がある場合、入力(navigate)としては省略可能
        const innerMeta = parseZodNode(expression.expression, sourceFile);
        return { ...innerMeta, isOptional: true };
      }

      // --- Collections (配列) ---
      if (methodName === 'array') {
        // パターンA: z.array(z.string()) -> 引数を見る
        // 修正点: 'z' が Identifier であるケース (通常) と PropertyAccess であるケース (名前空間など) 両方をチェック
        const isZIdentifier =
          ts.isIdentifier(expression.expression) &&
          expression.expression.text === 'z';
        const isZProperty =
          ts.isPropertyAccessExpression(expression.expression) &&
          expression.expression.name.text === 'z';

        if (isZIdentifier || isZProperty) {
          // z.array() の呼び出しとみなす
          if (args.length > 0) {
            const itemType = zodToTs(args[0], sourceFile);
            return { ...meta, type: `${wrapUnion(itemType)}[]` };
          }
          return { ...meta, type: 'any[]' };
        }

        // パターンB: z.string().array() -> チェーン元の型を配列化
        // 呼び出し元が 'z' そのものでない場合はメソッドチェーンとみなす
        const innerMeta = parseZodNode(expression.expression, sourceFile);

        let innerType = innerMeta.type;
        if (innerMeta.isNullable) innerType += ' | null';
        if (innerMeta.isOptional) innerType += ' | undefined';

        return {
          type: `${wrapUnion(innerType)}[]`,
          isOptional: false, // .array() した時点で直前のoptionalはリセットされる(配列自体は必須になる)
          isNullable: false,
        };
      }

      // --- Primitives & Creators ---
      // z.string(), z.coerce.number() などを判定

      // バリデーションメソッド (これらは型を変えないのでスキップして内側へ)
      const validationMethods = new Set([
        'min',
        'max',
        'length',
        'email',
        'url',
        'uuid',
        'cuid',
        'cuid2',
        'ulid',
        'regex',
        'includes',
        'startsWith',
        'endsWith',
        'datetime',
        'ip',
        'trim',
        'toLowerCase',
        'toUpperCase',
        'refine',
        'superRefine',
        'transform',
        'catch',
        'describe',
        'brand',
        'readonly',
      ]);

      if (validationMethods.has(methodName)) {
        // 型には影響しないので、内側(expression.expression)の結果をそのまま返す
        return parseZodNode(expression.expression, sourceFile);
      }

      // ここから下は "Base Types" の生成
      // z.string() や z.coerce.string() などを想定

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
          if (args.length > 0) {
            return { ...meta, type: getLiteralText(args[0], sourceFile) };
          }
          return { ...meta, type: 'any' };

        case 'enum':
          if (args.length > 0 && ts.isArrayLiteralExpression(args[0])) {
            const elements = args[0].elements.map((e) =>
              getLiteralText(e, sourceFile),
            );
            return { ...meta, type: elements.join(' | ') };
          }
          return { ...meta, type: 'string' }; // Fallback

        case 'nativeEnum':
          // z.nativeEnum(MyEnum) -> TypeScriptでは Enum名 を使うのが理想だが
          // ファイルまたぎのimport解決が困難なため、ここでは一旦 'string | number' などの広めの型か
          // 可能なら識別子名を使う
          if (args.length > 0 && ts.isIdentifier(args[0])) {
            return { ...meta, type: args[0].getText(sourceFile) };
          }
          return { ...meta, type: 'string | number' };

        case 'object':
          if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
            return { ...meta, type: parseZodObject(args[0], sourceFile) };
          }
          return { ...meta, type: '{}' };

        case 'record':
          // z.record(ValueType) or z.record(KeyType, ValueType)
          if (args.length === 1) {
            const valType = zodToTs(args[0], sourceFile);
            return { ...meta, type: `Record<string, ${valType}>` };
          } else if (args.length === 2) {
            const keyType = zodToTs(args[0], sourceFile);
            const valType = zodToTs(args[1], sourceFile);
            return { ...meta, type: `Record<${keyType}, ${valType}>` };
          }
          return { ...meta, type: 'Record<string, any>' };

        case 'tuple':
          if (args.length > 0 && ts.isArrayLiteralExpression(args[0])) {
            const types = args[0].elements.map((e) => zodToTs(e, sourceFile));
            return { ...meta, type: `[${types.join(', ')}]` };
          }
          return { ...meta, type: '[]' };

        case 'union':
          // z.union([z.string(), z.number()])
          if (args.length > 0 && ts.isArrayLiteralExpression(args[0])) {
            const types = args[0].elements.map((e) => zodToTs(e, sourceFile));
            // 重複排除等はしていない
            return { ...meta, type: types.join(' | ') };
          }
          return { ...meta, type: 'any' };

        case 'intersection':
          // .intersection() method chain is tricky, usually z.intersection(a, b)
          if (args.length === 2) {
            const left = zodToTs(args[0], sourceFile);
            const right = zodToTs(args[1], sourceFile);
            return {
              ...meta,
              type: `${wrapUnion(left)} & ${wrapUnion(right)}`,
            };
          }
          break;
      }

      // coerce.number() のようなケース
      // expression.expression (z.coerce) を見て判定したいが
      // 単純に末尾メソッド名が 'number' 等であれば上で拾っている
      // z.coerce.number() -> PropertyAccess(expression=z.coerce, name=number)
      // 上記switch文でカバーされているため、ここには到達しないはず。

      // 未知のメソッドの場合、とりあえず内側を解析してみる (カスタムメソッド等の可能性)
      return parseZodNode(expression.expression, sourceFile);
    }
  }

  // 2. Identifier (変数参照など: 例 schema)
  // 外部変数の解決は困難なため、anyフォールバックするか、変数名をそのまま型として出力する
  if (ts.isIdentifier(node)) {
    // 例: const mySchema = ...; z.object({ f: mySchema })
    // 型定義上で "mySchema" と出力しても、d.tsにその定義がないとエラーになる。
    // 安全のため any とする
    return { ...meta, type: 'any' };
  }

  // 3. ObjectLiteral (z.object({...}) ではなく、単なるオブジェクトが渡された場合など)
  // 基本的にZod定義内では発生しないはずだが、設定オブジェクト等の可能性あり

  return meta;
}

/**
 * z.object({ ... }) の中身を解析
 */
function parseZodObject(
  node: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile,
): string {
  const props: string[] = [];

  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const name = prop.name.getText(sourceFile);
      const valueNode = prop.initializer;

      const meta = parseZodNode(valueNode, sourceFile);

      // プロパティ修飾子 (?) の判定
      // optional または default がある場合は ? をつける
      const isOptionalProp = meta.isOptional;

      let typeStr = meta.type;

      // Nullable対応
      if (meta.isNullable) {
        if (typeStr !== 'any') typeStr += ' | null';
      }

      // 値定義としての undefined 対応 (optionalなら値としてundefinedを取りうる)
      // ただし、プロパティ修飾子(?)があれば型定義上の | undefined は必須ではないが、
      // 明示的につけておくのが安全
      /* if (isOptionalProp && typeStr !== 'any') typeStr += ' | undefined'; */
      // -> コメントアウト: TypeScriptでは `key?: T` は `key: T | undefined` を含意するため冗長記述を避ける

      const separator = isOptionalProp ? '?:' : ':';
      props.push(`${name}${separator} ${typeStr}`);
    }
  }

  if (props.length === 0) return '{}';
  return `{ ${props.join('; ')} }`;
}

/**
 * Helper: リテラル値のテキスト取得
 */
function getLiteralText(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isStringLiteral(node)) {
    return `"${node.text}"`;
  }
  if (ts.isNumericLiteral(node)) {
    return node.text;
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'null';

  return node.getText(sourceFile); // Fallback (変数参照など)
}

/**
 * Helper: Union型などが来た場合に括弧で囲む
 */
function wrapUnion(type: string): string {
  if (type.includes('|') || type.includes('&')) {
    // オブジェクト型 { ... } は括弧不要だが、判定が面倒なので
    // 先頭が { でなければ囲む、程度にする
    if (!type.trim().startsWith('{')) {
      return `(${type})`;
    }
  }
  return type;
}
