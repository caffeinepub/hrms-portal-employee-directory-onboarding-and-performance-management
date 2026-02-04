import { useGetMyEmployeeId, useGetEmployee } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Briefcase, Calendar, User } from 'lucide-react';

export default function MyProfilePage() {
  const { data: myEmployeeId, isLoading: idLoading } = useGetMyEmployeeId();
  const { data: employee, isLoading: employeeLoading } = useGetEmployee(myEmployeeId);

  const isLoading = idLoading || employeeLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Your employee profile has not been created yet. Please contact your HR administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = new Date(Number(employee.startDate) / 1000000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{employee.name}</h1>
        <p className="text-muted-foreground mt-1">{employee.jobTitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your contact and basic details</CardDescription>
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
            <CardDescription>Your current employment information</CardDescription>
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
    </div>
  );
}
