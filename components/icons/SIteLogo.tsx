"use client"

import Image from "next/image"
import { useState } from "react"

export function SiteLogo({ className = "w-32 h-8" }: { className?: string }) {
  const [imageSrc, setImageSrc] = useState("/logo.svg")
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setImageSrc("/placeholder.svg")
      setHasError(true)
    }
  }

  return (
    <div className={`flex items-center gap-[1.5px]  ${className}`}>
      <Image
        src={imageSrc}
        alt="DodoStarter.com Logo"
        width={24}
        height={24}
        className="w-7 h-8"
        onError={handleError}
      />
      <span className="text-lg font-bold text-gray-700 font-mono">
        DodoStarter
      </span>
    </div>
  )
}