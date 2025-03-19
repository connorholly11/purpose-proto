import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('Seeding initial users...');
  
  // Users to create
  const users = [
    { name: 'Connor' },
    { name: 'Raj' },
    { name: 'Mark' }
  ];
  
  try {
    // First check if users already exist
    const existingUsers = await prisma.user.findMany({
      where: {
        name: {
          in: users.map(u => u.name)
        }
      }
    });
    
    const existingNames = existingUsers.map(u => u.name);
    console.log('Existing users:', existingNames);
    
    // Filter out users that already exist
    const usersToCreate = users.filter(u => !existingNames.includes(u.name));
    
    if (usersToCreate.length === 0) {
      console.log('All users already exist. Nothing to do.');
      return;
    }
    
    // Create the new users
    const createdUsers = await Promise.all(
      usersToCreate.map(user => 
        prisma.user.create({
          data: user
        })
      )
    );
    
    console.log(`Created ${createdUsers.length} new users:`);
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.id})`);
    });
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsers()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed completed');
  }); 