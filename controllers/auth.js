const oauthService = require('../services/authService');
const { encrypt } = require('../utils/crypt');
const handleError = require('../utils/errorHandler');

/**
 * Redirects the user to providers's OAuth login page
 * @param {Request} req 
 * @param {Response} res 
 */
const signIn = (req, res) => {
  console.log('Entered SignIn Controller');
  try {
    const provider = req.params.provider;

    const authUrl = oauthService.getAuthUrl(provider);

    // Redirect user to the OAuth provider's authorization page
    console.log(`Redirecting to ${provider}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error Occurred in sign In', error);
    return handleError(res, 500, 'Internal error', error.message || 'Please try again later');
  }
};

/**
 * Handles the callback from Outlook after successful authentication
 * @param {Request} req 
 * @param {Response} res 
 */
const callback = async (req, res) => {
  console.log('Entered callback Controller');
  const { code, error, error_description } = req.query;
  const provider = req.params.provider;

  if (!code) {
    // If there is no code, an authentication error has occurred
    console.error('Authentication has failed');
    return handleError(res, 401, error, error_description || 'Authentication failed');
  }

  try {
    // Fetch access token and register the user
    const { accessToken, email, userId } = await oauthService.getAccessToken(code, provider);

    req.session.access_token = encrypt(accessToken);
    req.session.user_id = userId;
    req.session.email = email;
    console.log('Redirecting to dashboard');
    res.redirect(`/api/dashboard/${provider}/index?user_id=${userId}`);
  } catch (error) {
    console.error('Error Occurred in callback', error);
    return handleError(res, 500, 'Internal error', error.message || 'Please try again later');
  }
};

module.exports = {
  signIn,
  callback,
}