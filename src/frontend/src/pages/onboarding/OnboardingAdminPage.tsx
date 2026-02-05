import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useSearchEmployees, useIsCallerAdmin } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OnboardingTaskEditor from '../../components/onboarding/OnboardingTaskEditor';
import AccessDenied from '../../components/feedback/AccessDenied';
import type { EmployeeId } from '../../backend';

export default function OnboardingAdminPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { employeeId?: string };
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<EmployeeId | null>(null);
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: employees } = useSearchEmployees('', { adminOnly: true });

  useEffect(() => {
    if (searchParams.employeeId && isAdmin) {
      setSelectedEmployeeId(BigInt(searchParams.employeeId));
    }
  }, [searchParams.employeeId, isAdmin]);

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Onboarding</h1>
        <p className="text-muted-foreground mt-1">Assign onboarding tasks to employees</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>Choose an employee to assign onboarding tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedEmployeeId?.toString() || ''}
            onValueChange={(value) => setSelectedEmployeeId(BigInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees?.map((employee) => (
                <SelectItem key={employee.id.toString()} value={employee.id.toString()}>
                  {employee.name} - {employee.jobTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedEmployeeId && (
            <Button
              variant="outline"
              onClick={() => navigate({ 
                to: '/onboarding/questionnaire',
                search: { employeeId: selectedEmployeeId.toString() }
              })}
              className="w-full"
            >
              View Questionnaire
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedEmployeeId && <OnboardingTaskEditor employeeId={selectedEmployeeId} />}
    </div>
  );
}
