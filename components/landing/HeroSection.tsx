import { Button } from "@/components/ui/button"
import { Upload, Sparkles, Eye } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative mx-auto pb-12 overflow-hidden min-h-screen">

      {/* Paper Texture */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0),
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
      `,
          backgroundSize: "8px 8px, 32px 32px, 32px 32px",
        }}
      />


      <div className="px-4 py-12 pt-32 max-w-6xl mx-auto text-center">
        <div className="relative z-10 space-y-6">
          <div className="space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Ship faster with DodoStarter
            </div>
            <h1 className="text-4xl sm:text-7xl font-bold text-gray-800 leading-[1.1]">
              Launch Your Next Project
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 font-[family-name:var(--font-instrument-serif)] tracking-normal leading-[1.05]">
                  This Afternoon
                </span>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-tight">
              A brutally simple Next.js boilerplate with auth and a clean one-time payment setup. Go from a blank folder to a working app in the time it takes to brew your coffee...
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <Link href="/dashboard">
              <Button
                className="text-md py-6 group relative overflow-hidden w-full sm:w-auto "
              >
                Try it Now
              </Button>
            </Link>
            <Link href="https://github.com/AINotSoSmart/dodostarter">
              <Button
                variant="secondary"
                className="text-md py-6 group relative overflow-hidden w-full sm:w-auto"
              >
                View on Github
              </Button>
            </Link>
          </div>
          <div className="flex flex-col items-center space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                <img
                  src="/avatar5.webp"
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/avatar3.webp"
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/avatar2.webp"
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/avatar6.webp"
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="/avatar1.webp"
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
                <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">12+</span>
                </div>
              </div>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-gray-600 font-medium">Trusted by 11+ developers</p>
          </div>



        </div>
      </div>
    </section>
  )
}
