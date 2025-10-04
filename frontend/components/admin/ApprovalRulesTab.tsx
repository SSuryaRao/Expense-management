'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Edit, Trash2, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { WorkflowFormModal } from './WorkflowFormModal';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export function ApprovalRulesTab() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
    loadUsers();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data } = await api.get('/workflows');
      setWorkflows(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load workflows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/workflows/users/all');
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setShowWorkflowModal(true);
  };

  const handleEditWorkflow = (workflow: any) => {
    setEditingWorkflow(workflow);
    setShowWorkflowModal(true);
  };

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;

    try {
      await api.delete(`/workflows/${deleteWorkflowId}`);
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });
      loadWorkflows();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete workflow',
        variant: 'destructive',
      });
    } finally {
      setDeleteWorkflowId(null);
    }
  };

  const handleWorkflowSaved = () => {
    setShowWorkflowModal(false);
    setEditingWorkflow(null);
    loadWorkflows();
  };

  const getApproverNames = (step: any) => {
    if (step.approverType === 'Manager') {
      return "Submitter's Manager";
    } else if (step.approverType === 'Role') {
      return `All ${step.approverRole}s`;
    } else if (step.approverType === 'Specific' && step.specificApproverIds) {
      return step.specificApproverIds.map((u: any) => u.name).join(', ');
    }
    return 'Unknown';
  };

  const getApprovalRequirementText = (step: any) => {
    if (step.approvalRequirement === 'all') {
      return 'All must approve';
    } else if (step.approvalRequirement === 'any') {
      return 'Any one can approve';
    } else if (step.approvalRequirement === 'conditional' && step.conditionalRule) {
      const rule = step.conditionalRule;
      if (rule.ruleType === 'percentage') {
        return `${rule.percentageRequired}% must approve`;
      } else if (rule.ruleType === 'specific_approver') {
        const approver = step.specificApproverIds?.find((u: any) => u._id === rule.specificApproverId);
        return `Auto-approve if ${approver?.name || 'specific user'} approves`;
      } else if (rule.ruleType === 'hybrid') {
        const approver = step.specificApproverIds?.find((u: any) => u._id === rule.hybridSpecificApproverId);
        return `${rule.hybridPercentage}% OR ${approver?.name || 'specific user'} approves`;
      }
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle className="text-white">Approval Workflows</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure approval rules and workflows for expense submissions
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleCreateWorkflow}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No workflows configured yet</p>
              <p className="text-gray-500 text-sm">
                Create your first approval workflow to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow._id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg">
                          {workflow.name}
                        </h3>
                        <Badge
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className={workflow.isActive ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-gray-400 text-sm">{workflow.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWorkflow(workflow)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteWorkflowId(workflow._id)}
                        className="border-red-700 text-red-500 hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {workflow.requireManagerApproval && (
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-400">
                        Requires manager pre-approval before workflow steps
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm text-gray-400 font-medium">Approval Steps:</div>
                    {workflow.steps.map((step: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-950 rounded p-3 border border-gray-800"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                            {step.level}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {step.stepName && (
                                <span className="text-white font-medium">
                                  {step.stepName}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs border-gray-700">
                                {step.approverType}
                              </Badge>
                            </div>
                            <div className="text-gray-400 text-sm mb-1">
                              <Users className="h-3 w-3 inline mr-1" />
                              {getApproverNames(step)}
                            </div>
                            {step.allowParallelApproval && (
                              <div className="text-gray-500 text-xs">
                                Parallel Approval: {getApprovalRequirementText(step)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkflowFormModal
        open={showWorkflowModal}
        onOpenChange={setShowWorkflowModal}
        workflow={editingWorkflow}
        users={users}
        onSave={handleWorkflowSaved}
      />

      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent className="bg-gray-950 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
