const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv); // AES encryption
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Return IV + encrypted token (joined with ':')
}

const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts[0], 'hex'); // Extract the IV from the encrypted text
  const encryptedText = textParts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
}