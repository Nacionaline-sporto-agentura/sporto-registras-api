export function TEMP_FAKE_TYPE_NAMES(name: string, count: number = 2) {
  return new Array(count).fill(0).map((i, index) => ({ name: `TODO: ${name}.${index + 1}` }));
}
