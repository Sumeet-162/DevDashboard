import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Github } from 'lucide-react';
import { githubAuthService } from '@/services/githubAuthService';
import Layout from '@/components/layout/Layout';

const GitHubCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError(`GitHub OAuth error: ${errorParam}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state parameter');
        return;
      }

      try {
        await githubAuthService.exchangeCodeForToken(code, state);
        setStatus('success');
        
        // Redirect to GitHub page after successful authentication
        setTimeout(() => {
          navigate('/github');
        }, 2000);
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        
        // Provide a clear, helpful message
        setError('For the best experience, please use a Personal Access Token instead. It provides immediate access to your real GitHub data without any setup complexity.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/github');
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Authenticating with GitHub...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please wait while we complete the authentication process.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-medium">Successfully authenticated!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting to your GitHub dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">Authentication failed</p>
                </div>
                
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>{error}</p>
                      {error?.includes('backend server') && (
                        <div className="mt-3 space-y-2 text-sm">
                          <p className="font-medium text-orange-600">Alternative Solutions:</p>
                          <div className="space-y-1 text-xs">
                            <p><strong>Option 1:</strong> Use Personal Access Token (Recommended)</p>
                            <p><strong>Option 2:</strong> Enable CORS proxy at <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">cors-anywhere demo</a></p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={handleRetry} className="flex-1">
                    Use Personal Token Instead
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                    Go Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GitHubCallbackPage;
