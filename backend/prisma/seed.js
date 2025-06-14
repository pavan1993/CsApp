"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                name: 'John Smith',
                email: 'john.smith@acme.com',
                company: 'Acme Corporation',
                healthScore: 8,
                status: client_1.CustomerStatus.ACTIVE,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@techstart.io',
                company: 'TechStart Inc',
                healthScore: 9,
                status: client_1.CustomerStatus.ACTIVE,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Mike Davis',
                email: 'mike.davis@globalcorp.com',
                company: 'Global Corp',
                healthScore: 6,
                status: client_1.CustomerStatus.ACTIVE,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Emily Chen',
                email: 'emily.chen@innovate.co',
                company: 'Innovate Co',
                healthScore: 7,
                status: client_1.CustomerStatus.ACTIVE,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'David Wilson',
                email: 'david.wilson@enterprise.net',
                company: 'Enterprise Solutions',
                healthScore: 4,
                status: client_1.CustomerStatus.INACTIVE,
            },
        }),
    ]);
    console.log(`✅ Created ${customers.length} customers`);
    const interactions = [];
    for (const customer of customers) {
        const interactionCount = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < interactionCount; i++) {
            const interactionTypes = Object.values(client_1.InteractionType);
            const randomType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
            const interaction = await prisma.interaction.create({
                data: {
                    type: randomType,
                    subject: `${randomType.toLowerCase().replace('_', ' ')} with ${customer.name}`,
                    description: `Sample ${randomType.toLowerCase().replace('_', ' ')} interaction`,
                    outcome: Math.random() > 0.5 ? 'Positive' : 'Neutral',
                    customerId: customer.id,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                },
            });
            interactions.push(interaction);
        }
    }
    console.log(`✅ Created ${interactions.length} interactions`);
    console.log('🎉 Database seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map