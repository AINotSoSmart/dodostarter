import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-8 px-6 mt-auto border-t border-gray-200">
      <div className="max-w-4xl mx-auto w-full">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 font-medium mb-4 md:mb-0">
            © {new Date().getFullYear()} DodoStarter by Harvansh Chaudhary. All rights reserved.
          </div>
          
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
            <Link 
              href="/terms" 
              className="text-gray-600 hover:text-design-black transition-colors font-mono"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-600 hover:text-design-black transition-colors font-mono"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/refund" 
              className="text-gray-600 hover:text-design-black transition-colors font-mono"
            >
              Refund Policy
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-design-black transition-colors font-mono"
            >
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}