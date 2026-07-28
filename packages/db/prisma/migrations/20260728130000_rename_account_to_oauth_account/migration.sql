-- RenameTable
ALTER TABLE "auth"."Account" RENAME TO "OAuthAccount";

-- RenameConstraint
ALTER TABLE "auth"."OAuthAccount" RENAME CONSTRAINT "Account_pkey" TO "OAuthAccount_pkey";
ALTER TABLE "auth"."OAuthAccount" RENAME CONSTRAINT "Account_userId_fkey" TO "OAuthAccount_userId_fkey";

-- RenameIndex
ALTER INDEX "auth"."Account_provider_providerAccountId_key" RENAME TO "OAuthAccount_provider_providerAccountId_key";
