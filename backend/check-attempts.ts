import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking attempts...\n');
  
  const attempts = await prisma.attempt.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      },
      questionSet: {
        select: {
          title: true,
        }
      }
    },
    orderBy: {
      startedAt: 'desc',
    }
  });

  console.log(`Total attempts: ${attempts.length}\n`);

  attempts.forEach((attempt: any) => {
    console.log(`Attempt ID: ${attempt.id}`);
    console.log(`User: ${attempt.user.name} (${attempt.user.email})`);
    console.log(`Quiz: ${attempt.questionSet.title}`);
    console.log(`Completed: ${attempt.isCompleted}`);
    console.log(`Score: ${attempt.score}%`);
    console.log(`Correct: ${attempt.correctAnswers}/${attempt.totalQuestions}`);
    console.log(`Completed At: ${attempt.completedAt}`);
    console.log('---\n');
  });

  const completedAttempts = await prisma.attempt.findMany({
    where: {
      isCompleted: true,
    }
  });

  console.log(`\nCompleted attempts: ${completedAttempts.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
