import { useState, useCallback } from 'react';
import { Recipient } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Loader2, Trash2, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecipientsListProps {
  recipients: Recipient[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
  };
  onRefresh: () => void;
}

/**
 * Recipients List Component
 * Displays list of recipients with actions
 */
const RecipientsList = ({
  recipients,
  isLoading,
  error,
  pagination,
  onRefresh,
}: RecipientsListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopyEmail = useCallback((email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('تم نسخ البريد الإلكتروني');
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستقبل؟')) {
      setDeletingId(id);
      // TODO: Implement delete
      setTimeout(() => {
        setDeletingId(null);
        onRefresh();
      }, 1000);
    }
  }, [onRefresh]);

  // Error state
  if (error) {
    return (
      <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-900 dark:text-red-200">حدث خطأ</p>
          <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && recipients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-2">لا توجد مستقبلون</p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          ابدأ بإضافة مستقبل جديد
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإضافة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : (
              recipients.map((recipient) => (
                <TableRow
                  key={recipient.id}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
                    deletingId === recipient.id && 'opacity-50'
                  )}
                >
                  <TableCell className="font-medium">{recipient.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-block px-3 py-1 rounded-full text-xs font-medium',
                        recipient.is_verified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      )}
                    >
                      {recipient.is_verified ? 'مُتحقق' : 'في الانتظار'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(recipient.created_at).toLocaleDateString('ar')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyEmail(recipient.token || '')}
                      title="نسخ رابط الدعوة"
                      disabled={deletingId === recipient.id}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="عرض التفاصيل"
                      disabled={deletingId === recipient.id}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recipient.id)}
                      disabled={deletingId === recipient.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {deletingId === recipient.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          عرض {recipients.length} من {pagination.total}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={pagination.previousPage}
            disabled={!pagination.hasPreviousPage}
            size="sm"
          >
            السابق
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={pagination.page === i + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => pagination.goToPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage}
            size="sm"
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecipientsList;
