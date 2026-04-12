import { ArrowLeft, Menu, LogOut, User, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface NavigationBarProps {
  title?: string | React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  transparent?: boolean;
}

export const NavigationBar = ({ 
  title = "Campus Buddy", 
  showBack = false, 
  onBack,
  showMenu = false,
  onMenu,
  transparent = false,
}: NavigationBarProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const bgClass = transparent
    ? scrolled
      ? 'bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
      : 'bg-transparent border-b border-transparent'
    : 'bg-card border-b border-border shadow-card';

  return (
    <header className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="transition-smooth hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        {showMenu && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenu}
            className="transition-smooth hover:bg-primary/10"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground font-poppins">
            {typeof title === 'string' ? title : title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && profile && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground hidden sm:block">
              <span className="font-medium">{profile.full_name}</span>
              {profile.user_type === 'faculty' && (
                <span className="text-xs text-primary ml-1">(Faculty)</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="transition-smooth hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {!user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
            className="transition-smooth hover:bg-primary/10"
          >
            <User className="h-4 w-4" />
            <span className="ml-1">Login</span>
          </Button>
        )}
      </div>
    </header>
  );
};
