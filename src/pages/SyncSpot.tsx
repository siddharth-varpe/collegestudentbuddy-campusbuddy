import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { NavigationBar } from '@/components/ui/navigation-bar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Users,
  Trash2,
  Send,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import syncspotLogo from '@/assets/syncspot-logo.png';

interface Question {
  id: string;
  question: string;
  asked_by: string;
  student_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer: string;
  user_id: string;
  created_at: string;
}

type RealtimeStatus = 'connecting' | 'connected' | 'error' | 'closed';

export default function SyncSpot() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchQuestions();

    setRealtimeStatus('connecting');
    const channel = supabase
      .channel('syncspot-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'syncspot_questions' }, () => fetchQuestions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'syncspot_answers' }, () => fetchQuestions())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
          toast.error('Realtime connection failed', {
            description: 'New questions/answers won\'t appear automatically. Try refreshing.',
          });
        } else if (status === 'CLOSED') setRealtimeStatus('closed');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchQuestions = async () => {
    try {
      setFetchError(null);
      const { data: questionsData, error: questionsError } = await supabase
        .from('syncspot_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      const { data: answersData, error: answersError } = await supabase
        .from('syncspot_answers')
        .select('*')
        .order('created_at', { ascending: true });

      if (answersError) throw answersError;

      const questionsWithAnswers = questionsData?.map((question) => ({
        ...question,
        answers: answersData?.filter((answer) => answer.question_id === question.id) || [],
      })) || [];

      setQuestions(questionsWithAnswers);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      const msg = error?.message || 'Failed to load questions';
      setFetchError(msg);
      toast.error('Failed to load questions', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answerText = newAnswer[questionId]?.trim();
    if (!answerText || !user) return;

    setSubmittingId(questionId);
    try {
      const { error } = await supabase
        .from('syncspot_answers')
        .insert([{ question_id: questionId, answer: answerText, user_id: user.id }]);

      if (error) throw error;

      setNewAnswer((prev) => ({ ...prev, [questionId]: '' }));
      fetchQuestions();
      toast.success('Answer submitted');
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setDeletingId(questionId);
    try {
      const { error, count } = await supabase
        .from('syncspot_questions')
        .delete({ count: 'exact' })
        .eq('id', questionId);

      if (error) throw error;
      if (!count) {
        throw new Error('No rows deleted — you may not have permission to remove this question.');
      }

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success('Question deleted');
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const RealtimeBadge = () => {
    const map = {
      connecting: { icon: Loader2, label: 'Connecting…', cls: 'bg-muted text-muted-foreground', spin: true },
      connected: { icon: Wifi, label: 'Live', cls: 'bg-green-500/10 text-green-600 border-green-500/20', spin: false },
      error: { icon: WifiOff, label: 'Offline', cls: 'bg-destructive/10 text-destructive border-destructive/20', spin: false },
      closed: { icon: WifiOff, label: 'Disconnected', cls: 'bg-muted text-muted-foreground', spin: false },
    }[realtimeStatus];
    const Icon = map.icon;
    return (
      <Badge variant="outline" className={`gap-1.5 ${map.cls}`}>
        <Icon className={`h-3 w-3 ${map.spin ? 'animate-spin' : ''}`} />
        {map.label}
      </Badge>
    );
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col page-enter">
      <NavigationBar title="SyncSpot" showBack onBack={() => navigate('/chat')} />

      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-full blur-xl"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-lg">
                <img src={syncspotLogo} alt="SyncSpot" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground font-poppins">SyncSpot</h1>
          </div>
          <p className="text-lg text-muted-foreground">Community Q&A - Students helping students</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <RealtimeBadge />
            <Button variant="ghost" size="sm" onClick={fetchQuestions} disabled={loading} className="h-7 gap-1.5">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Fetch error banner */}
        {fetchError && !loading && (
          <Card className="p-4 mb-6 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Couldn't load questions</p>
                <p className="text-sm text-muted-foreground mt-1 break-words">{fetchError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchQuestions}>
                <RefreshCw className="h-3 w-3 mr-1.5" /> Retry
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-20 bg-muted/50 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : questions.length === 0 && !fetchError ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
            <p className="text-muted-foreground">
              Questions that Campus Buddy can't answer will appear here for the community to help with.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <Card key={question.id} className="p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {question.student_name || 'Anonymous student'}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="text-sm text-muted-foreground">{formatTime(question.created_at)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground break-words">{question.question}</h3>
                  </div>

                  {user.id === question.asked_by && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={deletingId === question.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 shrink-0"
                    >
                      {deletingId === question.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {question.answers.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Community Answers ({question.answers.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="bg-muted/30 rounded-lg p-3 border-l-4 border-primary">
                          <p className="text-foreground mb-2 break-words">{answer.answer}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(answer.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Share your answer to help the community..."
                      value={newAnswer[question.id] || ''}
                      onChange={(e) =>
                        setNewAnswer((prev) => ({ ...prev, [question.id]: e.target.value }))
                      }
                      className="flex-1 min-h-[80px] resize-none"
                      disabled={submittingId === question.id}
                    />
                    <Button
                      onClick={() => handleSubmitAnswer(question.id)}
                      disabled={!newAnswer[question.id]?.trim() || submittingId === question.id}
                      className="self-end"
                    >
                      {submittingId === question.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
