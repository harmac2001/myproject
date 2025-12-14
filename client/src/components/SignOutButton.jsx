import React from "react";
import { useMsal } from "@azure/msal-react";

/**
 * Renders a sign-out button
 */
export const SignOutButton = () => {
    const { instance } = useMsal();

    const handleLogout = (instance) => {
        instance.logoutRedirect({
            postLogoutRedirectUri: "/",
        });
    };

    return (
        <button
            className="ml-auto bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => handleLogout(instance)}
        >
            Sign Out
        </button>
    );
};
