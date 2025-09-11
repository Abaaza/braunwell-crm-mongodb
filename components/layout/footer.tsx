import { Heart } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>© {currentYear}</span>
          <a 
            href="https://braunwell.co.uk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-1 hover:text-foreground underline underline-offset-2"
          >
            Braunwell
          </a>
          <span className="mx-2">•</span>
          <span>Built with</span>
          <Heart className="ml-1 h-3 w-3 fill-red-500 text-red-500" />
        </div>
      </div>
    </footer>
  )
}