import { useEffect, useState } from 'react';

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
  Search,
  Bell,
  Users,
  Star,
  Play,
  CheckCircle2,
  UserPlus,
  HelpCircle,
  MessageCircle,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import heroIllustration from '@/assets/hero-illustration.png';

const FEATURES = [
  { icon: Zap, title: 'Instant Answers', description: 'Get real-time responses to any campus-related question in seconds.' },
  { icon: Bot, title: 'AI Chat Assistant', description: 'Smart assistant trained on your college data for accurate info.' },
  { icon: Bell, title: 'Notices & Updates', description: 'Stay updated with latest announcements, deadlines, and events.' },
  { icon: Users, title: 'Faculty Info Access', description: 'Quickly find faculty details, office hours, and contact info.' },
  { icon: Search, title: 'Smart Search', description: 'Intelligent search across all campus data with context awareness.' },
  { icon: Shield, title: 'Secure Login', description: 'Role-based access for students and faculty with verified logins.' },
];

const STEPS = [
  { icon: UserPlus, step: '01', title: 'Sign Up', description: 'Create your account with your college email in under a minute.' },
  { icon: HelpCircle, step: '02', title: 'Ask Questions', description: 'Type any campus-related question in natural language.' },
  { icon: CheckCircle2, step: '03', title: 'Get Instant Answers', description: 'Receive accurate, AI-powered responses immediately.' },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'CS Student, 3rd Year', text: 'CampusBuddy saved me hours of running around for exam info. Just ask and get answers!', rating: 5 },
  { name: 'Priya Sharma', role: 'Faculty, IT Dept', text: 'Managing college data has never been easier. The faculty dashboard is incredibly intuitive.', rating: 5 },
  { name: 'Rahul Deshmukh', role: 'ME Student, 2nd Year', text: 'I love the SyncSpot feature — getting doubts cleared by faculty is seamless now.', rating: 4 },
];

const DEMO_MESSAGES = [
  { role: 'user', text: 'When is the exam form deadline?' },
  { role: 'ai', text: 'The exam form deadline for this semester is April 25, 2026. Make sure to submit before 5:00 PM to avoid late fees! 📋' },
];

/* Typing effect hook */
const useTypingEffect = (text: string, speed = 40, start = true) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!start) { setDisplayed(''); return; }
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, start]);
  return displayed;
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const typedSubtext = useTypingEffect('Ask anything about your college...', 45);


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
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] rounded-full bg-ring/5 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
      </div>

      <main>
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            {/* Left — Text */}
            <div className="flex-1 text-center md:text-left animate-fade-in">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                🚀 AI-Powered Campus Assistant
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground font-poppins mb-6 leading-[1.1] tracking-tight">
                Your Smart Campus{' '}
                <span className="bg-gradient-to-r from-primary to-ring bg-clip-text text-transparent">
                  Companion
                </span>{' '}
                🎓
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0 mb-4 leading-relaxed">
                Instant answers, faculty info, notices — all in one place.
              </p>
              <p className="text-lg md:text-xl text-primary font-medium max-w-xl mx-auto md:mx-0 mb-10 h-7">
                {typedSubtext}<span className="animate-pulse">|</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Button
                  onClick={handleGetStarted}
                  size="xl"
                  className="gradient-campus text-primary-foreground text-lg px-10 py-6 rounded-2xl shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-elevated"
                >
                  {user ? 'Open Chat' : 'Get Started'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  size="xl"
                  className="text-lg px-10 py-6 rounded-2xl border-border/60 hover:bg-primary/5 transition-all duration-300 hover:scale-105 gap-2"
                >
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-3 justify-center md:justify-start text-muted-foreground text-sm">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span>Trusted by <strong className="text-foreground">500+</strong> students</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </div>

            {/* Right — Illustration */}
            <div className="flex-1 flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-ring/20 rounded-3xl blur-2xl scale-90 animate-pulse" style={{ animationDuration: '3s' }} />
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
                  className="flex-1 gradient-campus text-primary-foreground rounded-xl transition-all duration-300 hover:scale-[1.03]"
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

        {/* ═══════════════ LIVE DEMO PREVIEW ═══════════════ */}
        <section id="demo" className="container mx-auto px-4 py-20 animate-fade-in">
          <div className="text-center mb-12 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              Live Preview
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground mb-4">
              See It In Action
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ask a question, get an instant AI-powered answer from your college database.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-ring/30 rounded-3xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative rounded-2xl bg-card border border-border/60 shadow-elevated overflow-hidden">
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2 bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  <span className="ml-2 text-xs font-medium text-muted-foreground">CampusBuddy Chat</span>
                </div>
                {/* Messages */}
                <div className="p-5 space-y-4">
                  {DEMO_MESSAGES.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'gradient-campus text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input mock */}
                <div className="px-5 py-3 border-t border-border/40 bg-muted/20">
                  <div className="flex items-center gap-2 rounded-xl bg-background border border-border/60 px-4 py-2.5 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    Ask anything about your campus...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <section id="features" className="container mx-auto px-4 py-20 animate-fade-in">
          <div className="text-center mb-14 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Powerful tools to navigate campus life — smarter and faster.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-card/70 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1.5 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110 group-hover:shadow-glow">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-poppins font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <section className="container mx-auto px-4 py-20 animate-fade-in">
          <div className="text-center mb-14 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get started in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative text-center animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center mx-auto mb-5 transition-all duration-300 hover:scale-110 hover:shadow-glow">
                  <s.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary mb-2">{s.step}</div>
                <h3 className="font-poppins font-semibold text-foreground text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ STUDENT / FACULTY CTA ═══════════════ */}
        {!user && (
          <section className="container mx-auto px-4 py-20 animate-fade-in">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground mb-4">
                Choose Your Portal
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Whether you're a student or faculty — CampusBuddy has you covered.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Students */}
              <div className="group relative p-8 rounded-3xl bg-card/80 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-2 hover:border-primary/40 animate-fade-in overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl gradient-campus flex items-center justify-center mb-6 shadow-glow/50 transition-transform duration-300 group-hover:scale-110">
                    <MessageSquare className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-poppins font-bold text-2xl text-foreground mb-3">For Students</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Get instant academic help anytime. AI-powered answers about exams, faculty, notices, and more.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="w-full gradient-campus text-primary-foreground rounded-xl py-5 text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-glow"
                  >
                    Enter Student Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Faculty */}
              <div className="group relative p-8 rounded-3xl bg-card/80 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-2 hover:border-ring/40 animate-fade-in overflow-hidden" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-ring/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ring to-primary flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                    <Settings className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-poppins font-bold text-2xl text-foreground mb-3">For Faculty</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Manage and train the AI system. Upload data, answer questions, and keep students informed.
                  </p>
                  <Button 
                    onClick={() => navigate('/faculty-auth')} 
                    className="w-full bg-gradient-to-r from-ring to-primary text-primary-foreground rounded-xl py-5 text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-glow"
                  >
                    Open Faculty Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ TESTIMONIALS ═══════════════ */}
        <section className="container mx-auto px-4 py-20 animate-fade-in">
          <div className="text-center mb-14 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground mb-4">
              What Students Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl bg-card/70 backdrop-blur border border-border/40 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`h-4 w-4 ${si < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{t.name}</div>
                    <div className="text-muted-foreground text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ CTA BANNER ═══════════════ */}
        {!user && (
          <section className="container mx-auto px-4 py-16 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 gradient-campus opacity-90" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--ring)/0.3),_transparent_50%)]" />
              <div className="relative px-8 py-16 md:py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins text-primary-foreground mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-primary-foreground/80 max-w-md mx-auto mb-8 text-lg">
                  Join hundreds of students already using CampusBuddy to navigate campus smarter.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  size="xl"
                  className="bg-background text-foreground hover:bg-background/90 rounded-2xl px-10 text-lg transition-all duration-300 hover:scale-105 shadow-elevated"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer className="border-t border-border/40 mt-8 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl gradient-campus flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-poppins font-bold text-xl text-foreground">CampusBuddy</span>
                </div>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-4">
                  Your AI-powered smart campus assistant — built for students, by students. Making campus life easier, one question at a time.
                </p>
                <div className="flex items-center gap-3">
                  {[Github, Twitter, Linkedin].map((Icon, i) => (
                    <button key={i} className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200">
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-poppins font-semibold text-foreground mb-4 text-sm">Product</h4>
                <ul className="space-y-2.5">
                  {['Features', 'How it Works', 'Demo'].map(link => (
                    <li key={link}>
                      <button onClick={() => document.getElementById(link.toLowerCase().replace(/\s/g, ''))?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-foreground mb-4 text-sm">Access</h4>
                <ul className="space-y-2.5">
                  <li><button onClick={() => navigate('/auth')} className="text-sm text-muted-foreground hover:text-primary transition-colors">Student Login</button></li>
                  <li><button onClick={() => navigate('/faculty-auth')} className="text-sm text-muted-foreground hover:text-primary transition-colors">Faculty Login</button></li>
                  <li><button onClick={() => navigate('/syncspot')} className="text-sm text-muted-foreground hover:text-primary transition-colors">SyncSpot</button></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} CampusBuddy. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground">
                Made with ❤️ for students everywhere
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
