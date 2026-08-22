import { clientEnv } from "@/lib/env/client";
import { db } from "@/lib/db";
import {
  PageTitle,
  Body,
  ChineseText,
  Pinyin,
  Translation,
  Caption,
} from "@/components/ui/typography";

export default async function HomePage() {
  const healthCheck = await db.healthCheck.findFirst({
    orderBy: { checkedAt: "desc" },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <PageTitle>{clientEnv.NEXT_PUBLIC_APP_NAME}</PageTitle>
      <Body>Application foundation running.</Body>

      <div className="mt-4 flex flex-col items-center gap-1">
        <ChineseText>你好，欢迎学习中文。</ChineseText>
        <Pinyin>Nǐ hǎo, huānyíng xuéxí Zhōngwén.</Pinyin>
        <Translation>Hello, welcome to learning Chinese.</Translation>
      </div>

      <Caption>
        Database: {healthCheck ? healthCheck.status : "unavailable"}
      </Caption>
    </main>
  );
}
