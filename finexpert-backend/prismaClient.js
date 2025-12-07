const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

let prisma = global.__prisma;

if (!prisma) {
	prisma = new PrismaClient();
	global.__prisma = prisma;
}

module.exports = prisma;
