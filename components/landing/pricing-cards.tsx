"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"

export default function PricingCards() {
  const [lightFastDelivery, setLightFastDelivery] = useState(false)
  const [darkFastDelivery, setDarkFastDelivery] = useState(false)

  const LightCheckIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="8" fill="#111827" />
      <path d="M5.5 8.5L7 10L11 6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const DarkCheckIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="7.5" stroke="#4B5563" />
      <path d="M5.5 8.5L7 10L11 6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )



  const starterFeatures = [
    "Next.js 15 + TypeScript",
    "Supabase Authentication",
    "DodoPayments Integration",
    "Dashboard Components",
    "SEO Optimized",
    "Mobile Responsive"
  ]

  const proFeatures = [
    "Everything in Starter",
    "Priority Support",
    "Source Code Access",
    "Lifetime Updates",
    "Commercial License",
    "1000 Credits Included"
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center font-sans">
      
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[820px]">
      {/* Starter Plan - Light Card */}
      <div className="bg-gray-100 rounded-3xl p-2 shadow-[0_12px_50px_-15px_rgba(0,0,0,0.1)] border border-gray-200/60 flex flex-col">
        <div className="bg-white rounded-2xl p-8 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Starter</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Popular</span>
          </div>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            Perfect boilerplate to launch your SaaS quickly with essential features.
          </p>
          <div className="flex items-baseline mb-8">
            <span className="text-5xl font-bold text-gray-900 tracking-tighter">$99</span>
            <span className="text-gray-400 text-lg ml-1">one-time</span>
          </div>
          <button className="w-full bg-[#111827] text-white py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.2)]">
            Get Starter Plan
            <Calendar className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="bg-gray-100 px-6 pb-6 pt-4 flex-grow flex flex-col">
          <div className="grid grid-cols-1 gap-y-3 mb-auto">
            {starterFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <LightCheckIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-gray-700 text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Credits Included:</span>
              <span className="font-semibold text-gray-900">100 Credits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Plan - Dark Card */}
      <div className="bg-[#262626] rounded-3xl p-2 shadow-[0_12px_50px_-15px_rgba(0,0,0,0.25)] flex flex-col">
        <div className="bg-[#2C2C2E] rounded-2xl p-8 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Pro</h2>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Best Value</span>
          </div>
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            Complete boilerplate with advanced features and premium support.
          </p>
          <div className="flex items-baseline mb-8">
            <span className="text-5xl font-bold text-white tracking-tighter">$299</span>
            <span className="text-gray-500 text-lg ml-1">one-time</span>
          </div>
          <button className="w-full bg-white text-gray-900 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_-5px_rgba(255,255,255,0.2)]">
            Get Pro Plan
            <Calendar className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-grow flex flex-col px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 gap-y-3 mb-auto">
            {proFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <DarkCheckIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-gray-300 text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Credits Included:</span>
              <span className="font-semibold text-white">1000 Credits</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Credit Rate:</span>
              <span className="font-semibold text-white">$0.01/credit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
