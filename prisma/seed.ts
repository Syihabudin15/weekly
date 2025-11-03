// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
  const perms = [
    {
      path: "/dashboard",
      nama: "Dashboard",
      access: ["read"],
    },
    {
      path: "/simulasi",
      nama: "Simulasi",
      access: ["read", "write", "update", "delete"],
    },
    {
      path: "/roles",
      nama: "Manajemen Role",
      access: ["read", "write", "update", "delete"],
    },
    {
      path: "/users",
      nama: "Manajemen User",
      access: ["read", "write", "update", "delete"],
    },
  ];
  const role = await prisma.role.upsert({
    where: { id: "Developer01" },
    create: {
      id: "Developer01",
      name: "Developer",
      permissions: JSON.stringify(perms),
    },
    update: { permissions: JSON.stringify(perms) },
  });

  const pass = await bcrypt.hash("Tsani182", 10);
  await prisma.user.upsert({
    where: { username: "syihabudin" },
    create: {
      name: "Syihabudin Tsani",
      username: "syihabudin",
      password: pass,
      position: "IT",
      roleId: role.id,
    },
    update: {},
  });

  console.log("Seeding succeesfully...");
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
