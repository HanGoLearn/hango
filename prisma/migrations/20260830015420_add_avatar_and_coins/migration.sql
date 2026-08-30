-- CreateTable
CREATE TABLE "LearnerAvatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "animal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerAccessoryOwnership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessoryKey" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerAccessoryOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerEquippedAccessory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "accessoryKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerEquippedAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerAvatar_userId_key" ON "LearnerAvatar"("userId");

-- CreateIndex
CREATE INDEX "CoinLedgerEntry_userId_idx" ON "CoinLedgerEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinLedgerEntry_userId_sourceKey_key" ON "CoinLedgerEntry"("userId", "sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerAccessoryOwnership_userId_accessoryKey_key" ON "LearnerAccessoryOwnership"("userId", "accessoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerEquippedAccessory_userId_slot_key" ON "LearnerEquippedAccessory"("userId", "slot");

-- AddForeignKey
ALTER TABLE "LearnerAvatar" ADD CONSTRAINT "LearnerAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinLedgerEntry" ADD CONSTRAINT "CoinLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerAccessoryOwnership" ADD CONSTRAINT "LearnerAccessoryOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerEquippedAccessory" ADD CONSTRAINT "LearnerEquippedAccessory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
