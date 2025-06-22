"use client"

import { useState, useEffect } from "react"
import { Phone, AlertTriangle, Heart } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function EmergencyCards() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const cards = [
    {
      title: "National Emergency",
      description: "Call the national emergency number for immediate assistance",
      number: "119",
      color: "bg-[#1d2b7d]",
      icon: AlertTriangle,
      image: "https://images.unsplash.com/photo-1599700403969-f77b3aa74837?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      delay: 0,
    },
    {
      title: "Mental Health Hotline",
      description: "Cambodia Mental Health Support Line",
      number: "017 276 477",
      color: "bg-[#1d2b7d]",
      icon: Phone,
      image: "https://images.unsplash.com/photo-1604881991720-f91add269bed?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      delay: 0.1,
    },
    {
      title: "TPO Cambodia",
      description: "Specialized mental health support",
      number: "017 276 477",
      color: "bg-[#1d2b7d]",
      icon: Heart,
      image: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      delay: 0.2,
    },
  ]

  return (
    <div id="emergency-contacts" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: card.delay }}
          className="rounded-xl overflow-hidden  shadow-lg group"
        >
          <div className="relative h-48">
            <Image
              src={card.image || "user"}
              alt={card.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1d2b7d] to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h3 className="text-xl font-bold mb-1">{card.title}</h3>
              <p className="text-white/80 text-sm">{card.description}</p>
            </div>
          </div>

          <div className="p-6 bg-white">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1d2b7d]/10 flex items-center justify-center mr-4">
                <card.icon className="h-6 w-6 text-[#1d2b7d]" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Emergency Number</p>
                <p className="text-xl font-bold text-[#1d2b7d]">{card.number}</p>
              </div>
            </div>

            <button className="w-full py-3 bg-[#1d2b7d] text-white rounded-lg hover:bg-[#1d2b7d]/90 transition-colors">
              Call Now
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
