const axios = require('axios');
const querystring = require('querystring');

const jwt = require('../utils/jwt');
const config = require('../config/oauthProviders');
const { findOrCreateUser } = require('../repository/user');

const getAuthUrl = (provider) => {
  const providerConfig = config[provider];

  if (!providerConfig) {
    console.error('Provider not supported');
    throw new Error('Provider not supported');
  }

  const authUrl = `${providerConfig.authURL}?${querystring.stringify({
    client_id: providerConfig.clientID,
    redirect_uri: providerConfig.callbackURL,
    response_type: 'code',
    scope: providerConfig.scope,
    // state: 'random_state_string', // Optional: use state for security purposes
    access_type: 'offline', // Optional: For refresh tokens
  })}`;

  return authUrl;
};

const getAccessToken = async (code, provider) => {
  const providerConfig = config[provider];

  if (!providerConfig) {
    throw new Error('Provider not supported');
  }

  try {
    const response = await axios.post(providerConfig.tokenURL, querystring.stringify({
      client_id: providerConfig.clientID,
      client_secret: providerConfig.clientSecret,
      redirect_uri: providerConfig.callbackURL,
      code,
      grant_type: 'authorization_code',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Authorization code recieved');

    const accessToken = response.data.access_token;
    const idToken = response.data.id_token;
    const data = jwt.decode(idToken);
    
    const { email } = data;

    const userId = await findOrCreateUser(email, provider, accessToken);
    console.log(`User registered successfully ${userId}`);

    return { accessToken, idToken, email, userId };
  } catch (error) {
    console.log(error);
    throw new Error(error.message || 'Error exchanging code for token');
  }
};

module.exports = { getAuthUrl, getAccessToken };

