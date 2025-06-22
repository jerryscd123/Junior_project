"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, MapPin, Phone, AlertCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useUserMessages } from "@/store/hooks/useMessages"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [showSuccess, setShowSuccess] = useState(false)

  // Redux integration for message handling
  const { sendNewMessage, sendLoading, error, clearErrorState } = useUserMessages()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Clear any previous errors and success state
      clearErrorState()
      setShowSuccess(false)
      
      // Send message using Redux action
      const result = await sendNewMessage({
        subject: formData.subject,
        content: formData.message,
      })
      
      // Check if the action was successful
      if (result.meta.requestStatus === 'fulfilled') {
        // Reset form on success
        setFormData({ name: "", email: "", subject: "", message: "" })
        setShowSuccess(true)
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      }
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearErrorState()
    }
  }, [clearErrorState])

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (formData.subject || formData.message)) {
      clearErrorState()
    }
  }, [formData.subject, formData.message, error, clearErrorState])

  // Clear success message when user starts typing a new message
  useEffect(() => {
    if (showSuccess && (formData.subject || formData.message)) {
      setShowSuccess(false)
    }
  }, [formData.subject, formData.message, showSuccess])

  return (
    <div className="min-h-screen bg-gradient-to-b rounded-2xl from-[#0d3895] to-[#ffff] py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get In Touch</h1>
          <p className="text-white max-w-3xl mx-auto text-lg">
            Have questions about our community guidelines? Need clarification on a specific rule? Our support team is
            here to help you understand and navigate our educational community standards.
          </p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row">
            {/* Contact Information */}
            <motion.div
              className="bg-[#1d2b7d] text-white p-8 md:p-12 md:w-2/5 relative overflow-hidden"
              initial={{ x: -80, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <p className="mb-8 opacity-90">
                  Our dedicated support team is ready to assist you with any questions about our community rules and
                  guidelines.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center">
                    <Phone className="w-6 h-6 mr-4" />
                    <div>
                      <p>+1 (855) 172-76477</p>
                      <p>+1 (855) 172-76477</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Mail className="w-6 h-6 mr-4" />
                    <p>mindspeak@paragoniu.edu.kh</p>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 mr-4" />
                    <p>PhnomPenh, CAMBODIA</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#162058] rounded-full -mr-32 -mb-32 opacity-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#162058] rounded-full -mr-16 -mt-16 opacity-30"></div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              className="p-8 md:p-12 md:w-3/5"
              initial={{ x: 80, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              {/* Success Alert */}
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <div className="text-green-800">
                    <p className="font-medium">Message sent successfully!</p>
                    <p className="text-sm text-green-600">We&apos;ll get back to you soon.</p>
                  </div>
                </motion.div>
              )}

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <div className="text-red-800">
                    <p className="font-medium">Failed to send message</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-500 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={sendLoading}
                      className="w-full px-4 py-3 border-b border-gray-300 focus:border-[#1d2b7d] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Testing Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-1">
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={sendLoading}
                      className="w-full px-4 py-3 border-b border-gray-300 focus:border-[#1d2b7d] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-500 mb-1">
                    Your Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    disabled={sendLoading}
                    className="w-full px-4 py-3 border-b border-gray-300 focus:border-[#1d2b7d] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="I need help understanding a guideline"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-500 mb-1">
                    Message
                  </label>
                  <div className="relative">
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={sendLoading}
                      rows={4}
                      className="w-full px-4 py-3 border-b border-gray-300 focus:border-[#1d2b7d] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Write here your message"
                    ></textarea>
                    <div className="absolute bottom-3 right-3 w-6 h-6 text-yellow-500 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.24 2.52v-.08L10.05 0l2.81 2.43v.08l-2.81 2.44-2.81-2.43zm5.54 3.37v-.08l2.82-2.44 2.81 2.43v.09l-2.81 2.43-2.82-2.43zm-5.54 8.96v-.08l2.81-2.44 2.81 2.44v.08l-2.81 2.43-2.81-2.43zm-5.53-4.48v-.09l2.81-2.43 2.81 2.43v.09l-2.81 2.43-2.81-2.43zm16.61 0v-.09l2.81-2.43 2.81 2.43v.09l-2.81 2.43-2.81-2.43z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <motion.button
                    type="submit"
                    disabled={sendLoading}
                    whileHover={{ scale: sendLoading ? 1 : 1.05 }}
                    whileTap={{ scale: sendLoading ? 1 : 0.95 }}
                    className="bg-[#1d2b7d] hover:bg-white hover:text-[#1d2b7d] border text-white font-medium py-3 px-8 rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1d2b7d] disabled:hover:text-white"
                  >
                    {sendLoading ? "Sending..." : "Send Message"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}