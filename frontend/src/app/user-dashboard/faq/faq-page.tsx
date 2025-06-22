"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import FaqAccordion from "./faq-accordion"
import FaqCategory from "./faq-category"
import { useFaqs } from "@/store/hooks"
import { useAppDispatch } from "@/store/hooks"
import { fetchFaqs, setFilters } from "@/store/slices/faqSlice"

export default function FaqPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  
  // Redux state
  const dispatch = useAppDispatch()
  const { faqs, loading, error, filters } = useFaqs()

  useEffect(() => {
    setIsVisible(true)
    // Fetch FAQs from API
    dispatch(fetchFaqs({}))
  }, [dispatch])

  // Handle search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== filters.search) {
        dispatch(setFilters({ search: searchQuery || undefined, page: 1 }))
        dispatch(fetchFaqs({ search: searchQuery || undefined, page: 1 }))
      }
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, dispatch, filters.search])

  const categories = [
    { id: "all", name: "All Questions" },
    { id: "counseling", name: "Counseling Services" },
    { id: "support", name: "Support Groups" },
    { id: "resources", name: "Educational Resources" },
    { id: "emergency", name: "Emergency Support" },
  ]

  // Client-side filtering for categories since API might not support category filtering
  const filteredFaqs = faqs.filter((faq) => {
    const searchMatch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    
    // For now, we'll use a simple keyword-based category filter since the API FAQ model doesn't have category field
    const categoryMatch = activeCategory === "all" || 
      faq.question.toLowerCase().includes(activeCategory) ||
      faq.answer.toLowerCase().includes(activeCategory)
    
    return searchMatch && categoryMatch
  })

  return (
<div className="py-20 bg-gradient-to-b from-slate-50 to-white">
  <div className="max-w-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center mb-16"
    >
      <span className="inline-block px-4 py-2 bg-[#1d2b7d]/10 text-[#1d2b7d] rounded-full text-base font-semibold mb-6">
        SUPPORT
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-[#1d2b7d] mb-6">
        Frequently Asked Questions
      </h1>
      <p className="text-lg text-slate-600 max-w-3xl mx-auto">
        Find answers to common questions about our mental health services and resources at Paragon International
        University.
      </p>
    </motion.div>

    {/* Search Bar */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-12 max-w-lg mx-auto"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-6 w-6" />
        <Input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-14 py-3 text-lg border-slate-200 focus:border-[#1d2b7d] focus:ring-[#1d2b7d] rounded-lg"
        />
      </div>
    </motion.div>

    {/* Categories */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-16"
    >
      <div className="flex flex-wrap justify-center gap-4">
        {categories.map((category, index) => (
          <FaqCategory
            key={category.id}
            category={category}
            isActive={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
            delay={index * 0.05}
          />
        ))}
      </div>
    </motion.div>

    {/* FAQ Accordions */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {loading.fetchFaqs ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-[#1d2b7d] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Loading FAQs...</h3>
          <p className="text-lg text-slate-500">
            Please wait while we fetch the latest information
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-red-500 text-2xl">⚠️</div>
          </div>
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Error Loading FAQs</h3>
          <p className="text-lg text-slate-500 mb-6">
            {error}
          </p>
          <button 
            onClick={() => dispatch(fetchFaqs({}))}
            className="px-6 py-3 bg-[#1d2b7d] text-white rounded-lg hover:bg-[#1d2b7d]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredFaqs.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-slate-200">
          {filteredFaqs.map((faq, index) => (
            <FaqAccordion key={faq.id} faq={faq} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">No questions found</h3>
          <p className="text-lg text-slate-500">
            Try adjusting your search terms or category selection
          </p>
        </div>
      )}
    </motion.div>

    {/* Still Have Questions */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-20 max-w-4xl mx-auto"
    >
      <div className="bg-gradient-to-r from-[#1d2b7d] to-[#2a3a9c] rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full">
          <div className="absolute top-[20%] right-[10%] w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-[30%] right-[30%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        </div>
        <div className="p-10 relative z-10">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-6">Still Have Questions?</h3>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              If you could not find the answer you were looking for, please do not hesitate to contact us directly.
            </p>
            <a
              href="mailto:counseling@paragoniu.edu.kh"
              className="inline-flex items-center px-8 py-4 bg-white text-[#1d2b7d] rounded-lg hover:bg-white/90 transition-colors font-medium text-lg"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
</div>
  )
}
