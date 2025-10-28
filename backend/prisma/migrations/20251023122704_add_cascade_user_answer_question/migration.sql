-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selectedOption" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    CONSTRAINT "user_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_answers" ("answeredAt", "attemptId", "id", "isCorrect", "questionId", "selectedOption") SELECT "answeredAt", "attemptId", "id", "isCorrect", "questionId", "selectedOption" FROM "user_answers";
DROP TABLE "user_answers";
ALTER TABLE "new_user_answers" RENAME TO "user_answers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
