"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Zap, Smartphone, Brain, Palette, Globe, Shield } from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      title: "Next.js 15 + TypeScript",
      description: "App Router, Server Components, and full TypeScript support for modern React development.",
      icon: <Zap className="h-6 w-6" />,
      tags: ["App Router", "TypeScript"]
    },
    {
      title: "Supabase",
      description: "PostgreSQL database with built-in authentication, real-time subscriptions, and edge functions.",
      icon: <Brain className="h-6 w-6" />,
      tags: ["Auth", "PostgreSQL"]
    },
    {
      title: "Tailwind CSS + shadcn/ui",
      description: "Utility-first CSS with beautiful, accessible components that you actually own.",
      icon: <Palette className="h-6 w-6" />,
      tags: ["Utility-First", "Components"]
    },
    {
      title: "DodoPayments",
      description: "Simple, developer-friendly payment processing with webhooks and subscription management.",
      icon: <Smartphone className="h-6 w-6" />,
      tags: ["Payments", "Webhooks"]
    },
    {
      title: "Battle-Tested",
      description: "Every tool has been proven in production by thousands of developers.",
      icon: <Shield className="h-6 w-6" />,
      tags: ["Production", "Proven"]
    },
    {
      title: "Future-Proof",
      description: "Built on web standards and maintained by companies you can trust.",
      icon: <Globe className="h-6 w-6" />,
      tags: ["Standards", "Trusted"]
    },
  ]

  return (
    <section id="features" className="px-4 py-20 ">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="text-sm text-gray-600 font-medium">Tech Stack</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-design-black mb-4 ">
            Just the Good Stuff.
            <br />
            Zero Fluff.
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-tight mb-4 ">
            Every choice was made to maximize your control and minimize complexity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>

        {/* Why These Choices */}
        <div className="mt-16 pt-8 border-t border-gray-200 max-w-4xl mx-auto">
          <h4 className="text-2xl font-bold text-design-black mb-8 text-center">Why These Choices?</h4>
          <div className="grid gap-6 md:grid-cols-3 text-center">
            <div className="p-6 rounded-xl border border-gray-200 bg-white">
              <Shield className="w-8 h-8 text-design-black mx-auto mb-3" />
              <h5 className="font-bold text-design-black mb-2">Battle-Tested</h5>
              <p className="text-sm text-gray-600">
                Every tool has been proven in production by thousands of developers.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 bg-white">
              <Globe className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h5 className="font-bold text-design-black mb-2">Future-Proof</h5>
              <p className="text-sm text-gray-600">
                Built on web standards and maintained by companies you can trust.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 bg-white">
              <Zap className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h5 className="font-bold text-design-black mb-2">Developer Joy</h5>
              <p className="text-sm text-gray-600">
                Excellent documentation, great DX, and active communities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const Feature = ({
  title,
  description,
  icon,
  index,
  tags,
}: {
  title: string
  description: string
  icon: React.ReactNode
  index: number
  tags?: string[]
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-gray-200",
        (index === 0 || index === 3) && "lg:border-l border-gray-200",
        index < 3 && "lg:border-b border-gray-200",
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-gray-100 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-gray-100 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-gray-600">{icon}</div>
      <div className="text-xl font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-gray-300 group-hover/feature:bg-design-black transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-design-black ">
          {title}
        </span>
      </div>
      <p className="text-md text-gray-600 max-w-xs relative z-10 px-10 mb-3">{description}</p>
      {tags && (
        <div className="flex flex-wrap gap-2 relative z-10 px-10">
          {tags.map((tag, tagIndex) => (
            <span key={tagIndex} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border border-gray-200">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}