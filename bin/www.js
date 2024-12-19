const { pingElasticsearch } = require('../config/elasticSearch');
const { connectMongoDB} = require('../config/mongoDb');

// Asynchronous initialization of MongoDB and Elasticsearch
const startServer = async (server, port) => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect to Elasticsearch and create indices
    await pingElasticsearch();
    
    // After successful connections, start the server
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);  // Exit if connection fails
  }
};

module.exports = startServer;