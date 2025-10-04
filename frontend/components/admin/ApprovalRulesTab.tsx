'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export function ApprovalRulesTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="text-white">Approval Workflows</CardTitle>
              <CardDescription className="text-gray-400">
                Configure approval rules and workflows for expense submissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Approval workflows feature coming soon!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This feature will allow you to set up custom approval chains for expenses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
