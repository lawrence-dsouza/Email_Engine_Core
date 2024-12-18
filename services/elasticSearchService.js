const { esClient } = require('../config/elasticSearch');

const findEmails = async (offset, emailsPerPage, userId, folder) => {
  const data = await esClient.search({
    index: 'email',
    from: offset, // Calculate the starting index for pagination
    size: emailsPerPage, // Set the size of the results (5 emails per page)
    query: {
      bool: {
        must: [
          { match: { user_id: userId } },
          { match: { folder: folder } }
        ]
      }
    }
  });
  return data.hits.hits;
};

const getFolderCount = async (userId) => {
  const response = await esClient.get({
    index: 'mailbox',
    id: userId
  });

  return response._source;
};

const createMailBox = (userId, folders) => {
  return esClient.index({
    index: 'mailbox',
    id: userId,
    body: folders,
  });
}

const storeEmailMessage = async (userId, email) => {
  const emailData = {
    user_id: userId,
    uid: email.uid,
    email_id: email.messageId,
    subject: email.subject,
    body: email.body,
    sender: email.from,
    receiver: email.to,
    received_at: email.receivedDate,
    read_status: email.flag === 'SEEN',
    folder: email.folder,
    flag: email.flag,
  };

  return await esClient.index({
    index: 'email',
    id: email.messageId,
    body: emailData,
  });
};

const updateMailBox = async (userId, folderName, totalEmails) => {
  const folderKey = folderName.toLowerCase();

  return await esClient.update({
    index: 'mailbox',
    id: userId,
    body: {
      doc: {
        [folderKey]: totalEmails,
      },
    },
    upsert: {
      user_id: userId,
      [folderKey]: totalEmails,
    },
  });
};

const getMaxUid = async (userId, folder) => {
  try {
    const response = await esClient.search({
      index: 'email',
      size: 0, // No documents returned, only aggregation
      query: {
        bool: {
          must: [
            { match: { user_id: userId } },
            { match: { folder } }
          ]
        }
      },
      aggs: {
        max_uid: {
          max: {
            field: 'uid'
          }
        }
      }
    });
    const maxUid = response.aggregations.max_uid.value;
    return maxUid || 0; // Return 0 if no UIDs are found
  } catch (error) {
    console.error('Error fetching max UID:', error);
    throw error;
  }
};

const updateEmail = async (emailId, userId, folder, doc) => {
  try {
    // First, find the document by user_id and email_id
    const searchResponse = await esClient.search({
      index: 'email',
      body: {
        query: {
          bool: {
            must: [
              { match: { _id: emailId } },
              { match: { user_id: userId } },
              { match: { folder } }
            ]
          }
        }
      }
    });

    // Check if any documents were returned
    if (searchResponse.hits.total.value === 0) {
      console.log(`No document found for user_id: ${userId} and email_id: ${emailId}`);
      return;
    }

    await esClient.update({
      index: 'email',
      id: emailId,  // Document ID
      body: {
        doc,  // The document fields to update
      }
    });
  } catch (error) {
    console.error('Error updating email status:', error);
  }
};

module.exports = {
  storeEmailMessage,
  findEmails,
  getMaxUid,
  updateMailBox,
  createMailBox,
  updateEmail,
  getFolderCount,
}
