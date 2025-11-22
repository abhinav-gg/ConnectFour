"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Mail, Shield, Trash2, Eye, EyeOff } from "lucide-react"
import { useError } from "@/components/providers/ErrorProvider"

export function AccountSettings() {
  const { showError, showInfo } = useError()
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [emailData, setEmailData] = useState({
    currentEmail: "user@example.com",
    newEmail: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordUpdate = () => {
    showError("Password update not implemented yet", "error", 4)
  }

  const handleEmailUpdate = () => {
    showError("Email update not implemented yet", "error", 4)
  }

  const handleDeleteAccount = () => {
    showError("Account deletion not implemented yet", "error", 4)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <motion.div className="space-y-8 max-w-3xl" variants={containerVariants} initial="hidden" animate="visible">
      {/* Change Password Section */}
      <motion.div
        variants={itemVariants}
        className="bg-brand-secondary/50 rounded-xl p-6 border border-brand-border"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-brand-accent-green" />
          <h3 className="text-2xl font-bold text-white">Change Password</h3>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <Label htmlFor="current-password" className="text-brand-text-light mb-2 block">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                name="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                placeholder="Enter your current password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="bg-brand-primary border-brand-border text-white placeholder:text-brand-text-muted focus:border-brand-accent-green pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <Label htmlFor="new-password" className="text-brand-text-light mb-2 block">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                placeholder="Enter your new password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="bg-brand-primary border-brand-border text-white placeholder:text-brand-text-muted focus:border-brand-accent-green pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirm-password" className="text-brand-text-light mb-2 block">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirm your new password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="bg-brand-primary border-brand-border text-white placeholder:text-brand-text-muted focus:border-brand-accent-green pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.div className="inline-flex" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handlePasswordUpdate}
              className="bg-brand-accent-green hover:bg-brand-accent-green/90 text-white font-semibold px-6 py-2 rounded-lg transition-all"
            >
              Update Password
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Change Email Section */}
      <motion.div
        variants={itemVariants}
        className="bg-brand-secondary/50 rounded-xl p-6 border border-brand-border"
      >
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-brand-accent-blue" />
          <h3 className="text-2xl font-bold text-white">Email Address</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="current-email" className="text-brand-text-light mb-2 block">
              Current Email
            </Label>
            <Input
              id="current-email"
              value={emailData.currentEmail}
              disabled
              className="bg-brand-primary/50 border-brand-border text-brand-text-muted cursor-not-allowed"
            />
          </div>

          <div>
            <Label htmlFor="new-email" className="text-brand-text-light mb-2 block">
              New Email Address
            </Label>
            <Input
              id="new-email"
              name="newEmail"
              type="email"
              placeholder="Enter your new email address"
              value={emailData.newEmail}
              onChange={handleEmailChange}
              className="bg-brand-primary border-brand-border text-white placeholder:text-brand-text-muted focus:border-brand-accent-blue"
            />
          </div>

          <motion.div className="inline-flex" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleEmailUpdate}
              className="bg-brand-accent-blue hover:bg-brand-accent-blue/90 text-white font-semibold px-6 py-2 rounded-lg transition-all"
            >
              Update Email
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        variants={itemVariants}
        className="bg-red-950/20 rounded-xl p-6 border border-red-900/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h3 className="text-2xl font-bold text-white">Danger Zone</h3>
        </div>

        <p className="text-brand-text-light mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <motion.div className="inline-flex" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-all"
          >
            Delete Account
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
