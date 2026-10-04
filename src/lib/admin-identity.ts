export const ADMIN_EMAIL = "hango.learn@gmail.com";

export function isAdministratorEmail(
  email: string | null | undefined,
): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}
