-- Atributos avançados de capacidade da empresa (Módulo 1.B do PRD).
-- Habilitam filtros de busca por porte, modalidade de atendimento e
-- segmentos de cliente atendidos.
ALTER TABLE "Company" ADD COLUMN "companySize" TEXT;
ALTER TABLE "Company" ADD COLUMN "deliveryMode" TEXT;
ALTER TABLE "Company" ADD COLUMN "targetSegments" JSONB;
