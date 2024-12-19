const ImapService = require('../services/ImapService');

const {
  findEmails,
  getFolderCount
} = require('../services/elasticSearchService');

const {
  MAIL_FOLDERS,
  EMAILS_PER_PAGE: emailsPerPage
} = require('../constants/constants');

const getMailBoxCount = (provider, email, accessToken, userId) => {
  const imapService = new ImapService(provider, email, accessToken, userId, 'INBOX');
  // Fetch folder counts
  return imapService.getEmailCountFromFolders(MAIL_FOLDERS);
}

const getFolderMails = async (provider, email, accessToken, userId, folder, page) => {
  const offset = (page - 1) * emailsPerPage;
  console.log('offset:', offset);

  // Elasticsearch query to get emails for the specific folder with pagination
  const data = await findEmails(offset, emailsPerPage, userId, folder);
  console.log('Emails Found:', data.length);

  // Get total count of emails in the folder for pagination
  const response = await getFolderCount(userId);
  const totalEmails = response[folder] || 0;
  console.log('Total Emails:', totalEmails);

  // If all emails arent fetched
  if (totalEmails !== offset + data.length && data.length < emailsPerPage) {
    const imapService = new ImapService(provider, email, accessToken, userId, folder);

    // Fetch emails using IMAP service
    const result = await imapService.fetchInitialEmails(page - 1);
    imapService.close();
    if (result?.messages && Object.keys(result.messages).length > 0) {
      console.log(`Fetched ${Object.keys(result.messages).length} emails via IMAP`);
      return {
        emails: result.messages,
        totalEmails: result.totalMessages,
        currentPage: page,
        emailsPerPage,
      };
    } else {
      console.info('No emails fetched via IMAP');
      return {
        emails: [],
        currentPage: page,
        totalEmails: 0,
        emailsPerPage
      };
    }
  } else {
    console.log('fetched from elastic');

    const formattedEmails = data.map(({ _source: { sender, subject, received_at, body } }) => ({
      from: sender,
      subject: subject,
      receivedDate: received_at,
      body: body
    }));

    return {
      emails: formattedEmails,
      totalEmails: totalEmails,
      currentPage: page,
      emailsPerPage
    };
  }
}

module.exports = {
  getMailBoxCount,
  getFolderMails,
}