'use client'

import { Button } from '@/components/ui/button'
import { Share2, Download } from 'lucide-react'

interface ChangelogActionsProps {
  title: string
  content: string
}

export function ChangelogActions({ title, content }: ChangelogActionsProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this changelog: ${title}`,
          url: window.location.href
        })
      } catch (error) {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${title.replace(/[^a-z0-9]/gi, '_')}_changelog.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        size="sm"
        className="border-white/20 text-white hover:bg-white/10"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="border-white/20 text-white hover:bg-white/10"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  )
} 