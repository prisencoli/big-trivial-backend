import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categoryName = process.argv[2] || 'The Simpsons';
  
  console.log(`Cercando categoria: "${categoryName}"...`);
  
  // Trova la categoria
  const category = await prisma.quizCategory.findUnique({
    where: { name: categoryName }
  });
  
  if (!category) {
    console.log(`Categoria "${categoryName}" non trovata.`);
    return;
  }
  
  console.log(`Categoria trovata: ID ${category.id}`);
  
  // Trova tutte le domande di questa categoria
  const questions = await prisma.quizQuestion.findMany({
    where: { categoryId: category.id },
    include: { answers: true }
  });
  
  console.log(`Trovate ${questions.length} domande con ${questions.reduce((sum, q) => sum + q.answers.length, 0)} risposte totali.`);
  
  if (questions.length === 0) {
    console.log('Nessuna domanda da eliminare.');
    return;
  }
  
  // Elimina tutte le risposte
  let deletedAnswers = 0;
  for (const question of questions) {
    const count = await prisma.quizAnswer.deleteMany({
      where: { questionId: question.id }
    });
    deletedAnswers += count.count;
  }
  console.log(`Eliminate ${deletedAnswers} risposte.`);
  
  // Elimina tutte le domande
  const deletedQuestions = await prisma.quizQuestion.deleteMany({
    where: { categoryId: category.id }
  });
  console.log(`Eliminate ${deletedQuestions.count} domande.`);
  
  // Opzionale: elimina anche la categoria (commentato per default)
  // const deleteCategory = process.argv[3] === '--delete-category';
  // if (deleteCategory) {
  //   await prisma.quizCategory.delete({
  //     where: { id: category.id }
  //   });
  //   console.log(`Categoria "${categoryName}" eliminata.`);
  // }
  
  console.log('✅ Eliminazione completata!');
}

main()
  .catch((e) => {
    console.error('Errore:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });


