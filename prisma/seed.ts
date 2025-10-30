import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
	const cats = [
		{ name: 'Storia', colorHex: '#ffe28a' },
		{ name: 'Geografia', colorHex: '#8be2ff' },
		{ name: 'Scienza', colorHex: '#aaffbe' },
		{ name: 'Arte', colorHex: '#ff9ad2' },
		{ name: 'Sport', colorHex: '#f68e8e' },
		{ name: 'Spettacolo', colorHex: '#bfa6ff' },
	];
	for (const c of cats) {
		await prisma.quizCategory.upsert({
			where: { name: c.name },
			update: {},
			create: c,
		});
	}
	console.log('Categorie inserite');
}

main().finally(() => prisma.$disconnect());