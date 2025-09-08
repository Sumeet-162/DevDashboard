import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import DevDashLogo from '@/components/ui/DevDashLogo'

export default function AuthConfirmPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const confirmSignup = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup'
          })

          if (error) {
            setError(error.message)
          } else {
            setSuccess(true)
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
          }
        } else if (token_hash && type === 'email_change') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email_change'
          })

          if (error) {
            setError(error.message)
          } else {
            setSuccess(true)
            setTimeout(() => {
              navigate('/settings')
            }, 2000)
          }
        } else if (token_hash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery'
          })

          if (error) {
            setError(error.message)
          } else {
            setSuccess(true)
            setTimeout(() => {
              navigate('/reset-password')
            }, 2000)
          }
        } else {
          // Check if there are any other parameters that might indicate a legacy URL format
          const access_token = searchParams.get('access_token')
          const refresh_token = searchParams.get('refresh_token')
          
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            })
            
            if (error) {
              setError(error.message)
            } else {
              setSuccess(true)
              setTimeout(() => {
                navigate('/dashboard')
              }, 2000)
            }
          } else {
            setError('Invalid confirmation link. Please try signing up again.')
          }
        }
      } catch (err) {
        setError('An unexpected error occurred during confirmation.')
        console.error('Auth confirmation error:', err)
      } finally {
        setLoading(false)
      }
    }

    confirmSignup()
  }, [searchParams, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <DevDashLogo size="md" showText />
            </div>
            <CardTitle className="text-xl">Confirming your account...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Please wait while we confirm your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <DevDashLogo size="md" showText />
            </div>
            <CardTitle className="text-xl text-destructive">Confirmation Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={() => navigate('/signup')} className="w-full">
                Try Signing Up Again
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <DevDashLogo size="md" showText />
            </div>
            <CardTitle className="text-xl text-green-600">Account Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            <p className="text-muted-foreground">
              Your email has been confirmed successfully! You'll be redirected to your dashboard shortly.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
