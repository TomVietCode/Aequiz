-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" INTEGER,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "timeTaken" INTEGER,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "practiceMode" BOOLEAN NOT NULL DEFAULT false,
    "timedMode" BOOLEAN NOT NULL DEFAULT false,
    "customTimeLimit" INTEGER,
    "autoAdvance" BOOLEAN NOT NULL DEFAULT false,
    "autoAdvanceTime" INTEGER,
    "userId" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attempts_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "question_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_attempts" ("autoAdvance", "autoAdvanceTime", "completedAt", "correctAnswers", "customTimeLimit", "id", "isCompleted", "practiceMode", "questionSetId", "score", "startedAt", "timeTaken", "timedMode", "totalQuestions", "userId") SELECT "autoAdvance", "autoAdvanceTime", "completedAt", "correctAnswers", "customTimeLimit", "id", "isCompleted", "practiceMode", "questionSetId", "score", "startedAt", "timeTaken", "timedMode", "totalQuestions", "userId" FROM "attempts";
DROP TABLE "attempts";
ALTER TABLE "new_attempts" RENAME TO "attempts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
