import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { RecipientService, LetterService, SecurityService } from '@/services/api';
import { useModal, usePagination } from '@/hooks/useApp';
import { DASHBOARD_TABS } from '@/constants';
import { AlertCircle, LogOut, Plus, MailOpen } from 'lucide-react';

// Sub-components (would normally be in separate files)
import RecipientsList from '@/components/dashboard/RecipientsList';
import LettersView from '@/components/dashboard/LettersView';
import RepliesView from '@/components/dashboard/RepliesView';
import SecurityLog from '@/components/dashboard/SecurityLog';
import AccountSettings from '@/components/dashboard/AccountSettings';
import AddRecipientModal from '@/components/dashboard/AddRecipientModal';

/**
 * Enhanced Dashboard
 * Main admin interface with optimized state management and error handling
 */
const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(DASHBOARD_TABS.RECIPIENTS);

  const recipientModal = useModal();
  const letterModal = useModal();

  const recipientsPagination = usePagination(1, 20);
  const lettersPagination = usePagination(1, 20);

  // Fetch Recipients
  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    error: recipientsError,
    refetch: refetchRecipients,
  } = useQuery({
    queryKey: ['recipients', user?.id, recipientsPagination.page],
    queryFn: () =>
      user ? RecipientService.getRecipients(user.id, recipientsPagination.page, 20) : null,
    enabled: !!user && activeTab === DASHBOARD_TABS.RECIPIENTS,
  });

  // Fetch Letters
  const {
    data: lettersData,
    isLoading: lettersLoading,
    error: lettersError,
    refetch: refetchLetters,
  } = useQuery({
    queryKey: ['letters', user?.id, lettersPagination.page],
    queryFn: () =>
      user ? LetterService.getLetters(user.id, lettersPagination.page, 20) : null,
    enabled: !!user && activeTab === DASHBOARD_TABS.LETTERS,
  });

  // Fetch Security Logs
  const {
    data: securityLogs,
    isLoading: logsLoading,
    error: logsError,
  } = useQuery({
    queryKey: ['securityLogs', user?.id],
    queryFn: () => (user ? SecurityService.getSecurityLogs(user.id, 50) : []),
    enabled: !!user && activeTab === DASHBOARD_TABS.SECURITY,
    refetchInterval: 30000, // Refetch every 30s
  });

  // Update pagination totals
  useMemo(() => {
    if (recipientsData) {
      recipientsPagination.setTotal(recipientsData.total);
    }
  }, [recipientsData, recipientsPagination]);

  useMemo(() => {
    if (lettersData) {
      lettersPagination.setTotal(lettersData.total);
    }
  }, [lettersData, lettersPagination]);

  // Handlers
  const handleAddRecipient = useCallback(() => {
    recipientModal.open();
  }, [recipientModal]);

  const handleComposeLetters = useCallback(() => {
    letterModal.open();
  }, [letterModal]);

  const handleSignOut = useCallback(async () => {
    if (confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
      await signOut();
    }
  }, [signOut]);

  const handleRecipientAdded = useCallback(() => {
    recipientModal.close();
    refetchRecipients();
  }, [recipientModal, refetchRecipients]);

  // Stats calculation
  const stats = useMemo(() => ({
    totalRecipients: recipientsData?.total || 0,
    totalLetters: lettersData?.total || 0,
    unreadLetters: lettersData?.data?.filter((l) => !l.is_revealed).length || 0,
  }), [recipientsData, lettersData]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-slate-700 mb-4">لم تتمكن من الوصول إلى لوحة التحكم</p>
          <Button onClick={() => signOut()}>تسجيل الخروج</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                لوحة التحكم
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                مرحباً، {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">المستقبلون</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats.totalRecipients}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">الرسائل</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats.totalLetters}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">غير مكشوفة</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {stats.unreadLetters}
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 px-6">
              <TabsList className="bg-transparent border-0">
                <TabsTrigger value={DASHBOARD_TABS.RECIPIENTS} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  المستقبلون
                </TabsTrigger>
                <TabsTrigger value={DASHBOARD_TABS.LETTERS} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  الرسائل
                </TabsTrigger>
                <TabsTrigger value={DASHBOARD_TABS.REPLIES} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  الردود
                </TabsTrigger>
                <TabsTrigger value={DASHBOARD_TABS.SECURITY} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  سجل الأمان
                </TabsTrigger>
                <TabsTrigger value={DASHBOARD_TABS.SETTINGS} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  الإعدادات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {/* Recipients Tab */}
              <TabsContent value={DASHBOARD_TABS.RECIPIENTS} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">المستقبلون</h2>
                  <Button
                    onClick={handleAddRecipient}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مستقبل
                  </Button>
                </div>
                <RecipientsList
                  recipients={recipientsData?.data || []}
                  isLoading={recipientsLoading}
                  error={recipientsError}
                  pagination={recipientsPagination}
                  onRefresh={refetchRecipients}
                />
              </TabsContent>

              {/* Letters Tab */}
              <TabsContent value={DASHBOARD_TABS.LETTERS} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">الرسائل</h2>
                  <Button
                    onClick={handleComposeLetters}
                    className="flex items-center gap-2"
                    disabled={stats.totalRecipients === 0}
                  >
                    <MailOpen className="w-4 h-4" />
                    كتابة رسالة
                  </Button>
                </div>
                <LettersView
                  letters={lettersData?.data || []}
                  isLoading={lettersLoading}
                  error={lettersError}
                  pagination={lettersPagination}
                  onRefresh={refetchLetters}
                />
              </TabsContent>

              {/* Replies Tab */}
              <TabsContent value={DASHBOARD_TABS.REPLIES}>
                <RepliesView />
              </TabsContent>

              {/* Security Log Tab */}
              <TabsContent value={DASHBOARD_TABS.SECURITY}>
                <SecurityLog
                  logs={securityLogs || []}
                  isLoading={logsLoading}
                  error={logsError}
                />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value={DASHBOARD_TABS.SETTINGS}>
                <AccountSettings user={user} onUpdate={refetchRecipients} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      {/* Modals */}
      {recipientModal.isOpen && (
        <AddRecipientModal
          isOpen={recipientModal.isOpen}
          onClose={recipientModal.close}
          onSuccess={handleRecipientAdded}
          adminId={user.id}
        />
      )}

      {letterModal.isOpen && (
        <ComposeLetterModal
          isOpen={letterModal.isOpen}
          onClose={letterModal.close}
          onSuccess={() => {
            letterModal.close();
            refetchLetters();
          }}
          adminId={user.id}
          recipients={recipientsData?.data || []}
        />
      )}
    </div>
  );
};

// Placeholder for ComposeLetterModal
const ComposeLetterModal = ({ isOpen, onClose, onSuccess, adminId, recipients }: any) => {
  return isOpen ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-bold mb-4">كتابة رسالة</h2>
        {/* TODO: Implement form */}
        <Button variant="outline" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </div>
  ) : null;
};

export default Dashboard;
