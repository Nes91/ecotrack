import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed de base...");

  // Création d'un agent vide (mission peut être ajoutée après via l'API)
  const agentPassword = await bcrypt.hash('changeme', 10);
  const agent = await prisma.user.create({
    data: {
      firstName: 'Agent',
      lastName: 'Exemple',
      email: 'agent@example.com',
      password: agentPassword,
      role: 'AGENT',
      gamifications: {
        create: {
          points: 0,
          level: 1,
          badges: []
        }
      }
      // missions laissées vides pour ne pas créer de données mockées
    }
  });

  console.log("✅ Agent créé :", agent.id);

  // Création d'un citoyen vide
  const citizenPassword = await bcrypt.hash('changeme', 10);
  const citizen = await prisma.user.create({
    data: {
      firstName: 'Citoyen',
      lastName: 'Exemple',
      email: 'citizen@example.com',
      password: citizenPassword,
      role: 'CITIZEN',
      gamifications: {
        create: {
          points: 0,
          level: 1,
          badges: []
        }
      }
    }
  });

  console.log("✅ Citoyen créé :", citizen.id);

  console.log("🌱 Seed terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
