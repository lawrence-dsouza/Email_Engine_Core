const handleError = (res, statusCode, statusMessage, errorMessage) => {
  console.error(`${statusCode} - ${statusMessage}: ${errorMessage}`);

  // Render the error page with the provided message
  return res.status(statusCode).render('error', {
    statusCode,
    statusMessage,
    errorMessage,
  });
};

module.exports = handleError;