import { prisma } from "../component/prisma/lib/prisma";
import { hashPassword } from "../love-liberia/lib/password";

async function main() {
  const password = await hashPassword("DemoPassword123!");
  const people = [
    { firstName: "Martha", username: "martha_demo", email: "martha.demo@example.com", gender: "Woman", county: "Montserrado", city: "Monrovia" },
    { firstName: "James", username: "james_demo", email: "james.demo@example.com", gender: "Man", county: "Bong", city: "Gbarnga" },
    { firstName: "Sarah", username: "sarah_demo", email: "sarah.demo@example.com", gender: "Woman", county: "Margibi", city: "Kakata" },
  ];
  for (const person of people) {
    await prisma.user.upsert({ where: { email: person.email }, update: {}, create: { ...person, password, dateOfBirth: new Date("1995-05-15"), country: "Liberia", bio: "Demo profile for local development.", isActive: true, preferences: { create: { interestedIn: "Everyone", minAge: 18, maxAge: 60 } } } });
  }
  const admin = await prisma.user.findUnique({ where: { email: "admin@loveliberia.com" } });
  if (admin) {
    await prisma.blogArticle.upsert({ where: { slug: "welcome-to-love-liberia-magazine" }, update: {}, create: { authorId: admin.id, title: "Welcome to Love Liberia Magazine", slug: "welcome-to-love-liberia-magazine", excerpt: "Practical ideas for meaningful connections and safer dating.", content: "Welcome to Love Liberia Magazine. This development article demonstrates the publishing workflow.", category: "Dating Advice", status: "PUBLISHED", publishedAt: new Date() } });
  }
  console.log("Development seed complete.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
