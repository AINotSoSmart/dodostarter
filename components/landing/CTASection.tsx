import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-br from-black via-gray-900 to-black p-16 overflow-hidden">

    {/* Diagonal Grid with Light */}
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 20px),
        repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 20px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  
 

          {/* Content */}
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Stop Building Infrastructure.
             <br /> Start Building Products.</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get the foundation you need to focus on what makes your product unique.
            </p>

            <Link href="/login">
              <Button 
              variant="secondary"
              className="text-md py-6 group relative overflow-hidden"
              >
                Start Tracking for Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
