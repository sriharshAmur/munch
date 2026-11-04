export type Shape =
  null | boolean | number | string | { [key: string]: Shape } | Shape[];
export function shape(value: unknown): Shape {
  if (value === null) return null;
  if (Array.isArray(value))
    return { $length: value.length, $items: merge(value.map(shape)) };
  if (typeof value === 'object') {
    const result: { [key: string]: Shape } = {};
    for (const [key, child] of Object.entries(value))
      result[key] = shape(child);
    return result;
  }
  if (typeof value === 'string')
    return /^\d{4}-\d\d-\d\d(?:T|$)/.test(value) ? '<date>' : '<str>';
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  return '<unknown>';
}
function merge(values: Shape[]): Shape {
  if (!values.length) return null;
  const isObject = (v: Shape): v is { [key: string]: Shape } =>
    v !== null && typeof v === 'object' && !Array.isArray(v);
  const objects = values.filter(isObject);
  if (objects.length) {
    const result: { [key: string]: Shape } = {};
    for (const key of new Set(objects.flatMap((v) => Object.keys(v)))) {
      if (key === '$length') {
        result[key] = Math.max(
          ...objects.flatMap((v) =>
            typeof v[key] === 'number' ? [v[key]] : [],
          ),
        );
      } else {
        const parents =
          key === '$items' ? objects.filter((v) => v.$length !== 0) : objects;
        result[key] = merge(
          parents.flatMap((v) => (key in v ? [v[key] ?? null] : [])),
        );
      }
    }
    const rest = values.filter((v) => !isObject(v));
    return rest.length ? { $variants: [result, merge(rest)] } : result;
  }
  const unique = [
    ...new Map(values.map((v) => [JSON.stringify(v), v])).values(),
  ];
  return unique.length === 1 ? (unique[0] ?? null) : { $variants: unique };
}
export function responseShape(text: string, contentType: string) {
  if (contentType.includes('json'))
    return { kind: 'json', shape: shape(JSON.parse(text)) };
  const scripts = [
    ...text.matchAll(
      /<script\b[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].flatMap((match) => {
    try {
      return [shape(JSON.parse(match[1] ?? ''))];
    } catch {
      return [];
    }
  });
  return { kind: 'server-rendered', scripts };
}
