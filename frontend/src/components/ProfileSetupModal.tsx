import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSaveCallerUserProfile } from '@/hooks/useQueries';
import { AppRole } from '../backend';
import { Loader2, Hospital } from 'lucide-react';

interface ProfileSetupModalProps {
  open: boolean;
}

export function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>(AppRole.patient);
  const [hospitalId, setHospitalId] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const needsHospitalId = role === AppRole.hospitalAdmin || role === AppRole.doctor || role === AppRole.patient;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveProfile.mutateAsync({
      name: name.trim(),
      appRole: role,
      hospitalId: needsHospitalId && hospitalId.trim() ? hospitalId.trim() : undefined,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Hospital className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Welcome to HMS</DialogTitle>
              <DialogDescription>Set up your profile to get started</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AppRole.patient}>Patient</SelectItem>
                <SelectItem value={AppRole.doctor}>Doctor</SelectItem>
                <SelectItem value={AppRole.hospitalAdmin}>Hospital Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsHospitalId && (
            <div className="space-y-1.5">
              <Label htmlFor="hospitalId">Hospital ID</Label>
              <Input
                id="hospitalId"
                placeholder="e.g. hospital-001"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the Hospital ID provided by your administrator
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim()}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>

          {saveProfile.isError && (
            <p className="text-sm text-destructive text-center">
              Failed to save profile. Please try again.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
