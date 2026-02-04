import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetEmployee, useIsCallerAdmin } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Mail, Briefcase, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import EmployeeFormDialog from '../../components/employees/EmployeeFormDialog';

export default function EmployeeDetailPage() {
  const { employeeId } = useParams({ from: '/employees/$employeeId' });
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: employee, isLoading } = useGetEmployee(BigInt(employeeId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button onClick={() => navigate({ to: '/employees' })} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  const startDate = new Date(Number(employee.startDate) / 1000000);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/employees' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{employee.name}</h1>
          <p className="text-muted-foreground">{employee.jobTitle}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Employee contact and basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{employee.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Manager</p>
                <p className="text-sm text-muted-foreground">{employee.manager}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">{startDate.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Status</CardTitle>
            <CardDescription>Current employment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                {employee.status === 'active' ? 'Active' : 'Terminated'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Employee ID</p>
              <p className="text-sm text-muted-foreground font-mono">{employee.id.toString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access related employee information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate({ to: '/onboarding/admin' })}
          >
            Onboarding Tasks
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate({ to: '/performance/goals' })}
          >
            Performance Goals
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate({ to: '/performance/reviews' })}
          >
            Reviews
          </Button>
        </CardContent>
      </Card>

      {showEditDialog && (
        <EmployeeFormDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          employee={employee}
        />
      )}
    </div>
  );
}
