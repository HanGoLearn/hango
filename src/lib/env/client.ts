import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("HanGo"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables: ${parsed.error.message}`,
  );
}

export const clientEnv = parsed.data;
