export type DSL =
  | 'string'
  | 'string?'
  | 'number'
  | 'number?'
  | 'boolean'
  | 'boolean?'
  | { type: 'enum'; values: string[]; optional?: boolean }
  | { type: 'array'; items: DSL; optional?: boolean }
  | { type: 'object'; shape: Record<string, DSL>; optional?: boolean };

function isObject(value: any): value is { type: string } {
  return typeof value === 'object' && value !== null && 'type' in value;
}

export function dslToTs(dsl: DSL): string {
  if (typeof dsl === 'string') {
    if (dsl.endsWith('?')) {
      return `${dsl.slice(0, -1)} | undefined`;
    }
    return dsl;
  }

  if (isObject(dsl)) {
    let typeStr = '';
    switch (dsl.type) {
      case 'enum':
        typeStr = dsl.values.map((v) => JSON.stringify(v)).join(' | ');
        break;
      case 'array': {
        const itemType = dslToTs(dsl.items);
        // Add parentheses only if the item type is a union and not an object literal
        const wrappedItemType =
          itemType.includes('|') && !itemType.trim().startsWith('{')
            ? `(${itemType})`
            : itemType;
        typeStr = `${wrappedItemType}[]`;
        break;
      }
      case 'object': {
        const shape = Object.entries(dsl.shape)
          .map(([key, value]) => {
            let isOptional = false;
            if (typeof value === 'string') {
              isOptional = value.endsWith('?');
            } else if (isObject(value)) {
              isOptional = !!value.optional;
            }

            const finalKey = isOptional ? `${key}?` : key;
            const typeWithoutOptional = dslToTs(value).replace(
              ' | undefined',
              '',
            );
            return `${finalKey}: ${typeWithoutOptional}`;
          })
          .join('; ');
        typeStr = `{ ${shape}; }`;
        break;
      }
    }

    if (dsl.optional) {
      return `${typeStr} | undefined`;
    }
    return typeStr;
  }

  return 'never';
}
