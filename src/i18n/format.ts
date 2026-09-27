export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  // A missing template (a message key that doesn't exist at runtime, e.g. a
  // stale dev-server module cache after adding a new key) used to throw here
  // ("Cannot read properties of undefined (reading 'replace')"), which
  // surfaced as the generic lesson error boundary with no clue what broke.
  if (typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
