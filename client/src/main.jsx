import {createRoot} from 'react-dom/client'
import {PublicClientApplication} from "@azure/msal-browser";
import {MsalProvider} from "@azure/msal-react";
import {msalConfig} from "./authConfig";
import './index.css'
import App from './App.jsx'

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL and then render the app
msalInstance.initialize().then(() => {
  // Optional: Handle the redirect promise manually if needed, 
  // but usually let MsalProvider/useMsal handle it or do it here to ensure state is clean.
  // Using msal-browser v3+, initialize() should be enough, but let's be explicit and log.
  msalInstance.handleRedirectPromise().then((tokenResponse) => {
    if (tokenResponse) {
      console.log("Redirect success:", tokenResponse);
    }

    // Check if there is an active account, if not, try to set the first available account
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
      console.log("Set active account:", accounts[0].username);
    }
  }).catch(error => {
    console.error("Redirect error:", error);
  }).finally(() => {
    createRoot(document.getElementById('root')).render(
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    );
  });
});
