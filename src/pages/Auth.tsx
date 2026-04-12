import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, GraduationCap, Mail, Lock, User, BookOpen, Hash, ArrowLeft, Shield, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    division: '',
    yearOfStudy: '',
    branch: '',
    rollNumber: '',
    userType: 'student'
  });

  // Redirect if already authenticated
  if (user) {
    navigate('/');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName || !formData.division || !formData.yearOfStudy || !formData.branch || !formData.rollNumber) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    const academicInfo = {
      division: formData.division,
      yearOfStudy: parseInt(formData.yearOfStudy),
      branch: formData.branch,
      rollNumber: formData.rollNumber
    };
    
    const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.userType, academicInfo);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Account created successfully!",
        description: "You can now access the campus chat bot.",
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to campus chat bot.",
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex page-enter">
      {/* ═══════════ LEFT — Branding Panel ═══════════ */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 gradient-campus" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--ring)/0.4),_transparent_60%)]" />
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 blur-xl animate-blob" />
        <div className="absolute bottom-32 right-16 w-40 h-40 rounded-full bg-white/10 blur-xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-2xl bg-white/5 rotate-45 animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top — Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-poppins font-bold text-xl text-white">CampusBuddy</span>
          </div>

          {/* Center — Message */}
          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-bold text-white font-poppins leading-tight mb-6">
              Welcome to<br />
              CampusBuddy 🎓
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Your AI-powered campus assistant. Get instant answers about exams, faculty, notices, and everything campus.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {['AI Chat', 'Faculty Info', 'Smart Search', 'Notices'].map(tag => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-white/90 text-sm font-medium border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom — Trust */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-white/70 text-sm">Trusted by 500+ students across campus</span>
          </div>
        </div>
      </div>

      {/* ═══════════ RIGHT — Auth Form ═══════════ */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-ring/5 blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-campus flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-poppins font-semibold text-foreground">CampusBuddy</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="lg:hidden w-14 h-14 gradient-campus rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in or create an account to get started
              </p>
            </div>

            <Card className="border-border/40 shadow-elevated rounded-2xl bg-card/80 backdrop-blur">
              <CardContent className="p-6 md:p-8">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-muted/50 p-1">
                    <TabsTrigger value="signin" className="rounded-lg data-[state=active]:shadow-sm transition-all duration-200">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg data-[state=active]:shadow-sm transition-all duration-200">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="your.email@college.edu"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10 rounded-xl border-border/60 bg-background/50 h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="pl-10 rounded-xl border-border/60 bg-background/50 h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full gradient-campus text-primary-foreground rounded-xl h-11 text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="pl-10 rounded-xl border-border/60 bg-background/50 h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-division" className="text-sm font-medium">Division</Label>
                          <Select value={formData.division} onValueChange={(value) => handleInputChange('division', value)}>
                            <SelectTrigger id="signup-division" className="rounded-xl border-border/60 bg-background/50 h-11">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">Division A</SelectItem>
                              <SelectItem value="B">Division B</SelectItem>
                              <SelectItem value="C">Division C</SelectItem>
                              <SelectItem value="D">Division D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-year" className="text-sm font-medium">Year</Label>
                          <Select value={formData.yearOfStudy} onValueChange={(value) => handleInputChange('yearOfStudy', value)}>
                            <SelectTrigger id="signup-year" className="rounded-xl border-border/60 bg-background/50 h-11">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-branch" className="text-sm font-medium">Branch</Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Select value={formData.branch} onValueChange={(value) => handleInputChange('branch', value)}>
                            <SelectTrigger id="signup-branch" className="pl-10 rounded-xl border-border/60 bg-background/50 h-11">
                              <SelectValue placeholder="Select your branch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                              <SelectItem value="Information Technology">Information Technology</SelectItem>
                              <SelectItem value="Electronics and Telecommunication">Electronics & Telecom</SelectItem>
                              <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                              <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                              <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                              <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                              <SelectItem value="Instrumentation Engineering">Instrumentation Eng.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-roll" className="text-sm font-medium">Roll Number</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-roll"
                            type="text"
                            placeholder="Enter your roll number"
                            value={formData.rollNumber}
                            onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                            className="pl-10 rounded-xl border-border/60 bg-background/50 h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your.email@college.edu"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10 rounded-xl border-border/60 bg-background/50 h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="pl-10 rounded-xl border-border/60 bg-background/50 h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full gradient-campus text-primary-foreground rounded-xl h-11 text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Trust elements */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Your data is secure & encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>Used by students across campus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
