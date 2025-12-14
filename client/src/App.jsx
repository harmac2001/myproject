import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import { InteractionStatus, InteractionType } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";
import IncidentList from './components/IncidentList';
import IncidentDetails from './components/IncidentDetails';
import PrintableSheet from './components/PrintableSheet';

import { SignOutButton } from "./components/SignOutButton";
import { FetchInterceptor } from "./components/FetchInterceptor";
import './index.css';

function Header() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">IMS</h1>
      {activeAccount ? (
        <div className="flex items-center gap-4">
          <span>Welcome {activeAccount.name}</span>
          <SignOutButton />
        </div>
      ) : (
        <div className="text-sm text-gray-500">Not signed in</div>
      )}
    </header>
  );
}

function App() {
  const { instance, inProgress, accounts } = useMsal();

  useEffect(() => {
    // Manual Auto-Login replaced by useEffect
  }, [inProgress, accounts, instance]);

  return (
    <Router>
      <FetchInterceptor />
      <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <main>
            <div className="bg-white shadow rounded-lg p-6">
              <MsalAuthenticationTemplate
                interactionType={InteractionType.Redirect}
                authenticationRequest={loginRequest}
                loadingComponent={() => <div className="p-10 text-center">Redirecting to login...</div>}
              >
                <Routes>
                  <Route path="/" element={<IncidentList />} />
                  <Route path="/incident/:id" element={<IncidentDetails />} />
                  <Route path="/incident/:id/print" element={<PrintableSheet />} />
                </Routes>
              </MsalAuthenticationTemplate>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
