import "server-only";
import { revalidatePath } from "next/cache";
import { localePath, SUPPORTED_LOCALES } from "@/i18n/config";

/** Invalidates both public locale variants of the same learner page. */
export function revalidateLocalizedPath(path: string): void {
  for (const locale of SUPPORTED_LOCALES) {
    revalidatePath(localePath(locale, path));
  }
}
