// "use client";

// import { useEffect } from "react";

// declare global {
//   interface Window {
//     FB: any;
//     fbAsyncInit: any;
//   }
// }

// const WhatsAppSignup = () => {
//   useEffect(() => {
//     const loadFacebookSDK = () => {
//       if (typeof window === "undefined" || window.FB) return;
//       const script = document.createElement("script");
//       script.src = "https://connect.facebook.net/en_US/sdk.js";
//       script.async = true;
//       script.defer = true;
//       script.crossOrigin = "anonymous";
//       script.onload = initializeFacebookSDK;
//       document.body.appendChild(script);
//     };

//     const initializeFacebookSDK = () => {
//       if (!window.FB) return;
//       window.fbAsyncInit = function () {
//         window.FB.init({
//           appId: "861922029178906",
//           autoLogAppEvents: true,
//           xfbml: true,
//           version: "v22.0",
//         });
//       };
//     };

//     loadFacebookSDK();

//     const handleMessageEvent = (event: MessageEvent) => {
//       if (
//         event.origin !== "https://www.facebook.com" &&
//         event.origin !== "https://web.facebook.com"
//       )
//         return;

//       try {
//         const data = JSON.parse(event.data);
//         if (data.type === "WA_EMBEDDED_SIGNUP") {
//           console.log("Signup response: ", data);
//         }
//       } catch (error) {
//         console.error("Error processing event data:", error);
//       }
//     };

//     window.addEventListener("message", handleMessageEvent);
//     return () => window.removeEventListener("message", handleMessageEvent);
//   }, []);

//   const launchWhatsAppSignup = () => {
//     if (!window.FB) {
//       console.error("Facebook SDK not loaded yet.");
//       return;
//     }

//     window.FB.login(
//       (response: any) => {
//         if (response.authResponse) {
//           console.log("Login successful: ", response.authResponse.code);
//         } else {
//           console.log("Login failed: ", response);
//         }
//       },
//       {
//         config_id: "623853433903922",
//         response_type: "code",
//         override_default_response_type: true,
//         extras: {
//           setup: {},
//           featureType: "",
//           sessionInfoVersion: "3",
//         },
//       }
//     );
//   };

//   return (
//     <button
//       onClick={launchWhatsAppSignup}
//       style={{
//         backgroundColor: "#1877f2",
//         border: "0",
//         borderRadius: "4px",
//         color: "#fff",
//         cursor: "pointer",
//         fontFamily: "Helvetica, Arial, sans-serif",
//         fontSize: "16px",
//         fontWeight: "bold",
//         height: "40px",
//         padding: "0 24px",
//       }}
//     >
//       Login with Facebook
//     </button>
//   );
// };

// export default WhatsAppSignup;

// app/login/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Key, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Invalid credentials");
        return;
      }

      document.cookie = "isAuthenticated=true; path=/; max-age=86400";
      router.push("/message");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <User className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                name="username"
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm">
          Don't have an account?{' '}
          <a href="/register" className="text-green-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}