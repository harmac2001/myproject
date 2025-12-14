const passport = require("passport");
const BearerStrategy = require('passport-azure-ad').BearerStrategy;

const tenantID = process.env.AZURE_TENANT_ID;
const clientID = process.env.AZURE_CLIENT_ID;

const options = {
    identityMetadata: `https://login.microsoftonline.com/${tenantID}/v2.0/.well-known/openid-configuration`,
    clientID: clientID,
    validateIssuer: false,
    loggingLevel: 'info',
    loggingNoPII: false,
    passReqToCallback: false,
    // Accept tokens for the App ID (GUID) OR the App URI (api://GUID)
    audience: [clientID, `api://${clientID}`],
};

const bearerStrategy = new BearerStrategy(options, (token, done) => {
    // Verifies that the token was sent by the client
    console.log("Token received for user: ", token.preferred_username || token.oid);
    return done(null, token, token);
});

module.exports = {
    bearerStrategy,
};
