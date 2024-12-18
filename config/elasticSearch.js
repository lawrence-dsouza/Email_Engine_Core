const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URI,  // Your Elasticsearch endpoint
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD
  }
});

const createIndices = async () => {
  // Create index for email messages
  await esClient.indices.create({
    index: 'email',
    body: {
      "mappings": {
        "properties": {
          "user_id": { "type": "keyword" },  // Unique ID for the user
          "uid": { "type": "long" },  // Unique ID of the email
          "email_id": { "type": "keyword" },  // Unique ID for the email message
          "subject": { "type": "text" },
          "body": { "type": "text" },
          "sender": { "type": "keyword" },
          "receiver": { "type": "keyword" },
          "received_at": { "type": "date" },
          "read_status": { "type": "boolean" },  // Mark if the email is read or not
          "folder": { "type": "keyword" },        // Folder (Inbox, Sent, etc.)
          "flag": { "type": "keyword" }
        }
      }
    },
  }, { ignore: [400] }); // Ignore 'Index already exists' error

  // Create index for mailbox details
  await esClient.indices.create({
    index: 'mailbox',
    body: {
      "mappings": {
        "properties": {
          "user_id": { "type": "keyword" },  // Unique user identifier
          "inbox": { "type": "integer" },
          "sent": { "type": "integer" },
          "drafts": { "type": "integer" },
          "deleted": { "type": "integer" },
          "junk": { "type": "integer" }
        }
      }
    },
  }, { ignore: [400] }); // Ignore 'Index already exists' error
}

// Function to check if the Elasticsearch cluster is up
const pingElasticsearch = async () => {
  try {
    // Attempt to ping the Elasticsearch cluster
    const response = await esClient.ping();
    if (response) {
      console.log('Connected to Elasticsearch');
      await createIndices();
    }
    else {
      throw new Error('Elasticsearch cluster is down!');
    }
  } catch (error) {
    console.error('Elasticsearch cluster is down!');
    console.error(error);
    process.exit(1); // Exit if connection fails
  }
};

module.exports = { esClient, pingElasticsearch };