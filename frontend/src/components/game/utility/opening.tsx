"use client"

import { motion } from "framer-motion"
import { ChevronUp } from "lucide-react"
import { remark } from "remark"
import html from "remark-html"
import { useEffect, useState } from "react"

interface OpeningDescriptionProps {
  openingName?: string
  description?: string
  onClose?: () => void
  showCloseButton?: boolean
}

export function OpeningDescription({
  openingName = "Loading...",
  description = "Loading...",
  onClose,
  showCloseButton = true,
}: OpeningDescriptionProps) {
  const [htmlContent, setHtmlContent] = useState<string>("")

  useEffect(() => {
    const processMarkdown = async () => {
      try {
        const result = await remark().use(html).process(description)
        setHtmlContent(result.toString())
      } catch (error) {
        console.error("Error processing markdown:", error)
        setHtmlContent(`<p>${description}</p>`)
      }
    }

    processMarkdown()
  }, [description])

  return (
    <motion.div
      className="bg-brand-primary/40 rounded-lg p-6 text-white h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-xl font-semibold text-white">{openingName}</h3>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-500/50 hover:bg-slate-500/70 flex items-center justify-center transition-colors duration-200"
            aria-label="Close opening description"
          >
            <ChevronUp className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Description Content */}
      <div className="flex-1 overflow-y-auto">
        <div 
          className="text-slate-200 leading-relaxed text-base prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </motion.div>
  )
}
