"use client"

import { Hammer, RocketIcon } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"
import { Badge } from "../ui/badge"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="bg-primary/10 border-primary/20 mb-4">
            <RocketIcon className="w-3 h-3 mr-1" />
            The Solution
          </Badge>



          <h2 className="text-4xl lg:text-5xl font-bold text-black mb-4">
            The 5-Minute Promise
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Here's The Workflow. <span className="text-black font-medium">All Of It.</span> This isn't an exaggeration. This is the <em>entire</em> setup process.
          </p>
        </div>

        <div className="relative">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Step 1 */}
            <div className="bg-white lg:mt-8 rounded-2xl p-8 shadow-sm border-5 border-gray-200 backdrop-blur transform relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="mb-6">
                  <span className="text-6xl font-bold text-black">1</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border-primary/20 ml-auto">
                  <span className="text-xs text-primary font-medium">30 seconds</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Clone the Repo</h3>
              <p className="text-gray-600 leading-relaxed">
                Get a clean, local copy of the codebase. No complex installers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border-5 border-gray-200 backdrop-blur transform  relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="mb-6">
                  <span className="text-6xl font-bold text-black">2</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border-primary/20 ml-auto">
                  <span className="text-xs text-primary font-medium">2 minutes</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Add Your Keys</h3>
              <p className="text-gray-600 leading-relaxed">
                Open the .env.local.example file, rename it, and paste in your credentials.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white lg:mt-8 rounded-2xl p-8 shadow-sm border-5 border-gray-200 backdrop-blur relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="mb-6">
                  <span className="text-6xl font-bold text-black">3</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border-primary/20 ml-auto">
                  <span className="text-xs text-primary font-medium">30 seconds</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Run the Dev Server</h3>
              <p className="text-gray-600 leading-relaxed">
                That's it. Your new app is running locally with a database, authentication, and payments ready to go.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-20">
          {/* Success Message - Compact Before→After Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            {/* Compact success caption */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 backdrop-blur-sm px-3 py-1 mb-4">
              <div className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                <Hammer className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm text-gray-700">Ready to build, not deconstruct.</span>
            </div>

            {/* Before → After comparison bar */}
            <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white backdrop-blur-sm">
              <div className="grid grid-cols-2">
                {/* Before */}
                <div className="flex h-16 sm:h-20 items-center justify-center bg-red-50 text-red-600 border-r border-gray-200">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold">8–12 hrs</div>
                    <div className="text-xs text-gray-500">Other boilerplates</div>
                  </div>
                </div>
                {/* After */}
                <div className="flex h-16 sm:h-20 items-center justify-center bg-green-50 text-green-600">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold">5 mins</div>
                    <div className="text-xs text-gray-500">DodoStarter</div>
                  </div>
                </div>
              </div>

              {/* Center divider + arrow */}
              <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500">
                →
              </div>
            </div>
          </div>

          <p className="text-gray-500 mb-6 text-lg">Ready to build, not deconstruct?</p>


        </div>
      </div>
    </section>
  )
}
