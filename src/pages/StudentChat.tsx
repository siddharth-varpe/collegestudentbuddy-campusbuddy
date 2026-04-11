import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationBar } from '@/components/ui/navigation-bar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { SuggestionCard } from '@/components/chat/SuggestionCard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Send, Sparkles, GraduationCap, Calendar, Users, BookOpen, MapPin, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import syncspotLogo from '@/assets/syncspot-logo.png';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  { title: "Who are the faculty members?", icon: Users },
  { title: "What events are coming up?", icon: Calendar },
  { title: "Tell me about the labs", icon: BookOpen },
  { title: "Where is the library?", icon: MapPin },
  { title: "What courses are offered?", icon: GraduationCap },
  { title: "Help me with something else", icon: HelpCircle },
];

export default function StudentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateBotResponse = async (userMessage: string): Promise<string | { redirectToSyncSpot: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: userMessage }
      });

      if (error) {
        console.error('Error calling AI chat function:', error);
        return "Oops! 😅 I'm having a little trouble right now. Try again in a moment, or reach out to the college admin for help!";
      }

      if (data?.response) {
        if (data?.redirect === 'syncspot') {
          return { redirectToSyncSpot: true };
        }
        return data.response;
      } else if (data?.error) {
        console.error('AI chat function error:', data.error);
        return "Hmm, I can't access my knowledge base right now 📚. Give me another try in a bit!";
      }

      return "I didn't quite catch that! 🤔 Could you rephrase your question?";
    } catch (error) {
      console.error('Error processing request:', error);
      return "Something went wrong on my end 😓. Please try again!";
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const botResponseResult = await generateBotResponse(text);

      if (typeof botResponseResult === 'object' && botResponseResult.redirectToSyncSpot) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I don't have info on that yet! 🤷 But no worries — I've posted your question to **SyncSpot** where the community can help! 🙌",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        toast({
          title: "✅ Posted to SyncSpot!",
          description: "Your question has been shared with the community.",
          action: (
            <Button variant="outline" size="sm" onClick={() => navigate('/syncspot')}>
              View SyncSpot
            </Button>
          ),
        });
      } else {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponseResult as string,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "We'll update soon! 🔧",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background flex flex-col page-enter">
      <NavigationBar
        title="Campus Buddy"
        showBack
        onBack={() => navigate('/')}
      />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pb-20">
        {/* Welcome area — shown when no messages */}
        {!hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 animate-in fade-in duration-500">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center mb-5 shadow-glow">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>

            <h2 className="text-2xl font-bold text-foreground font-poppins mb-1">
              Hey {firstName}! 👋
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              I'm your <span className="text-primary font-semibold">Campus Buddy</span> — your friendly senior who knows the campus inside out! 🎓 Ask me anything.
            </p>

            {/* Suggestion chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {QUICK_SUGGESTIONS.map((s) => (
                <SuggestionCard
                  key={s.title}
                  title={s.title}
                  icon={s.icon}
                  onClick={() => handleSendMessage(s.title)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}

            {isTyping && (
              <div className="flex gap-3 chat-message-enter">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-primary-foreground animate-pulse" />
                </div>
                <Card className="bg-card text-card-foreground border-border p-3 shadow-chat">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm text-muted-foreground font-poppins">Thinking...</p>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-center gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about campus..."
              className="flex-1 rounded-full bg-card border-border shadow-sm text-base px-5 py-3 h-12 focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isTyping}
            />
            <button
              onClick={() => navigate('/syncspot')}
              className="w-12 h-12 bg-gradient-to-br from-[#3ABAFD] to-[#007BFF] hover:opacity-90 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-md flex-shrink-0 p-2.5"
              title="Visit SyncSpot Community"
            >
              <img src={syncspotLogo} alt="SyncSpot" className="w-full h-full object-contain" />
            </button>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
              className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-md flex-shrink-0 transition-all duration-200 hover:scale-105"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
