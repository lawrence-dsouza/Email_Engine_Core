module.exports = {
    gmail: {
        clientID: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        callbackURL: process.env.GMAIL_REDIRECT_URI,
        authURL: process.env.GMAIL_AUTH_URL,
        tokenURL: process.env.GMAIL_TOKEN_URL,
        scope: process.env.GMAIL_SCOPE,
        host: process.env.GMAIL_IMAP_HOST
    },
    outlook: {
        clientID: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        callbackURL: process.env.OUTLOOK_REDIRECT_URI,
        authURL: process.env.OUTLOOK_AUTH_URL,
        tokenURL: process.env.OUTLOOK_TOKEN_URL,
        scope: process.env.OUTLOOK_SCOPE,
        host: process.env.OUTLOOK_IMAP_HOST
    }
};