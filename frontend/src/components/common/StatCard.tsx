import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  subtitle?: string;
  isLoading?: boolean;
}

const colorMap = {
  primary: {
    border: 'border-l-primary',
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  success: {
    border: 'border-l-success',
    bg: 'bg-success/10',
    text: 'text-success',
  },
  warning: {
    border: 'border-l-warning',
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  destructive: {
    border: 'border-l-destructive',
    bg: 'bg-destructive/10',
    text: 'text-destructive',
  },
  info: {
    border: 'border-l-info',
    bg: 'bg-info/10',
    text: 'text-info',
  },
};

export function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, isLoading }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn('border-l-4 shadow-card hover:shadow-card-hover transition-shadow', colors.border)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl ml-4 flex-shrink-0', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
