-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionText" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "questionType" TEXT DEFAULT 'single',
    "codeBlock" TEXT,
    "explanation" TEXT,
    "passageText" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "questionSetId" TEXT NOT NULL,
    CONSTRAINT "questions_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "question_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("correctAnswer", "createdAt", "explanation", "id", "options", "orderIndex", "passageText", "questionSetId", "questionText", "updatedAt") SELECT "correctAnswer", "createdAt", "explanation", "id", "options", "orderIndex", "passageText", "questionSetId", "questionText", "updatedAt" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
CREATE TABLE "new_user_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selectedOption" TEXT NOT NULL,
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
