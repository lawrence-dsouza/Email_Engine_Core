const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
const {
  storeEmailMessage,
  getMaxUid,
  createMailBox,
  updateEmail,
} = require('./elasticSearchService');

const providerConfig = require('../config/oauthProviders');

class ImapService {
  constructor(provider, email, accessToken, userId, folder) {
    this.provider = provider;
    this.userId = userId;
    this.folder = folder || 'INBOX';
    const config = {
      user: email,
      xoauth2: this.#generateXOAuth2Token(email, accessToken),
      host: providerConfig[provider].host,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000, // Connection timeout (10 seconds)
      authTimeout: 10000, // Authentication timeout (10 seconds)
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true,
      },
      debug: console.log,
    }
    this.imap = new Imap(config);
  }

  #generateXOAuth2Token(email, accessToken) {
    return Buffer.from(`user=${email}\x01auth=Bearer ${accessToken}\x01\x01`).toString("base64");
  }

  #openBox(folder, callback) {
    this.imap.openBox(folder, true, callback);
  }

  messageParser(msg, messages, parsePromises) {
    let buffer = "";
    msg.on("body", (stream) => {
      stream.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
      });
    });

    msg.once("attributes", (attrs) => {
      console.log(`Flag: ${JSON.stringify(attrs.flags)}`);
      const parsePromise = new Promise((resolveParser, rejectParser) => {
        simpleParser(buffer, async (err, mail) => {
          if (err) {
            console.error(`Error ${err}`);
            return rejectParser(err);
          }
          const { subject, text, from, date } = mail;

          const messageId = attrs.uid.toString();

          const sanitizedText = text;

          let flag = attrs.flags[0]?.replace(/\\/g, "").toUpperCase();
          let message = {
            from: from.value[0].address,
            messageId,
            subject,
            flag: flag ? flag : "UNSEEN",
            folder: this.folder,
            body: sanitizedText,
            receivedDate: date,
            uid: messageId,
          };

          messages.push(message);
          await storeEmailMessage(this.userId, message);
          resolveParser();
        });
      });
      parsePromises.push(parsePromise); // Add the promise to the list
    });
  }

  async fetchInitialEmails(batchIndex) {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        this.#openBox(this.folder, (err, box) => {
          if (err) {
            console.error(`folder: ${this.folder} | Error : ${JSON.stringify(err)}`);
            this.imap.end();
            return reject(err);  // Reject on error
          }

          const totalMessages = box.messages.total;
          console.log(`totalMessages ${totalMessages}`);

          if (totalMessages === 0) {
            this.imap.end();
            return resolve({ messages: [], totalMessages, batch: 0 });  // Resolve with empty messages
          } else {
            // If there are messages, proceed to fetch the batch
            this.fetchBatchEmail(totalMessages, batchIndex).then(resolve).catch(reject);
          }
        });
      });
      this.imap.connect();
    });
  }

  async fetchBatchEmail(totalMessages, batchIndex, endImap = true, batchSize = 5) {
    const parsePromises = [];  // Array to store all parsing promises
    let messages = [];
    const batch = Math.ceil(totalMessages / batchSize);
    const start = batchIndex * batchSize + 1;
    const end = Math.min((batchIndex + 1) * batchSize, totalMessages);
    console.log(`fetch; ${start}:${end}`);

    try {
      return await new Promise((resolve, reject) => {
        const fetch = this.imap.seq.fetch(`${start}:${end}`, { bodies: "" });
        let hasError = false;

        fetch.on("message", (msg) => {
          this.messageParser(msg, messages, parsePromises);
        });

        fetch.once("error", (fetchErr) => {
          if (endImap) this.imap.end();
          hasError = true;
          reject(fetchErr);  // Reject on fetch error
        });

        fetch.once("end", () => {
          if (hasError) return;

          // Wait for all parsing promises to resolve
          Promise.all(parsePromises)
            .then(() => {
              resolve({ messages, totalMessages, batch });  // Resolve with results
            })
            .catch((parseErr) => {
              this.imap.end();
              reject(parseErr);  // Reject on parsing error
            });
        });
      });
    } catch (err) {
      console.error("Error fetching batch emails:", err);
      throw err;  // Rethrow if needed
    }
  }

  async fetchNewEmails() {
    const maxUid = await getMaxUid(this.userId, this.folder);
    console.log('Max UID:', maxUid);

    // Use `maxUid` to fetch only new emails from IMAP
    const criteria = maxUid > 0 ? [["UID", `${maxUid + 1}:*`]] : ['1:*'];
    const fetchOptions = {
      bodies: ["HEADER", "TEXT"],
      struct: true,
    };
    return new Promise((resolve, reject) => {
      this.imap.search(criteria, (err, results) => {
        if (err) return reject(err);

        if (results.length === 0) return resolve([]); // No new emails

        const fetch = this.imap.fetch(results, fetchOptions);
        let messages = [];
        let parsePromises = [];
        fetch.on("message", (msg) => {
          this.messageParser(msg, messages, parsePromises);
        });

        fetch.on("end", () => {
          Promise.all(parsePromises)
            .then(() => {
              console.log(`${JSON.stringify(messages)}`);
              resolve({ messages });
            })
            .catch((parseErr) => {
              console.error(`Error : ${JSON.stringify(parseErr)}`);
              reject(parseErr);
            });
        });
        fetch.on("error", (err) => reject(err));
      });
    });
  }

  async monitor(handleEvent) {
    this.imap.once("ready", () => {
      this.#openBox(this.folder, async (err, box) => {
        if (err) {
          console.error(`folder: ${this.folder} | Error : ${JSON.stringify(err)}`);
          handleEvent('sync-error', 'Error opening folder');
          this.imap.end();
        }
        const totalMessages = box.messages.total;
        console.log(`totalMessages ${totalMessages}`);

        // Sync Mail Starts
        if (totalMessages !== 0) {
          const batchSize = 10;
          const batch = Math.ceil(totalMessages / batchSize);

          // Notify client that synchronization has started
          handleEvent('sync-start', { totalMessages, batchSize });

          for (let i = 0; i < batch; i++) {
            try {
              await this.fetchBatchEmail(totalMessages, i, false, batchSize);
              console.log(`Batch ${i + 1} Completed`);
              handleEvent('sync-progress', { batch: i + 1, totalBatches: batch });
            } catch (error) {
              console.error(`Error: ${err}`);
            }
          }
        }
        // Sync Mail Ends
        handleEvent('sync-complete', { message: 'Sync complete!' });

        this.imap.on('mail', async (numNewMsgs) => {
          console.log(`${numNewMsgs} new message(s) detected.`);
          let newEmails = [];
          try {
            newEmails = await this.fetchNewEmails();
            console.log('Fetched New Email Successfully');
          } catch (error) {
            console.log('Fetching New Email Failed', error);
          }
          handleEvent('email-recieved', newEmails);
        });

        this.imap.on('update', (seqno, info) => {
          console.log(`Message updated: #${seqno} ${info}`);
          const fetch = this.imap.seq.fetch(seqno, { bodies: "" });
          fetch.on("message", (msg) => {
            msg.on("attributes", async (attrs) => {
              console.log(`Updated flags: ${attrs.flags} ${attrs.uid}`);
              let flag = attrs.flags[0]?.replace(/\\/g, "").toUpperCase() || 'UNSEEN';
              const messageId = attrs.uid;
              updateEmail(messageId, this.userId, this.folder, { read_status: flag === 'SEEN', flag });
              handleEvent("email-updated", { messageId, flag, });
            });
          });
        });

        this.imap.on('expunge', (seqno) => {
          console.log(`Message expunged: #${seqno}`);
          const fetch = this.imap.seq.fetch(seqno, { bodies: "" });
          fetch.on("message", (msg) => {
            msg.on("attributes", async (attrs) => {
              console.log(`Updated flags: ${attrs.flags} ${attrs.uid}`);
              let flag = attrs.flags[0]?.replace(/\\/g, "").toUpperCase() || 'UNSEEN';
              const messageId = attrs.uid;
              updateEmail(messageId, this.userId, this.folder, { read_status: flag === 'SEEN', flag, folder: 'deleted' });
              handleEvent("email-deleted", { messageId });
            });
          });
        });
      });
    });

    this.imap.connect();
  }

  async getEmailCountFromFolders(folders) {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', async () => {
        console.log('IMAP connection established.');

        // Function to get email count for a single folder
        const getEmailCountFromFolder = (folder) => {
          return new Promise((resolve, reject) => {
            this.imap.openBox(folder, true, (err, box) => {
              if (err) {
                console.log(`Error opening folder ${folder}:`, err);
                return reject(err); // Reject with error
              }

              const totalEmails = box.messages.total;
              console.log(`Folder: ${folder} - Total emails: ${totalEmails}`);
              resolve({ folder: folder.toLowerCase(), totalEmails }); // Resolve with the folder name and email count
            });
          });
        };

        try {
          // Process all folders asynchronously
          const folderPromises = folders.map((folder) => getEmailCountFromFolder(folder));
          const emailCounts = await Promise.all(folderPromises);

          const result = emailCounts.reduce((acc, { folder, totalEmails }) => {
            acc[folder] = totalEmails;
            return acc;
          }, {});

          // Save the folder counts to the database
          await createMailBox(this.userId, result);
          resolve(result);  // Resolve with the final folder counts
        } catch (err) {
          console.error('Error processing folders:', err);
          reject(err); // Reject with error
        } finally {
          this.imap.end(); // Ensure the connection is closed after processing
        }
      });

      // Error handling for the IMAP connection
      this.imap.once('error', (err) => {
        console.log('IMAP Error:', err);
        reject(err); // Reject on IMAP error
      });

      // Start the IMAP connection
      this.imap.connect();
    });
  }

  // Connect
  connect() {
    console.log('IMAP connection established.');
    this.imap.connect();
  }

  // Close IMAP connection
  close() {
    console.log('IMAP connection closed.');
    this.imap.end();
  }
}

module.exports = ImapService;
