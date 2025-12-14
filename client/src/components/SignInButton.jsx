import React, {useEffect, useState} from "react";
import {useMsal} from "@azure/msal-react";
import {InteractionStatus} from "@azure/msal-browser";
import {loginRequest} from "../authConfig";

/**
 * Renders a drop down button with child buttons for logging in with a popup or redirect
 */
export const SignInButton = () => {
    const { instance, inProgress } = useMsal();
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        setDisabled(inProgress !== InteractionStatus.None);
    }, [inProgress]);

    const handleLogin = (instance) => {
        if (inProgress === InteractionStatus.None) {
            instance.loginRedirect(loginRequest).catch((e) => {
                console.error(e);
            });
        }
    };

    return (
        <button
            className={`ml-auto font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}`}
            onClick={() => handleLogin(instance)}
            disabled={disabled}
        >
            Sign In
        </button>
    );
};
