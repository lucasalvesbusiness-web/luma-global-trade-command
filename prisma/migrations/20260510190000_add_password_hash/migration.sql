-- Email + senha: armazena hash bcrypt. Nullable porque usuários do seed
-- antigo (era magic link) podem não ter senha até definirem uma.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
