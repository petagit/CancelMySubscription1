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
            { bold: true, text: "Pay us $15 month" },
            {
              bold: false,
              text: "Save over $50/mo* on the subcription that you forgot",
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

      <div className="flex justify-center">
        <Button
          onClick={handleGetStarted}
          className="bg-black text-white font-bold py-3 px-8 rounded-md hover:bg-gray-800 transition duration-300"
        >
          GET STARTED
        </Button>
      </div>
      

    </div>
  );
}
