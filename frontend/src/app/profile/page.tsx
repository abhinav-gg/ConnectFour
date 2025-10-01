"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User } from "lucide-react"
import { useError } from "@/components/providers/ErrorProvider"

export default function ProfilePage() {
  const router = useRouter()
  const { showWarning } = useError()

  // Show warning only once when component mounts
  useEffect(() => {
    showWarning("New Profile Page Coming Soon...", 5)
  }, [showWarning])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-primary p-4 flex items-center justify-center">
      <motion.div
        className="max-w-md w-full space-y-6 text-white text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-brand-accent-green hover:bg-brand-accent-green/20 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        {/* Profile Icon */}
        <motion.div
          className="w-24 h-24 mx-auto bg-brand-primary/50 rounded-full flex items-center justify-center mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <User className="w-12 h-12 text-brand-accent-green" />
        </motion.div>

        {/* Coming Soon Message */}
        <motion.div
          className="bg-brand-primary/50 rounded-2xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-bold text-brand-accent-green">
            New Profile Page Coming Soon...
          </h2>
          <p className="text-brand-text-light">
            We're working on an amazing new profile experience for you. Stay tuned for updates!
          </p>
        </motion.div>

        {/* Go Home Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => router.push('/')}
            className="w-full h-12 text-lg font-bold bg-brand-accent-green hover:bg-brand-accent-green/80 text-white rounded-xl"
          >
            Go Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}