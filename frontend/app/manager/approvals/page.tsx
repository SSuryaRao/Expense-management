'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Loader2, CheckCircle, X } from 'lucide-react';
import { ExpenseTable } from '@/components/ExpenseTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function ManagerApprovalsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    if (user.role === 'Employee') {
      router.push('/dashboard');
    } else if (user.role === 'Admin') {
      router.push('/admin');
    } else {
      loadPendingExpenses();
    }
  }, [user, router]);

  const loadPendingExpenses = async () => {
    try {
      const { data } = await api.get('/expenses/pending');
      setExpenses(data);
    } catch (error: any) {
      console.error('Failed to load pending expenses:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load pending expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'Approved' | 'Rejected') => {
    if (!selectedExpense) return;

    setActionLoading(true);
    try {
      await api.put(`/expenses/${selectedExpense._id}/action`, {
        action,
        comment,
      });

      toast({
        title: 'Success',
        description: `Expense ${action.toLowerCase()} successfully`,
      });

      setSelectedExpense(null);
      setComment('');
      loadPendingExpenses();
    } catch (error: any) {
      console.error('Failed to process action:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process action',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Approvals</h1>
              <p className="text-sm text-gray-400 mt-1">{user.email}</p>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-blue-500" />
                <div>
                  <CardTitle className="text-white">Expense Approvals</CardTitle>
                  <CardDescription className="text-gray-400">
                    Review and approve pending expense submissions
                  </CardDescription>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {expenses.length} pending approval{expenses.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-400 font-medium p-3">Employee</th>
                        <th className="text-left text-gray-400 font-medium p-3">Date</th>
                        <th className="text-left text-gray-400 font-medium p-3">Category</th>
                        <th className="text-left text-gray-400 font-medium p-3">Description</th>
                        <th className="text-left text-gray-400 font-medium p-3">Status</th>
                        <th className="text-right text-gray-400 font-medium p-3">Amount</th>
                        <th className="text-right text-gray-400 font-medium p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-gray-500 py-8">
                            No pending expenses
                          </td>
                        </tr>
                      ) : (
                        expenses.map((expense) => (
                          <tr key={expense._id} className="border-b border-gray-800 hover:bg-gray-900">
                            <td className="text-gray-300 p-3">
                              {expense.submittedBy?.name || expense.submittedBy?.email || 'Unknown'}
                            </td>
                            <td className="text-gray-300 p-3">
                              {new Date(expense.submissionDate).toLocaleDateString()}
                            </td>
                            <td className="text-gray-300 p-3">{expense.category}</td>
                            <td className="text-gray-300 p-3 max-w-xs truncate">
                              {expense.description}
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-600 capitalize">
                                {expense.status}
                              </span>
                            </td>
                            <td className="text-gray-300 text-right font-medium p-3">
                              {expense.companyCurrency}{' '}
                              {parseFloat(expense.convertedAmount?.$numberDecimal || expense.convertedAmount || '0').toFixed(2)}
                            </td>
                            <td className="text-right p-3">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedExpense(expense)}
                                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                                >
                                  Review
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
          <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Expense</DialogTitle>
              <DialogDescription className="text-gray-400">
                Review the expense details and approve or reject
              </DialogDescription>
            </DialogHeader>

            {selectedExpense && (
              <div className="space-y-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Employee</Label>
                    <p className="text-white mt-1">
                      {selectedExpense.submittedBy?.name || selectedExpense.submittedBy?.email || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Date</Label>
                    <p className="text-white mt-1">
                      {new Date(selectedExpense.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Category</Label>
                    <p className="text-white mt-1">{selectedExpense.category}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Amount</Label>
                    <p className="text-white mt-1 font-semibold">
                      {selectedExpense.companyCurrency}{' '}
                      {parseFloat(selectedExpense.convertedAmount?.$numberDecimal || selectedExpense.convertedAmount || '0').toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-400">Original Amount</Label>
                    <p className="text-white mt-1">
                      {selectedExpense.originalCurrency}{' '}
                      {parseFloat(selectedExpense.originalAmount?.$numberDecimal || selectedExpense.originalAmount || '0').toFixed(2)}
                      {' '}(Rate: {parseFloat(selectedExpense.exchangeRate?.$numberDecimal || selectedExpense.exchangeRate || '1').toFixed(4)})
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-400">Description</Label>
                    <p className="text-white mt-1">{selectedExpense.description}</p>
                  </div>
                  {selectedExpense.receiptUrl && (
                    <div className="col-span-2">
                      <Label className="text-gray-400">Receipt</Label>
                      <div className="mt-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${selectedExpense.receiptUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Receipt
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-gray-900 border-gray-800 text-white min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedExpense(null)}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-900"
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleAction('Rejected')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => handleAction('Approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
