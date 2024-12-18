const { decrypt } = require('../utils/crypt');
const handleError = require('../utils/errorHandler');

const { getMailBoxCount, getFolderMails } = require('../services/dashBoardService');

const mailBoxCount = async (req, res) => {
  console.log('Entered Mail Box Count');
  const provider = req.params.provider;
  const accessToken = decrypt(req.session.access_token);
  const userId = req.session.user_id;
  const email = req.session.email;

  try {
    const folderCounts = await getMailBoxCount(provider, email, accessToken, userId);
    console.log('folderCounts', folderCounts);

    // Render the inbox view with the folder counts
    res.render('inbox', {
      folderTitle: 'Inbox',
      emails: [],
      folderCounts: folderCounts,
      access_token: accessToken,
      user_id: userId,
      email,
      provider,
    });
  } catch (error) {
    console.error('Error occurred in mailBoxCount', error);
    return handleError(res, 500, 'Internal error', error.message || 'Please try again later');
  }
}

const folderMails = async (req, res) => {
  console.log('Entered Mail Box Folder');
  const provider = req.params.provider;
  const accessToken = decrypt(req.session.access_token);
  const userId = req.session.user_id;
  const email = req.session.email;
  const folder = req.params.folderName;

  const page = parseInt(req.query.page) || 1;  // Default to page 1
  console.log('Page:', page);
  try {
    const response = await getFolderMails(provider, email, accessToken, userId, folder, page);
    return res.json({
      emails: response.emails,
      totalEmails: response.totalEmails,
      currentPage: page,
      emailsPerPage: response.emailsPerPage,
    });
  } catch (error) {
    console.error('Error Occurred in folderMails', error);
    return handleError(res, 500, 'Internal error', error.message || 'Please try again later');
  }
}

module.exports = {
  mailBoxCount,
  folderMails
}