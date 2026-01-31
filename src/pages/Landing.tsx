import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  Activity,
  FileText,
  Users,
  Shield,
  Download,

  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Comprehensive Vitals',
    description: 'Track blood pressure, heart rate, temperature, weight, blood sugar, oxygen levels, BMI, cholesterol, and custom metrics.',
  },
  {
    icon: Users,
    title: 'Family Management',
    description: 'Manage health records for your entire family under one account with easy profile switching.',
  },
  {
    icon: FileText,
    title: 'Medical Reports',
    description: 'Upload and organize lab results, prescriptions, imaging reports, and doctor notes.',
  },

  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays on your device. No cloud storage, no tracking, complete privacy.',
  },
  {
    icon: Download,
    title: 'Health Exports',
    description: 'Export comprehensive health summaries as PDFs for doctor visits or insurance.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">HealthVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            100% Private - Data stays on your device
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Family's Health,
            <span className="text-primary"> Organized & Secure</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track vitals, store medical records, and manage appointments for yourself and your loved ones—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link to="/register">
                Start Free Today
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive health management tools designed for real families.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of families who trust HealthVault to keep their health information organized, accessible, and secure.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">HealthVault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 HealthVault. Your data, your control.
          </p>
          <div className="flex gap-4">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
