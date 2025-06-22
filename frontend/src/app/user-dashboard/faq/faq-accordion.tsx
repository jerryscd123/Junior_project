"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { FAQ } from "@/store/types/faq"

interface FaqAccordionProps {
  faq: FAQ
  index: number
}

export default function FaqAccordion({ faq, index }: FaqAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="border-b border-slate-100 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 px-6 text-left focus:outline-none"
      >
        <span className="font-medium text-slate-900 pr-8">{faq.question}</span>
        <div
          className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
            isOpen ? "bg-[#1d2b7d]" : "bg-slate-100"
          }`}
        >
          {isOpen ? (
            <Minus className={`h-3 w-3 ${isOpen ? "text-white" : "text-slate-500"}`} />
          ) : (
            <Plus className={`h-3 w-3 ${isOpen ? "text-white" : "text-slate-500"}`} />
          )}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-slate-600">{faq.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
