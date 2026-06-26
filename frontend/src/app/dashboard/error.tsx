'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center border border-border shadow-xl">
        <div className="mx-auto w-16 h-16 bg-destructive-light rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/10">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
        
        <p className="text-muted-foreground mb-8">
          We encountered an unexpected error. This might be due to a temporary connection issue.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="btn-primary flex justify-center items-center py-6"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Try again
          </button>
          
          <Link href="/dashboard" className="btn-secondary flex justify-center items-center py-6">
            Return to Dashboard
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-left bg-muted p-4 rounded-md overflow-auto text-xs text-muted-foreground border border-border">
            <p className="font-bold mb-1 text-foreground">Error Details (Dev Only):</p>
            <code>{error.message}</code>
          </div>
        )}
      </div>
    </div>
  );
}
