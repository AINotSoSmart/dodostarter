"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What's included in this Next.js boilerplate?",
      answer:
        "This boilerplate includes a complete SaaS foundation with Next.js 15, TypeScript, Supabase authentication, credit system, payment integration via DodoPayments, CSRF protection, rate limiting, SEO optimization, dynamic breadcrumbs, skeleton loading, and a responsive dashboard. Everything you need to launch your SaaS quickly.",
    },
    {
      question: "How does the credit system work?",
      answer:
        "The credit system provides comprehensive user credit management with real-time updates, payment integration, and secure server-side validation. Users can purchase credits through DodoPayments, and you can easily deduct credits for API calls or feature usage with automatic UI updates.",
    },
    {
      question: "Is this boilerplate secure?",
      answer:
        "Yes! Security is built-in with CSRF protection for all forms, optional rate limiting via Upstash Redis, server-side validation, secure authentication through Supabase, and configurable security settings. All sensitive operations are protected and validated.",
    },
    {
      question: "How do I customize the SEO settings?",
      answer:
        "SEO is fully configurable through the centralized config/seo.ts file. You can customize titles, descriptions, keywords, social media cards, structured data, and more. The system uses Next.js 13+ Metadata API with automatic sitemap and robots.txt generation.",
    },
    {
      question: "Can I disable certain features I don't need?",
      answer:
        "Absolutely! Features like rate limiting, CSRF protection, and credit system are modular. You can disable rate limiting by removing Upstash environment variables, skip CSRF protection for specific forms, or remove the credit system entirely if not needed.",
    },
    {
      question: "How does the payment integration work?",
      answer:
        "Payments are handled through DodoPayments with seamless credit purchasing. The system includes pre-built payment pages, success handling, webhook integration, and automatic credit allocation. Users can buy credits that are immediately available in their account.",
    },
    {
      question: "What's the skeleton loading system?",
      answer:
        "The skeleton loading system provides professional loading states for all pages. It includes three different skeleton layouts (PageSkeleton, SimplePageSkeleton, ListPageSkeleton) with smart page detection and context-based loading management for a smooth user experience.",
    },
    {
      question: "How do I add CSRF protection to my forms?",
      answer:
        "CSRF protection is simple: wrap your page with CSRFProvider, add CSRFInput to your forms, and validate the token in your server actions. The system provides reusable components and clear documentation for easy implementation.",
    },
    {
      question: "Is the dashboard mobile-responsive?",
      answer:
        "Yes! The entire application is built with responsive design using Tailwind CSS and shadcn/ui components. The dashboard adapts perfectly to all screen sizes with collapsible sidebars, mobile-optimized navigation, and touch-friendly interfaces.",
    },
    {
      question: "How do I set up rate limiting?",
      answer:
        "Rate limiting is optional and easy to set up. Create a free Upstash Redis database, add the REST URL and token to your environment variables, and rate limiting will be automatically enabled. You can customize limits in the config/security.ts file.",
    },
    {
      question: "What database does this use?",
      answer:
        "The boilerplate uses Supabase as the database and authentication provider. Supabase offers PostgreSQL with real-time subscriptions, built-in authentication, row-level security, and a generous free tier. All database operations are type-safe with TypeScript.",
    },
    {
      question: "Can I customize the UI components?",
      answer:
        "Yes! The UI is built with shadcn/ui components and Tailwind CSS, making customization straightforward. All components are in the components/ui directory and can be easily modified. The design system is consistent and follows modern UI patterns.",
    },
  ]

  return (
    <section className="px-4 pt-24 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 mb-6">
            <HelpCircle className="w-4 h-4 mr-2" />
            Got Questions?
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-black mb-6">Frequently asked questions</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about using this Next.js SaaS boilerplate to build your application.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* First Column */}
          <div className="space-y-4">
            {faqs.slice(0, 6).map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200"
              >
                <button
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <h3 className="text-lg font-semibold text-black pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Second Column */}
          <div className="space-y-4">
            {faqs.slice(6).map((faq, index) => {
              const actualIndex = index + 6;
              return (
                <div
                  key={actualIndex}
                  className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200"
                >
                  <button
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setOpenIndex(openIndex === actualIndex ? null : actualIndex)}
                  >
                    <h3 className="text-lg font-semibold text-black pr-4">{faq.question}</h3>
                    <div className="flex-shrink-0">
                      {openIndex === actualIndex ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </button>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      openIndex === actualIndex ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="px-8 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
      </div>
    </section>
  )
}