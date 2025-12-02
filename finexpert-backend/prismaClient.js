const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

let prisma = global.__prisma;

if (!prisma) {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const adapter = new PrismaPg(pool);
	prisma = new PrismaClient({ adapter });
	global.__prisma = prisma;
}

module.exports = prisma;
