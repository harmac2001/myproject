import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";
import { loginRequest } from "../authConfig";

const originalFetch = window.fetch;

export const FetchInterceptor = () => {
    const { instance, accounts } = useMsal();


    useEffect(() => {
        window.fetch = async (...args) => {
            let [resource, config] = args;

            // Only add token to relative URLs (API calls)
            let shouldAttachToken = false;
            // Robust check for relative or absolute paths to our own origin
            if (typeof resource === 'string') {
                if (resource.startsWith('/') || resource.startsWith(window.location.origin)) {
                    shouldAttachToken = true;
                }
            }

            // Get account dynamically to avoid closure staleness
            const activeAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];

            if (shouldAttachToken && activeAccount) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: activeAccount
                    });

                    config = config || {};
                    config.headers = config.headers || {};

                    if (config.headers instanceof Headers) {
                        config.headers.append('Authorization', `Bearer ${response.accessToken}`);
                    } else {
                        config.headers['Authorization'] = `Bearer ${response.accessToken}`;
                    }
                    args[1] = config;
                } catch (error) {
                    console.error("Token acquisition failed", error);
                }
            }

            return originalFetch(...args);
        };

        return () => {
            window.fetch = originalFetch;
        }
    }, [instance]); // Removed 'account' and 'accounts' dependency to prevent constant repatching

    return null;
};
