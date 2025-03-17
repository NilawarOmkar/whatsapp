"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

const WhatsAppSignup = () => {
  useEffect(() => {
    const loadFacebookSDK = () => {
      if (typeof window === "undefined" || window.FB) return;
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onload = initializeFacebookSDK;
      document.body.appendChild(script);
    };

    const initializeFacebookSDK = () => {
      if (!window.FB) return;
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "861922029178906",
          autoLogAppEvents: true,
          xfbml: true,
          version: "v22.0",
        });
      };
    };

    loadFacebookSDK();

    const handleMessageEvent = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      )
        return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("Signup response: ", data);
        }
      } catch (error) {
        console.error("Error processing event data:", error);
      }
    };

    window.addEventListener("message", handleMessageEvent);
    return () => window.removeEventListener("message", handleMessageEvent);
  }, []);

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      console.error("Facebook SDK not loaded yet.");
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          console.log("Login successful: ", response.authResponse.code);
        } else {
          console.log("Login failed: ", response);
        }
      },
      {
        config_id: "623853433903922",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  return (
    <button
      onClick={launchWhatsAppSignup}
      style={{
        backgroundColor: "#1877f2",
        border: "0",
        borderRadius: "4px",
        color: "#fff",
        cursor: "pointer",
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: "16px",
        fontWeight: "bold",
        height: "40px",
        padding: "0 24px",
      }}
    >
      Login with Facebook
    </button>
  );
};

export default WhatsAppSignup;
