'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'

export default function FloatingWA() {
  return (
    <a
      href={`${WHATSAPP_URL}?text=Halo%20Kionix%2C%20saya%20ingin%20konsultasi`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-wa-green hover:bg-wa-hover text-white rounded-full p-4 shadow-lg transition-colors"
      >
        <MessageCircle size={28} />
      </motion.div>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-bg-dark text-text-on-dark text-xs font-sans font-semibold px-3 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        Chat Sekarang
      </span>
    </a>
  )
}
