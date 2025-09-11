"use client"

import { useState, useEffect } from 'react'

interface CSRFHook {
  token: string | null
  loading: boolean
  error: string | null
  refreshToken: () => Promise<void>
  getHeaders: () => Record<string, string>
}

export function useCSRF(): CSRFHook {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchToken = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data = await response.json()
      setToken(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching CSRF token:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async (): Promise<void> => {
    await fetchToken()
  }

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['X-CSRF-Token'] = token
    }
    
    return headers
  }

  useEffect(() => {
    fetchToken()
  }, [])

  return {
    token,
    loading,
    error,
    refreshToken,
    getHeaders,
  }
}

// Hook for form submissions with CSRF protection
export function useSecureForm() {
  const { token, loading, error, refreshToken, getHeaders } = useCSRF()

  const secureSubmit = async (
    url: string,
    data: any,
    options?: RequestInit
  ): Promise<Response> => {
    if (!token) {
      throw new Error('CSRF token not available')
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })

    // If CSRF token is invalid, refresh and retry once
    if (response.status === 403) {
      const responseData = await response.json()
      if (responseData.error?.includes('CSRF')) {
        await refreshToken()
        
        // Retry with new token
        return fetch(url, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            ...options?.headers,
          },
          body: JSON.stringify(data),
          ...options,
        })
      }
    }

    return response
  }

  return {
    token,
    loading,
    error,
    refreshToken,
    getHeaders,
    secureSubmit,
  }
}