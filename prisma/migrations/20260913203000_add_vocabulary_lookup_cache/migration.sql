-- Persist Han Vocabulary results so identical lookups are generated once and
-- reused across learners, server restarts, and deployments.
CREATE TABLE "VocabularyLookupCache" (
    "id" TEXT NOT NULL,
    "normalizedInput" TEXT NOT NULL,
    "hskLevel" INTEGER NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "promptVersion" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyLookupCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VocabularyLookupCache_normalizedInput_hskLevel_locale_promptVersion_key"
ON "VocabularyLookupCache"("normalizedInput", "hskLevel", "locale", "promptVersion");

CREATE INDEX "VocabularyLookupCache_updatedAt_idx"
ON "VocabularyLookupCache"("updatedAt");
