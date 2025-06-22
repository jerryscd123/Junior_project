import Link from "next/link"
import EmergencyCards from "./emergency-cards"
import HeroSection from "./hero-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <HeroSection />

      <div className="max-w-auto">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#1d2b7d]">Emergency Contact Numbers</h2>
          <p className="text-slate-600">
            If you or someone you know is in crisis, please use these resources to get immediate help.
          </p>
        </div>

        <EmergencyCards />

        <div className="my-20 relative">
          <div className="absolute inset-0 bg-[#1d2b7d]/5 rounded-3xl -z-10" />
          <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#1d2b7d]" />
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#1d2b7d]/5 rounded-full" />

              <h2 className="text-2xl font-bold text-[#1d2b7d] mb-6">Need Someone To Talk To?</h2>
              <p className="text-slate-600 mb-6">
                Mental health professionals are available 24/7 to provide support during difficult times. Do not hesitate
                to reach out - you are not alone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#emergency-contacts"
                  className="bg-[#1d2b7d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1d2b7d]/90 transition-colors text-center"
                >
                  Call Now
                </Link>
                <Link
                  href="#resources"
                  className="hover:text-[#ffff] bg-[#1d2b7d] text-[#ffff] px-6 py-3 rounded-lg font-medium hover:bg-[#1d2b7d]/80 transition-colors text-center"
                >
                  Find Resources
                </Link>
              </div>
            </div>
          </div>
        </div>

       
      </div>
    </main>
  )
}
