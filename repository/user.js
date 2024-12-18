const User = require('../models/User');

/**
 * Fetch user ID from the database using email.
 * @param {string} email - The email of the user.
 * @returns {Promise<string>} - The user ID.
 */
const findOrCreateUser = async (email, provider, accessToken) => {
  try {
    // Check if the user exists in the database using the email
    const user = await User.findOne({ email });
    if (user) {
      // Return the existing user ID from the database
      return user._id.toString();
    } else {
      // If the user does not exist, create a new user
      const newUser = new User({ email, provider, access_token: accessToken });
      await newUser.save();
      return newUser._id.toString(); // Return the newly created user's ID
    }
  } catch (error) {
    console.error('Error fetching user from DB:', error);
    throw new Error('User not found or unable to create user');
  }
};

module.exports = {
  findOrCreateUser,
}