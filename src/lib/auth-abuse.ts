import "server-only";

export function isAuthHoneypotFilled(formData: FormData): boolean {
  const value = formData.get("website");
  return typeof value === "string" && value.trim().length > 0;
}
