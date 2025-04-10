import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import { useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

export default function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
          f*ck Subscriptions
        </h1>
        <p className="text-xl text-black">
          stop getting poor
          <br />
          <br />  
          and making big tech rich
          <br />     
          <br />
          never forget to unsub ever!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <FeatureCard
          title="Simple, Private"
          description={[
            { bold: true, text: "No ads, no peeking your bank info" },
            { bold: false, text: "export to excel anytime" },
          ]}
        />

        <FeatureCard
          title="Our deal:"
          description={[
            { bold: true, text: "Pay us $10/month" },
            {
              bold: false,
              text: "Save over $50/mo* on the subscriptions that you forgot",
            },
          ]}
        />

        <FeatureCard
          title="Cancel made simple"
          description={[
            { bold: true, text: "help you find the unsubscribe button" },
            { bold: false, text: "cancel has never been easier" },
          ]}
        />
      </div>

      <div className="mb-16 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8 border border-indigo-100 shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-4">Subscription Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free plan */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-2">Free Plan</h3>
            <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-gray-500">/month</span></p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Up to 10 subscriptions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Basic analytics</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>CSV export</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Email reminders</span>
              </li>
            </ul>
            <Button
              onClick={handleGetStarted}
              variant="outline"
              className="w-full border-black text-black hover:bg-gray-100"
            >
              Get Started
            </Button>
          </div>
          
          {/* Premium plan (highlighted) */}
          <div className="bg-gradient-to-b from-purple-600 to-indigo-600 rounded-lg p-6 border border-indigo-500 shadow-md transform md:scale-110">
            <div className="bg-yellow-400 text-xs font-bold px-3 py-1 rounded-full text-indigo-800 inline-block mb-2">BEST VALUE</div>
            <h3 className="text-lg font-bold mb-2 text-white">Premium Plan</h3>
            <p className="text-3xl font-bold mb-4 text-white">$10<span className="text-sm font-normal text-indigo-200">/month</span></p>
            <ul className="mb-6 space-y-2 text-white">
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span><strong>Unlimited</strong> subscriptions</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>CSV import/export</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>Cancel assistance</span>
              </li>
            </ul>
            <Button
              onClick={() => navigate("/sign-up?plan=premium")}
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold"
            >
              Get Premium
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleGetStarted}
          className="bg-black text-white font-bold py-3 px-8 rounded-md hover:bg-gray-800 transition duration-300"
        >
          GET STARTED FREE
        </Button>
        
        <Button
          onClick={() => navigate("/sign-up?plan=premium")}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-md hover:from-purple-700 hover:to-indigo-700 transition duration-300"
        >
          GO PREMIUM $10/MONTH
        </Button>
      </div>
      

    </div>
  );
}
