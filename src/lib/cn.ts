import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "page-title",
            "section-title",
            "card-title",
            "body",
            "chinese-body",
            "supporting",
            "caption",
          ],
        },
      ],
      "font-family": [{ font: ["interface", "chinese"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs));
}
