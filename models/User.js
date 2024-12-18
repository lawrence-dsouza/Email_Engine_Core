const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypt');

// Define the user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  access_token: { type: String, required: true },
  provider: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

userSchema.pre('save', function (next) {
  if (this.isModified('access_token') || this.isNew) {
    try {
      // Encrypt the access_token before saving it
      this.access_token = encrypt(this.access_token);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

function decryptTokens(documents) {
  if (Array.isArray(documents)) {
    // If it's an array of documents, decrypt each one's access_token
    documents.forEach(doc => {
      if (doc && doc.access_token) {
        doc.access_token = decrypt(doc.access_token);
      }
    });
  } else if (documents && documents.access_token) {
    // If it's a single document, decrypt the access_token
    documents.access_token = decrypt(documents.access_token);
  }
  return documents;
}

userSchema.post('find', function (documents, next) {
  decryptTokens(documents);
  next();
});

userSchema.post('findOne', function (document, next) {
  decryptTokens(document);
  next();
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;