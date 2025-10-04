'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ExpenseTable } from '@/components/ExpenseTable';
import { NewExpenseModal } from '@/components/NewExpenseModal';
import { ExpenseDetailModal } from '@/components/ExpenseDetailModal';
import { Expense, ExpenseApproval } from '@/lib/supabase'; // Keep these types for now
import { Plus, LogOut, Loader as Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Create an Axios instance for your API
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


export default function EmployeeDashboard() {
  const { user, profile, company, signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvals, setApprovals] = useState<ExpenseApproval[]>([]);
  const [approverNames, setApproverNames] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            router.push('/');
        }
    }, [user, router]);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      const { data } = await api.get('/expenses/my');
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseClick = async (expense: Expense) => {
    setSelectedExpense(expense);
    // You'll need to implement logic to fetch approval details from your backend
    setApprovals([]);
    setApproverNames({});
    setDetailOpen(true);
  };

  const handleNewExpense = async (expenseData: {
    amount: number;
    currency: string;
    category: string;
    description: string;
    expense_date: string;
    receipt: File;
  }) => {
    try {
        const formData = new FormData();
        formData.append('originalAmount', expenseData.amount.toString());
        formData.append('originalCurrency', expenseData.currency);
        formData.append('category', expenseData.category);
        formData.append('description', expenseData.description);
        formData.append('receipt', expenseData.receipt);


      await api.post('/expenses', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success',
        description: 'Expense submitted successfully',
      });

      loadExpenses();
    } catch (error: any) {
      console.error('Failed to submit expense:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit expense',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (loading || !user) {
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
              <h1 className="text-2xl font-bold text-white">My Expenses</h1>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            {/* You may want to fetch and display company currency here */}
          </div>
          <Button
            onClick={() => setNewExpenseOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>

        <ExpenseTable expenses={expenses} onExpenseClick={handleExpenseClick} />
      </main>

      <NewExpenseModal
        open={newExpenseOpen}
        onOpenChange={setNewExpenseOpen}
        onSubmit={handleNewExpense}
        defaultCurrency={company?.defaultCurrency || 'USD'}
      />

      <ExpenseDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        expense={selectedExpense}
        approvals={approvals}
        approverNames={approverNames}
      />
    </div>
  );
}

