-- Records when the buyer accepted the Terms of Use + Privacy Policy at signup.
-- LGPD requires evidence of consent; we capture timestamp at acceptance time.
ALTER TABLE "buyer_companies" ADD COLUMN "acceptedTermsAt" TIMESTAMP(3);
