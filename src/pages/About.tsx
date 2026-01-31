import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Shield,
  Activity,
  FileText,
  Users,

  Download,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const howItWorks = [
  {
    step: 1,
    icon: Users,
    title: 'Create Your Account',
    description: 'Sign up in seconds. Add profiles for yourself and family members.',
  },
  {
    step: 2,
    icon: Activity,
    title: 'Track Your Vitals',
    description: 'Log blood pressure, heart rate, temperature, and more with color-coded health indicators.',
  },
  {
    step: 3,
    icon: FileText,
    title: 'Store Medical Records',
    description: 'Upload reports, prescriptions, and doctor notes. Everything organized by date.',
  },

];

const faqs = [
  {
    question: 'Where is my data stored?',
    answer: 'All your health data is stored locally on your device using browser storage. We never upload or store your personal health information on any server. This means your data is completely private and under your control.',
  },
  {
    question: 'What happens if I clear my browser data?',
    answer: 'Since data is stored locally, clearing your browser data or cache will delete your HealthVault data. We recommend regularly exporting your health data as a backup using the Export feature.',
  },
  {
    question: 'Can I access my data on multiple devices?',
    answer: 'Currently, data is stored only on the device where you created your account. Data does not sync between devices. For the same data across devices, you would need to export and import manually.',
  },
  {
    question: 'Is HealthVault free to use?',
    answer: 'Yes! HealthVault is completely free. There are no subscriptions, no premium features, and no hidden costs.',
  },
  {
    question: 'How do I add family members?',
    answer: 'Go to Profile & Family from the dashboard. Click "Add Family Member" and fill in their details. You can then switch between family profiles to track health data separately for each person.',
  },

];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">HealthVault</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">About HealthVault</h1>
          <p className="text-xl text-muted-foreground">
            A privacy-first personal health management app for you and your family.
          </p>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Your Privacy, Our Priority</CardTitle>
                  <CardDescription>Your health data never leaves your device</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>
                HealthVault is designed with a simple principle: your health data belongs to you and only you.
                Unlike traditional health apps that store your sensitive information on remote servers,
                HealthVault keeps everything on your local device.
              </p>
              <ul className="list-disc pl-4 mt-4 space-y-2">
                <li>No account data is sent to any server</li>
                <li>No analytics or tracking of your health information</li>
                <li>No third-party access to your medical records</li>
                <li>Full data export capability for your records</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {howItWorks.map((item) => (
              <Card key={item.step} className="relative">
                <CardContent className="pt-6">
                  <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Take control of your family's health data today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/register">Create Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2024 HealthVault. Your data, your control.
        </div>
      </footer>
    </div>
  );
}
