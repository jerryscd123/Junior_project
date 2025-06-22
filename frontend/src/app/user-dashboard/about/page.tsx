"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TeamSection from "./team-section";

// Define new image URLs
const heroImages = {
  image1: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0",
  image2: "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0",
  image3: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0",
  image4: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0"
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 bg-white text-[#1d2b7d] dark:text-white">
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <TeamSection />
        <NewsletterSection />
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="py-16 brightness-110 mt-9 md:py-24">
      <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.1 }}
    className="aspect-[3/4] relative shadow-lg shadow-gray-600 overflow-hidden rounded-2xl"
  >
    <Image
              src={heroImages.image1}
      alt="Students discussing"
      width={300}
      height={400}
      className="object-cover w-full h-full rounded-2xl"
    />
  </motion.div>

  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="aspect-[3/4] relative shadow-lg shadow-gray-600 overflow-hidden rounded-2xl mt-12"
  >
    <Image
              src={heroImages.image2}
      alt="Students collaborating"
      width={300}
      height={400}
      className="object-cover w-full h-full rounded-2xl"
    />
  </motion.div>

  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
    className="aspect-[3/4] relative shadow-lg shadow-gray-600 overflow-hidden rounded-2xl"
  >
    <Image
              src={heroImages.image3}
      alt="University campus"
      width={300}
      height={400}
      className="object-cover w-full h-full rounded-2xl"
    />
  </motion.div>

  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.4 }}
    className="aspect-[3/4] relative shadow-lg shadow-gray-600 overflow-hidden rounded-2xl mt-12"
  >
    <Image
              src={heroImages.image4}
      alt="Student group"
      width={300}
      height={400}
      className="object-cover w-full h-full rounded-2xl"
    />
  </motion.div>
</div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center max-w-3xl mx-auto mt-16"
        >
          <h2 className="text-3xl md:text-4xl dark:text-green-400 font-bold mb-6">
            We Are Building A Safe Space for University Students
          </h2>
          <p className="text-gray-700 dark:text-gray-400 text-lg">
            At UniConfess, we are creating a platform where university students
            can share their thoughts, experiences, and feelings anonymously. Our
            platform provides a judgment-free zone where students can express
            themselves authentically and find support from peers facing similar
            challenges.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    {
      value: "10,000+",
      label: "Active Users",
      icon: <Users className="h-6 w-6 text-blue-200" />,
    },
    {
      value: "50,000+",
      label: "Confessions Shared",
      icon: <MessageSquare className="h-6 w-6 text-blue-200" />,
    },
    {
      value: "25+",
      label: "Universities",
      icon: <Building className="h-6 w-6 text-blue-200" />,
    },
    {
      value: "98%",
      label: "Anonymity Rate",
      icon: <ShieldCheck className="h-6 w-6 text-blue-200" />,
    },
  ];

  return (
    <section className="py-24 container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-[#1d2b7d] to-[#1d2b7d] dark:from-[#1d2b7d] dark:to-[#1d2b7d] rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="grid md:grid-cols-2 items-center relative z-10">
          <div className="p-10 md:p-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-white leading-tight">
                Trusted by Students Across the Country
              </h2>
              <p className="text-blue-100 mb-10 text-lg">
                Join thousands of university students who have found relief,
                connection, and community through anonymous confessions.
              </p>
              <Button
                className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-8 py-6 text-base font-medium shadow-lg hover:shadow-white/20 transition-all duration-300"
                asChild
              >
                <Link href="/join">
                  Join Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="bg-blue-700/30 backdrop-blur-sm p-10 md:p-16 h-full">
            <div className="grid grid-cols-2 gap-10">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-200">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="py-20 rounded-3xl bg-[#1d2b7d]">
      <div className="container mx-auto px-4 relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-lg rotate-12 overflow-hidden hidden md:block">
          <Image
            src={heroImages.image2}
            alt="Students collaborating"
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-lg -rotate-12 overflow-hidden hidden md:block">
          <Image
            src={heroImages.image3}
            alt="University campus"
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl text-white md:text-4xl font-bold mb-6">
            We have Helped More Than
            <br />
            10,000+ University Students
          </h2>
          <p className="text-white mb-8">
            Subscribe to our newsletter & get free tips & resources about mental
            health and university life.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter Your Email Here"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button className="bg-white text-[#1d2b7d] hover:bg-gray-100">
              Subscribe Now
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
