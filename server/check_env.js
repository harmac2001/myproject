const path = require("path");
const dotenv = require("dotenv");
const envPath = path.join(__dirname, "../.env");
console.log("Loading env from:", envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error("Error loading .env:", result.error);
} else {
    console.log("Parsed keys:", Object.keys(result.parsed));
}
console.log("AZURE_CLIENT_ID:", process.env.AZURE_CLIENT_ID ? "Is Set" : "NOT SET");
console.log("VITE_AZURE_CLIENT_ID:", process.env.VITE_AZURE_CLIENT_ID ? "Is Set" : "NOT SET");
