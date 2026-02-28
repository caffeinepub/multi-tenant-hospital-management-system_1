import React from 'react';
import { Heart } from 'lucide-react';

export function Footer() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown-app';
  const appId = encodeURIComponent(hostname);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background py-4 px-6 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© {year} HMS Portal. All rights reserved.</span>
        <span className="flex items-center gap-1">
          Built with{' '}
          <Heart className="h-3 w-3 text-destructive fill-destructive mx-0.5" />
          {' '}using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </span>
      </div>
    </footer>
  );
}
