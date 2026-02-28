import React from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Activity, Users, BarChart3 } from 'lucide-react';

export function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  const features = [
    { icon: Activity, label: 'Real-time Stock Tracking' },
    { icon: Users, label: 'Multi-Role Access Control' },
    { icon: BarChart3, label: 'Comprehensive Reports' },
    { icon: Shield, label: 'Secure & Private' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - Hero */}
      <div className="relative lg:flex-1 bg-gradient-to-br from-[oklch(0.35_0.1_185)] to-[oklch(0.22_0.06_220)] flex flex-col justify-between p-8 lg:p-12 min-h-[40vh] lg:min-h-screen overflow-hidden">
        {/* Background illustration */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/assets/generated/hms-hero-illustration.dim_1200x600.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img
            src="/assets/generated/hms-logo-icon.dim_128x128.png"
            alt="HMS Logo"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <div>
            <p className="font-bold text-white text-lg leading-tight">HMS Portal</p>
            <p className="text-white/60 text-xs">Hospital Management System</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-4">
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
            Multi-Tenant Platform
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Modern Healthcare
            <br />
            <span className="text-[oklch(0.75_0.15_175)]">Management</span>
          </h1>
          <p className="text-white/70 text-sm lg:text-base max-w-sm">
            Streamline hospital operations with our comprehensive management platform.
            Manage medicines, beds, blood bank, and more.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/80 text-xs">
                <Icon className="h-3.5 w-3.5 text-[oklch(0.75_0.15_175)] flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} HMS Portal. All rights reserved.
        </p>
      </div>

      {/* Right panel - Login */}
      <div className="lg:w-[480px] flex items-center justify-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to access your hospital management dashboard
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-11 text-sm font-semibold"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign in with Internet Identity
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Secure Authentication</span>
              </div>
            </div>

            <Card className="border-dashed">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">About Internet Identity</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Internet Identity provides secure, passwordless authentication using your device's
                  biometrics or security key. Your identity is cryptographically secured.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center font-medium">Available for</p>
            <div className="grid grid-cols-2 gap-2">
              {['Super Admin', 'Hospital Admin', 'Doctor', 'Patient'].map((role) => (
                <div
                  key={role}
                  className="text-center py-2 px-3 rounded-lg bg-muted/50 text-xs text-muted-foreground"
                >
                  {role}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
