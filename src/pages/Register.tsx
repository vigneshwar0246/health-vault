import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const passwordRequirements = [
  { label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { label: 'Contains a number', check: (p: string) => /\d/.test(p) },
  { label: 'Contains uppercase', check: (p: string) => /[A-Z]/.test(p) },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const isPasswordValid = passwordRequirements.every(req => req.check(formData.password));
  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }
    
    if (!doPasswordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.name);
      
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'An account with this email already exists');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-10 w-10 text-primary" />
          <span className="font-bold text-2xl">HealthVault</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Start managing your family's health today
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                {formData.password && (
                  <ul className="space-y-1 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <li
                        key={index}
                        className={`flex items-center gap-2 text-xs ${
                          req.check(formData.password)
                            ? 'text-health-normal'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Check className={`h-3 w-3 ${req.check(formData.password) ? 'opacity-100' : 'opacity-30'}`} />
                        {req.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                {formData.confirmPassword && (
                  <p className={`text-xs ${doPasswordsMatch ? 'text-health-normal' : 'text-destructive'}`}>
                    {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By creating an account, you agree to keep your data secure.
          Your information never leaves your device.
        </p>
      </div>
    </div>
  );
}
