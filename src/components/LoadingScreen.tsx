import { Loader2 } from 'lucide-react';

/**
 * Loading Screen Component
 * Displayed while app is initializing or loading data
 */
const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-900"></div>
            <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 relative" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
          جاري التحميل...
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          يرجى الانتظار حتى نقوم بتحضير تطبيقك
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
