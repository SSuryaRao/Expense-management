'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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

interface WorkflowFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow?: any;
  users: any[];
  onSave: () => void;
}

export function WorkflowFormModal({ open, onOpenChange, workflow, users, onSave }: WorkflowFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requireManagerApproval, setRequireManagerApproval] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name || '');
      setDescription(workflow.description || '');
      setRequireManagerApproval(workflow.requireManagerApproval || false);
      setIsActive(workflow.isActive !== undefined ? workflow.isActive : true);
      setSteps(workflow.steps || []);
    } else {
      resetForm();
    }
  }, [workflow, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setRequireManagerApproval(false);
    setIsActive(true);
    setSteps([]);
  };

  const addStep = () => {
    const newStep = {
      level: steps.length + 1,
      stepName: '',
      approverType: 'Manager',
      specificApproverIds: [],
      approverRole: 'Manager',
      allowParallelApproval: false,
      approvalRequirement: 'all',
      conditionalRule: null,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Re-number levels
    newSteps.forEach((step, i) => {
      step.level = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const updateConditionalRule = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    if (!newSteps[index].conditionalRule) {
      newSteps[index].conditionalRule = {};
    }
    newSteps[index].conditionalRule[field] = value;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a workflow name',
        variant: 'destructive',
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one approval step',
        variant: 'destructive',
      });
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (step.approverType === 'Specific' && step.specificApproverIds.length === 0) {
        toast({
          title: 'Validation Error',
          description: `Step ${step.level} requires at least one approver`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      const workflowData = {
        name,
        description,
        requireManagerApproval,
        isActive,
        steps,
      };

      if (workflow) {
        await api.put(`/workflows/${workflow._id}`, workflowData);
        toast({
          title: 'Success',
          description: 'Workflow updated successfully',
        });
      } else {
        await api.post('/workflows', workflowData);
        toast({
          title: 'Success',
          description: 'Workflow created successfully',
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {workflow ? 'Edit Workflow' : 'Create Workflow'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label>Workflow Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Approval Workflow"
                className="bg-gray-900 border-gray-800 text-white mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="bg-gray-900 border-gray-800 text-white mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div>
                <Label>Require Manager Pre-Approval</Label>
                <p className="text-xs text-gray-400 mt-1">
                  If enabled, submitter's manager must approve before workflow steps
                </p>
              </div>
              <Switch
                checked={requireManagerApproval}
                onCheckedChange={setRequireManagerApproval}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-gray-400 mt-1">
                  Only active workflows will be used for new expenses
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Approval Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Approval Steps</Label>
              <Button
                onClick={addStep}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-900 rounded-lg border border-gray-800">
                No steps added yet. Click "Add Step" to create your first approval step.
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
                          {step.level}
                        </div>
                        <span className="text-white font-medium">Step {step.level}</span>
                      </div>
                      <Button
                        onClick={() => removeStep(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-400 hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Step Name</Label>
                        <Input
                          value={step.stepName}
                          onChange={(e) => updateStep(index, 'stepName', e.target.value)}
                          placeholder="e.g., Finance Review"
                          className="bg-gray-950 border-gray-700 text-white mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Approver Type</Label>
                        <Select
                          value={step.approverType}
                          onValueChange={(value) => updateStep(index, 'approverType', value)}
                        >
                          <SelectTrigger className="bg-gray-950 border-gray-700 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Specific">Specific User(s)</SelectItem>
                            <SelectItem value="Role">Role</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {step.approverType === 'Role' && (
                        <div className="col-span-2">
                          <Label className="text-sm">Role</Label>
                          <Select
                            value={step.approverRole}
                            onValueChange={(value) => updateStep(index, 'approverRole', value)}
                          >
                            <SelectTrigger className="bg-gray-950 border-gray-700 text-white mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {step.approverType === 'Specific' && (
                        <div className="col-span-2">
                          <Label className="text-sm">Select Approvers</Label>
                          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-gray-950 rounded p-2 border border-gray-700">
                            {users.map((user) => (
                              <label key={user._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-900 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={step.specificApproverIds.includes(user._id)}
                                  onChange={(e) => {
                                    const newIds = e.target.checked
                                      ? [...step.specificApproverIds, user._id]
                                      : step.specificApproverIds.filter((id: string) => id !== user._id);
                                    updateStep(index, 'specificApproverIds', newIds);
                                  }}
                                  className="rounded"
                                />
                                <span className="text-gray-300">
                                  {user.name}
                                  {(user as any).jobTitle && <span className="text-blue-400"> ({(user as any).jobTitle})</span>}
                                  <span className="text-gray-500"> - {user.email}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.approverType === 'Specific' && step.specificApproverIds.length > 1 && (
                        <>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={step.allowParallelApproval}
                                onCheckedChange={(checked) => updateStep(index, 'allowParallelApproval', checked)}
                              />
                              <Label className="text-sm">Allow Parallel Approval</Label>
                            </div>
                          </div>

                          {step.allowParallelApproval && (
                            <>
                              <div className="col-span-2">
                                <Label className="text-sm">Approval Requirement</Label>
                                <Select
                                  value={step.approvalRequirement}
                                  onValueChange={(value) => updateStep(index, 'approvalRequirement', value)}
                                >
                                  <SelectTrigger className="bg-gray-950 border-gray-700 text-white mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-900 border-gray-700">
                                    <SelectItem value="all">All must approve</SelectItem>
                                    <SelectItem value="any">Any one can approve</SelectItem>
                                    <SelectItem value="conditional">Conditional (Advanced)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {step.approvalRequirement === 'conditional' && (
                                <div className="col-span-2 p-4 bg-gray-950 rounded border border-gray-700 space-y-4">
                                  <Label className="text-sm font-semibold">Conditional Rule</Label>

                                  <div>
                                    <Label className="text-sm">Rule Type</Label>
                                    <Select
                                      value={step.conditionalRule?.ruleType || 'percentage'}
                                      onValueChange={(value) => updateConditionalRule(index, 'ruleType', value)}
                                    >
                                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-900 border-gray-700">
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="specific_approver">Specific Approver</SelectItem>
                                        <SelectItem value="hybrid">Hybrid (Percentage OR Specific)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {(step.conditionalRule?.ruleType === 'percentage' || step.conditionalRule?.ruleType === 'hybrid') && (
                                    <div>
                                      <Label className="text-sm">
                                        {step.conditionalRule?.ruleType === 'hybrid' ? 'Hybrid Percentage' : 'Percentage Required'}
                                      </Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={
                                          step.conditionalRule?.ruleType === 'hybrid'
                                            ? step.conditionalRule?.hybridPercentage || ''
                                            : step.conditionalRule?.percentageRequired || ''
                                        }
                                        onChange={(e) =>
                                          updateConditionalRule(
                                            index,
                                            step.conditionalRule?.ruleType === 'hybrid' ? 'hybridPercentage' : 'percentageRequired',
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        placeholder="e.g., 60"
                                        className="bg-gray-900 border-gray-700 text-white mt-1"
                                      />
                                      <p className="text-xs text-gray-400 mt-1">
                                        Enter percentage (1-100)
                                      </p>
                                    </div>
                                  )}

                                  {(step.conditionalRule?.ruleType === 'specific_approver' || step.conditionalRule?.ruleType === 'hybrid') && (
                                    <div>
                                      <Label className="text-sm">
                                        {step.conditionalRule?.ruleType === 'hybrid' ? 'Hybrid Specific Approver' : 'Specific Approver'}
                                      </Label>
                                      <Select
                                        value={
                                          step.conditionalRule?.ruleType === 'hybrid'
                                            ? step.conditionalRule?.hybridSpecificApproverId || ''
                                            : step.conditionalRule?.specificApproverId || ''
                                        }
                                        onValueChange={(value) =>
                                          updateConditionalRule(
                                            index,
                                            step.conditionalRule?.ruleType === 'hybrid' ? 'hybridSpecificApproverId' : 'specificApproverId',
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-1">
                                          <SelectValue placeholder="Select approver" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-700">
                                          {step.specificApproverIds.map((approverId: string) => {
                                            const user = users.find((u) => u._id === approverId);
                                            return user ? (
                                              <SelectItem key={user._id} value={user._id}>
                                                {user.name}
                                              </SelectItem>
                                            ) : null;
                                          })}
                                        </SelectContent>
                                      </Select>
                                      <p className="text-xs text-gray-400 mt-1">
                                        If this user approves, step is auto-approved
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-900"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                workflow ? 'Update Workflow' : 'Create Workflow'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
