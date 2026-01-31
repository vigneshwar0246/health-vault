import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { reportsAPI } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Translation state for inline UI translation on this page
  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const toggleTamil = async () => {
    if (isTamil) {
      setIsTamil(false);
      return;
    }

    // Strings to translate (order matters)
    const keys = ['title','description','emailLabel','emailPlaceholder','passwordLabel','forgotPassword','signIn','createAccount','footer'];
    const texts = [
      'Welcome Back',
      'Sign in to access your health dashboard',
      'Email',
      'you@example.com',
      'Password',
      'Forgot password?',
      'Sign In',
      'Create one',
      'Your data stays on this device. We never upload your health information.'
    ];

    try {
      const res = await reportsAPI.translateText(texts, 'ta');
      const translatedArr = res.translated || [];
      const map: Record<string, string> = {};
      keys.forEach((k, i) => { map[k] = translatedArr[i] || texts[i]; });
      setTranslations(map);
      setIsTamil(true);
    } catch (err: any) {
      console.error('Translation failed', err);
      const msg = err?.message || (err?.error ? err.error : 'Translation failed');
      toast.error(`Translation failed: ${msg}`);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Invalid email or password');
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
        <div className="flex items-center justify-between gap-2 mb-8">
          <Link to="/" className="flex items-center justify-center gap-2">
            <Heart className="h-10 w-10 text-primary" />
            <span className="font-bold text-2xl">HealthVault</span>
          </Link>
          <div>
            <Button size="sm" variant="ghost" onClick={toggleTamil}>
              {isTamil ? 'English' : 'Translate (தமிழ்)'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isTamil ? translations.title ?? 'Welcome Back' : 'Welcome Back'}</CardTitle>
            <CardDescription>
              {isTamil ? translations.description ?? 'Sign in to access your health dashboard' : 'Sign in to access your health dashboard'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{isTamil ? translations.emailLabel ?? 'Email' : 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isTamil ? translations.emailPlaceholder ?? 'you@example.com' : 'you@example.com'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{isTamil ? translations.passwordLabel ?? 'Password' : 'Password'}</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {isTamil ? translations.forgotPassword ?? 'Forgot password?' : 'Forgot password?'}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isTamil ? translations.signIn ?? 'Sign In' : 'Sign In'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {isTamil ? "Don't have an account?" : "Don't have an account?"}{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  {isTamil ? translations.createAccount ?? 'Create one' : 'Create one'}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {isTamil ? translations.footer ?? 'Your data stays on this device. We never upload your health information.' : 'Your data stays on this device. We never upload your health information.'}
        </p>
      </div>
    </div>
  );
}
