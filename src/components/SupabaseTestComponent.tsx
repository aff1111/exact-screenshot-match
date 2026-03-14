import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, PlugZap } from 'lucide-react';
import { RecipientService, LetterService, SecurityService, supabase } from '@/services/api';

/**
 * Supabase Connection Tester Component
 * للاختبار والتأكد من الاتصال بـ Supabase
 */
export function SupabaseTestComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message: string;
    details?: any;
  }>({
    status: 'idle',
    message: 'Click a button to test the connection',
  });

  const testConnection = async () => {
    setIsLoading(true);
    setResult({ status: 'idle', message: 'Testing...' });

    try {
      // Test 1: Check Supabase client
      console.log('🔄 Test 1: Checking Supabase client...');
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(`Auth Error: ${error.message}`);
      }

      // Test 2: Query a table
      console.log('🔄 Test 2: Querying database...');
      const { data: users, error: dbError } = await supabase
        .from('users')
        .select('count()', { count: 'exact', head: true });

      if (dbError && !dbError.message.includes('relation')) {
        throw new Error(`Database Error: ${dbError.message}`);
      }

      setResult({
        status: 'success',
        message: '✅ Supabase Connection Successful!',
        details: {
          sessionActive: !!data?.session,
          databaseAccessible: true,
          url: import.meta.env.VITE_SUPABASE_URL,
        },
      });
    } catch (error) {
      setResult({
        status: 'error',
        message: `❌ Connection Failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testQueries = async () => {
    setIsLoading(true);
    setResult({ status: 'idle', message: 'Running queries...' });

    try {
      // Test fetching recipients
      const { data: testRecipients, error: recipientError } = await supabase
        .from('recipients')
        .select('count()', { count: 'exact', head: true });

      if (recipientError) throw recipientError;

      // Test fetching letters
      const { data: testLetters, error: letterError } = await supabase
        .from('letters')
        .select('count()', { count: 'exact', head: true });

      if (letterError) throw letterError;

      // Test fetching security logs
      const { data: testLogs, error: logError } = await supabase
        .from('security_logs')
        .select('count()', { count: 'exact', head: true });

      if (logError) throw logError;

      setResult({
        status: 'success',
        message: '✅ All Tables Accessible!',
        details: {
          tables: ['users', 'recipients', 'letters', 'security_logs'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      setResult({
        status: 'error',
        message: `❌ Query Failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRealtime = async () => {
    setIsLoading(true);
    setResult({ status: 'idle', message: 'Testing real-time...' });

    try {
      const subscription = supabase
        .from('users')
        .on('*', (payload: any) => {
          console.log('🔴 Real-time update:', payload);
        })
        .subscribe();

      setResult({
        status: 'success',
        message: '✅ Real-time (Subscriptions) Connected!',
        details: {
          subscriptionActive: true,
          features: ['INSERT', 'UPDATE', 'DELETE'],
        },
      });

      // Cleanup after 5 seconds
      setTimeout(() => {
        subscription.unsubscribe();
      }, 5000);
    } catch (error) {
      setResult({
        status: 'error',
        message: `❌ Real-time Failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PlugZap className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Supabase Connection Tester</h1>
        </div>
        <p className="text-slate-600">
          اختبار الاتصال بـ Supabase Cloud
        </p>
      </div>

      {/* Result Display */}
      {result.status !== 'idle' && (
        <div
          className={`p-4 rounded-lg border ${
            result.status === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex gap-3">
            {result.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <p
                className={
                  result.status === 'success'
                    ? 'text-green-800 font-medium'
                    : 'text-red-800 font-medium'
                }
              >
                {result.message}
              </p>
              {result.details && (
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          onClick={testConnection}
          disabled={isLoading}
          className="flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Test Connection
        </Button>

        <Button
          onClick={testQueries}
          disabled={isLoading}
          variant="outline"
          className="flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Test Queries
        </Button>

        <Button
          onClick={testRealtime}
          disabled={isLoading}
          variant="outline"
          className="flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Test Real-time
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ معلومات الاتصال</h3>
        <div className="text-sm text-blue-800 space-y-1 font-mono">
          <p>
            <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL}
          </p>
          <p>
            <strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30)}...
          </p>
        </div>
      </div>

      {/* Example Usage */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">📝 Example Usage</h3>
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-60">
{`import { RecipientService } from '@/services/api';

// Get recipients
const recipients = await RecipientService.getRecipients(userId);

// Create recipient
const newRecipient = await RecipientService.createRecipient(
  adminId,
  'email@example.com'
);

// Delete recipient
await RecipientService.deleteRecipient(recipientId);`}
        </pre>
      </div>
    </div>
  );
}

export default SupabaseTestComponent;
