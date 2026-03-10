"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const ComingSoonSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Fake API success
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail("");
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1200);
  };

  const features = [
    { 
      title: "Bridal & Groom Wear", 
      desc: "Discover exquisite ethnic wear for all your ceremonies." 
    },
    { 
      title: "Trusted Vendors", 
      desc: "Connect with premium photographers, makeup artists & decorators." 
    },
    { 
      title: "Dream Venues", 
      desc: "Find and book the perfect destination for your big day." 
    },
    { 
      title: "Seamless Planning", 
      desc: "Your all-in-one companion for a stress-free wedding." 
    },
  ];

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-100 overflow-hidden font-sans selection:bg-pink-300 selection:text-white pb-12 pt-8 sm:py-0">
      {/* Decorative Blob Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-[pulse_6s_infinite]"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-[pulse_8s_infinite]"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-[pulse_7s_infinite]"></div>

      {/* Subtle Ethnic Pattern Overlay (Mandala / Floral Inspiration) */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-1.66 1.66-.83-.83.83-.83zM0 54.627l.83.83-1.66 1.66-.83-.83.83-.83zm58.127-58.127l.83.83-1.66 1.66-.83-.83A1 1 0 0 1 54.627 0h3.5v3.5zm-58.127 58.127l.83.83-1.66 1.66-.83-.83h3.5v3.5a1 1 0 0 1-1.66-1.66zM26.5 0h7v7h-7V0zm0 53h7v7h-7v-7zm26.5-26.5h7v7h-7v-7zm-53 0h7v7h-7v-7zm13.25-13.25h3.5v3.5h-3.5v-3.5zm26.5 26.5h3.5v3.5h-3.5v-3.5zM13.25 39.75h3.5v3.5h-3.5v-3.5zm26.5-26.5h3.5v3.5h-3.5v-3.5zM30 37a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z' fill='%23be185d' fill-opacity='1' fill-rule='evenodd'/%3E")` 
        }}
      ></div>

      {/* Main Content Container */}
      <div 
        className={`relative z-10 w-full max-w-5xl mx-auto px-4 py-4 flex flex-col items-center justify-center text-center transition-all duration-1000 ease-out transform ${
          isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Logo */}
        <div className="mb-6 z-20 flex justify-center">
          <Image 
            src="/mst.jpg" 
            alt="My Shaadi Store Logo" 
            width={100} 
            height={100} 
            className="rounded-full border-2 border-white shadow-md object-cover"
            priority
          />
        </div>

        {/* Launching Soon Badge */} 
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-pink-200 shadow-sm mb-4 md:mb-6 transform hover:scale-105 transition-transform duration-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
          </span>
          <span className="text-xs font-semibold text-pink-700 tracking-widest uppercase">
            Launching Soon
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 md:mb-4 tracking-tight drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-[#4f1659] via-[#4f1659] to-[#c22e5a] py-2">
          My Shaadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c22e5a] via-[#c22e5a] to-[#ed6c11]">Store</span>
        </h1>
        <h2 className="text-xl md:text-2xl font-medium text-gray-700 mb-3 md:mb-4">
          Your Complete Shaadi Solution
        </h2>
        <p className="max-w-2xl text-base md:text-lg text-gray-600 mb-8 md:mb-10 leading-relaxed px-4">
          More than just a destination—we are your all-in-one companion for the perfect Indian wedding. From securing dream venues and curating designer bridal wear, to booking top-rated vendors, we make planning effortless, truly celebrating the magic of your special day.
        </p>

        {/* Features Concept */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full mb-8 md:mb-12 px-2">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="flex flex-col items-center text-center p-4 bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-pink-100 shadow-[0_4px_20px_rgb(236,72,153,0.06)] hover:shadow-[0_4px_20px_rgb(236,72,153,0.15)] hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-1.5">{feature.title}</h3>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Email Notify Form */}


        {/* Footer/Bottom subtle text */}
        <p className="mt-8 text-xs text-gray-400 font-medium">
          Get ready for the grand celebration.
        </p>
      </div>

      {/* Internal Custom Styles for extra animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}} />
    </section>
  );
};

export default ComingSoonSection;
