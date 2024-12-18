const handleError = require('../utils/errorHandler');

const authHandler = (req, res, next) => {
  const accessToken = req.session?.access_token;
  const userId = req.session?.user_id;

  if (!(accessToken && userId)) {
    console.error('Unauthorized');
    return handleError(res, 401, 'Unauthorized', 'You don\'t have permission to access this page. Please log in again.')
  }
  console.log('Authorized');
  next();
};

module.exports = authHandler;
