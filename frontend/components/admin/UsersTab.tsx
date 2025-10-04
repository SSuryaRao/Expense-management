'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/lib/types';
import { Plus, CreditCard as Edit, Loader as Loader2 } from 'lucide-react';
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

export function UsersTab() {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'manager',
    jobTitle: '',
    manager_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      const filteredUsers = data.filter((u: any) => u.role !== 'Admin');

      // Map backend fields to frontend format
      const mappedUsers = filteredUsers.map((u: any) => ({
        ...u,
        _id: u._id,
        id: u._id, // Add id field for compatibility
        name: u.name || u.email.split('@')[0],
        manager_id: u.managerId,
        role: u.role.toLowerCase(),
      }));

      setUsers(mappedUsers || []);
      setManagers(mappedUsers?.filter((u: any) => u.role === 'manager') || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: Profile) => {
    if (user) {
      setEditUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role as 'employee' | 'manager',
        jobTitle: (user as any).jobTitle || '',
        manager_id: user.manager_id || '',
      });
    } else {
      setEditUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        jobTitle: '',
        manager_id: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editUser) {
        await api.put(`/users/${editUser._id}`, {
          role: formData.role.charAt(0).toUpperCase() + formData.role.slice(1),
          jobTitle: formData.jobTitle,
          managerId: formData.manager_id || null,
        });

        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      } else {
        await api.post('/users', {
          name: formData.name || formData.email.split('@')[0],
          email: formData.email,
          password: formData.password,
          role: formData.role.charAt(0).toUpperCase() + formData.role.slice(1),
          jobTitle: formData.jobTitle,
          managerId: formData.manager_id || null,
        });

        toast({
          title: 'Success',
          description: 'User created successfully',
        });
      }

      setModalOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage employees and managers
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Email</TableHead>
              <TableHead className="text-gray-400">Role</TableHead>
              <TableHead className="text-gray-400">Job Title</TableHead>
              <TableHead className="text-gray-400">Manager</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user._id}
                  className="border-gray-800 hover:bg-gray-900"
                >
                  <TableCell className="text-gray-300">{user.name}</TableCell>
                  <TableCell className="text-gray-300">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.role === 'manager'
                          ? 'bg-purple-600'
                          : 'bg-gray-600'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {(user as any).jobTitle || '-'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {user.manager_id
                      ? managers.find((m) => m._id === user.manager_id)?.email || 'Unknown'
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(user)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-900"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editUser
                ? 'Update user role and manager assignment'
                : 'Create a new employee or manager account'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Doe"
                required
                className="bg-gray-900 border-gray-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editUser}
                required
                className="bg-gray-900 border-gray-800 text-white"
              />
            </div>

            {!editUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'employee' | 'manager') =>
                  setFormData({ ...formData, role: value, manager_id: value === 'manager' ? '' : formData.manager_id })
                }
              >
                <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                Manager role is required for approval workflows
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title (Optional)</Label>
              <Input
                id="jobTitle"
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g., CFO, Director, Finance Manager"
                className="bg-gray-900 border-gray-800 text-white"
              />
              <p className="text-xs text-gray-400">
                For display purposes (CFO, Director, Finance Manager, etc.)
              </p>
            </div>

            {formData.role === 'employee' && (
              <div className="space-y-2">
                <Label htmlFor="manager">Manager (Optional)</Label>
                <Select
                  value={formData.manager_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, manager_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editUser ? (
                  'Update User'
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
