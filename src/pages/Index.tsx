import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NavigationBar } from '@/components/ui/navigation-bar';
import { useAuth } from '@/hooks/useAuth';
import { 
  GraduationCap, 
  MessageSquare, 
  Settings,
  Globe,
  Zap,
  Bot,
  Shield,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import heroIllustration from '@/assets/hero-illustration.png';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Answers',
    description: 'Get real-time responses to any campus-related question in seconds.',
  },
  {
    icon: Bot,
    title: 'AI Powered',
    description: 'Smart assistant trained on your college data for accurate info.',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description: 'Role-based access for students and faculty with verified logins.',
  },
  {
    icon: Target,
    title: 'Personalized Experience',
    description: 'Tailored responses based on your profile, branch, and needs.',
  },
];

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile?.user_type === 'student') {
      navigate('/chat');
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGetStarted = () => {
    if (user) {
      if (profile?.user_type === 'faculty') {
        navigate('/chat');
      } else {
        navigate('/chat');
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <NavigationBar title="CampusBuddy" transparent />
      
      {/* Animated background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <main>
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="container mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center md:text-left animate-fade-in">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Campus Assistant
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground font-poppins mb-6 leading-tight">
                Your Smart Campus{' '}
                <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Companion
                </span>{' '}
                🎓
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed">
                Instant answers, faculty info, notices — all in one place. Built for students who move fast.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="gradient-campus hover:opacity-90 text-lg px-8 py-6 rounded-2xl shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-elevated"
                >
                  {user ? 'Open Chat' : 'Get Started'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 rounded-2xl border-border/60 hover:bg-primary/5 transition-all duration-300 hover:scale-105"
                >
                  Explore Features
                </Button>
              </div>
            </div>

            {/* Right — Illustration */}
            <div className="flex-1 flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl scale-90" />
                <img
                  src={heroIllustration}
                  alt="Student using CampusBuddy AI assistant"
                  width={800}
                  height={640}
                  className="relative w-full max-w-md md:max-w-lg drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ WELCOME BACK (Authenticated) ═══════════════ */}
        {user && profile && (
          <section className="container mx-auto px-4 pb-16">
            <div className="max-w-lg mx-auto p-6 rounded-2xl bg-card/80 backdrop-blur border border-border/50 shadow-card animate-fade-in">
              <h3 className="font-poppins font-semibold text-lg text-foreground mb-1">Welcome back, {profile.full_name}! 👋</h3>
              <p className="text-muted-foreground text-sm mb-5">
                {profile.user_type === 'faculty' ? 'Faculty Member' : 'Student'} • {profile.email}
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/chat')} 
                  className="flex-1 gradient-campus hover:opacity-90 rounded-xl transition-all duration-300 hover:scale-[1.03]"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat Bot
                </Button>
                <Button 
                  onClick={() => navigate('/syncspot')} 
                  variant="outline"
                  className="flex-1 rounded-xl border-border/60 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.03]"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  SyncSpot
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ WHY CAMPUSBUDDY ═══════════════ */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="text-center mb-14 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground mb-4">
              Why CampusBuddy?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Everything you need to navigate campus life — smarter and faster.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-poppins font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ CTA CARDS (Not Authenticated) ═══════════════ */}
        {!user && (
          <section className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Students */}
              <div className="group p-8 rounded-2xl bg-card/80 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/40 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl gradient-campus flex items-center justify-center mb-5 shadow-glow/50 transition-transform duration-300 group-hover:scale-110">
                  <MessageSquare className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-foreground mb-2">For Students</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Ask anything about your campus instantly. Get AI-powered answers 24/7.
                </p>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full gradient-campus hover:opacity-90 rounded-xl py-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-glow"
                >
                  Access Student Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Faculty */}
              <div className="group p-8 rounded-2xl bg-card/80 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:border-accent-foreground/40 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-foreground to-primary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                  <Settings className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-foreground mb-2">For Faculty</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Manage data & train AI effortlessly. Secure portal for educators.
                </p>
                <Button 
                  onClick={() => navigate('/faculty-auth')} 
                  className="w-full bg-gradient-to-r from-accent-foreground to-primary hover:opacity-90 text-primary-foreground rounded-xl py-5 transition-all duration-300 hover:scale-[1.03]"
                >
                  Go to Faculty Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer className="border-t border-border/40 mt-12">
          <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-campus flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-poppins font-semibold text-foreground">CampusBuddy</span>
              </div>

              <p className="text-muted-foreground text-sm text-center">
                Your AI-powered smart campus assistant — built for students, by students.
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">Features</button>
                <button onClick={() => navigate('/auth')} className="hover:text-primary transition-colors">Sign Up</button>
              </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} CampusBuddy. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
