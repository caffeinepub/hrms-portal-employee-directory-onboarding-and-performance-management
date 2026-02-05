import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccessGate } from '../../hooks/useAccessGate';
import { AlertCircle } from 'lucide-react';

export default function AccessGateScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const { completeGate, resetGate } = useAccessGate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first name and last name.');
      return;
    }

    completeGate(firstName, lastName);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl readable-surface">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/assets/generated/hrms-logo.dim_512x512.png"
              alt="HRMS Logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Employee Access</CardTitle>
          <CardDescription className="text-base">
            Please enter your name to continue to the HRMS portal. After this step, you will be asked to sign in
            with Internet Identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-12 text-lg font-semibold" size="lg">
              Continue
            </Button>

            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetGate}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Reset access
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
