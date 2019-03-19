export function getProp<
  O,
  P extends keyof O,
  D,
>(
  object: O | null,
  prop: P,
  defaultValue: D,
): NonNullable<O[P]> | D {
  if (object == null) {
    return defaultValue;
  }
  const value = object[prop];
  if (value == null) {
    return defaultValue;
  } else {
    return value as NonNullable<O[P]>;
  }
}
