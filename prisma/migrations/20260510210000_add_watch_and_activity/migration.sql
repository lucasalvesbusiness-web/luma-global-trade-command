CREATE TABLE "CompanyWatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watcherCompanyId" TEXT NOT NULL,
    "watchedCompanyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyWatch_watcherCompanyId_fkey" FOREIGN KEY ("watcherCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyWatch_watchedCompanyId_fkey" FOREIGN KEY ("watchedCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CompanyWatch_watcherCompanyId_watchedCompanyId_key" ON "CompanyWatch"("watcherCompanyId", "watchedCompanyId");
CREATE INDEX "CompanyWatch_watchedCompanyId_idx" ON "CompanyWatch"("watchedCompanyId");

CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "actorCompanyId" TEXT NOT NULL,
    "subjectCompanyId" TEXT,
    "dealRoomId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityEvent_actorCompanyId_fkey" FOREIGN KEY ("actorCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_subjectCompanyId_fkey" FOREIGN KEY ("subjectCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");
CREATE INDEX "ActivityEvent_actorCompanyId_createdAt_idx" ON "ActivityEvent"("actorCompanyId", "createdAt");
