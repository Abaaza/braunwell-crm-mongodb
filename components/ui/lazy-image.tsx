"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  onLoad?: () => void
  fallbackSrc?: string
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  placeholder = "empty",
  blurDataURL,
  onLoad,
  fallbackSrc = "/images/placeholder.svg",
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.01,
        rootMargin: "50px",
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false)
  }

  const imageSrc = error ? fallbackSrc : src
  const shouldRender = priority || isInView

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        fill ? "w-full h-full" : undefined,
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      {isLoading && (
        <Skeleton 
          className="absolute inset-0" 
          style={{ width: "100%", height: "100%" }}
        />
      )}
      {shouldRender && (
        <Image
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            fill ? "object-cover" : undefined
          )}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
        />
      )}
    </div>
  )
}

/**
 * Avatar component with lazy loading
 */
interface LazyAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function LazyAvatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className,
}: LazyAvatarProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  }

  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  if (!src) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center font-medium",
          sizeClass[size],
          className
        )}
      >
        {fallback}
      </div>
    )
  }

  return (
    <LazyImage
      src={src}
      alt={alt}
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={cn("rounded-full", sizeClass[size], className)}
      fallbackSrc="/images/default-avatar.svg"
    />
  )
}

/**
 * Background image component with lazy loading
 */
interface LazyBackgroundImageProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
  overlay?: boolean
  overlayOpacity?: number
}

export function LazyBackgroundImage({
  src,
  alt = "",
  className,
  children,
  overlay = false,
  overlayOpacity = 0.5,
}: LazyBackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <LazyImage
        src={src}
        alt={alt}
        fill
        className="absolute inset-0 -z-10"
        onLoad={() => setIsLoaded(true)}
      />
      {overlay && isLoaded && (
        <div
          className="absolute inset-0 bg-black -z-10"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children}
    </div>
  )
}