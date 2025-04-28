// Simple utility to hash a password
const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node hash-password.js <password>');
    process.exit(1);
  }
  
  const password = process.argv[2];
  try {
    const hashedPassword = await hashPassword(password);
    console.log('Password:', password);
    console.log('Hashed:', hashedPassword);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();