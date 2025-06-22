"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Clock, CheckCircle, Users } from "lucide-react"
import { useEffect, useState } from "react"
import type { ConfessionStats } from "./types/confession"

interface StatsCardsProps {
  stats: ConfessionStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const [animatedValues, setAnimatedValues] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalUsers: 0,
  })

  useEffect(() => {
    const duration = 2000 // 2 seconds animation
    const steps = 60 // 60 steps for smooth counting
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = Math.min(currentStep / steps, 1) // Ensure we don't exceed 1

      // Use easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      setAnimatedValues({
        total: Math.round(stats.total * easeOutQuart),
        pending: Math.round(stats.pending * easeOutQuart),
        approved: Math.round(stats.approved * easeOutQuart),
        rejected: Math.round(stats.rejected * easeOutQuart),
        totalUsers: Math.round(stats.totalUsers * easeOutQuart),
      })

      if (currentStep >= steps) {
        clearInterval(interval)
        setAnimatedValues({
          total: stats.total,
          pending: stats.pending,
          approved: stats.approved,
          rejected: stats.rejected,
          totalUsers: stats.totalUsers,
        })
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [stats])

  const cards = [
    {
      title: "Total Confessions",
      value: animatedValues.total,
      icon: MessageSquare,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      delay: "0ms",
    },
    {
      title: "Pending Review",
      value: animatedValues.pending,
      icon: Clock,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      delay: "200ms",
    },
    {
      title: "Approved",
      value: animatedValues.approved,
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      delay: "400ms",
    },
    {
      title: "Total Users",
      value: animatedValues.totalUsers,
      icon: Users,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      delay: "600ms",
    },
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card
            key={card.title}
            className="relative overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-500 animate-slide-up group"
            style={{ animationDelay: card.delay }}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {/* Icon */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                  </div>
                </div>

                {/* Title and Value */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{card.value}</span>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
          </Card>
        )
      })}
    </div>
  )
}
