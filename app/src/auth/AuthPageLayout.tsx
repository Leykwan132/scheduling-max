import { ReactNode } from "react";
import { Link } from "react-router-dom"; // Using react-router-dom for generic back link
import { ArrowLeft } from "lucide-react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white px-6 py-10 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl sm:px-12">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
