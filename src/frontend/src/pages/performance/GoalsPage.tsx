import { useState } from 'react';
import { useGetMyEmployeeId, useGetEmployeeGoals, useIsCallerAdmin, useSearchEmployees } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import GoalFormDialog from '../../components/performance/GoalFormDialog';
import type { EmployeeId } from '../../backend';

export default function GoalsPage() {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: myEmployeeId } = useGetMyEmployeeId();
  const { data: employees } = useSearchEmployees('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<EmployeeId | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const displayEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : myEmployeeId;
  const { data: goals, isLoading } = useGetEmployeeGoals(displayEmployeeId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'inProgress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Performance Goals</h1>
          <p className="text-muted-foreground mt-1">Track and manage performance goals</p>
        </div>
        {isAdmin && displayEmployeeId && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goals
          </Button>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Select Employee</CardTitle>
            <CardDescription>View and manage goals for a specific employee</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading goals...</p>
          </div>
        </div>
      ) : !goals || goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              {isAdmin && !selectedEmployeeId
                ? 'Select an employee to view their goals.'
                : 'No goals assigned yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const startDate = new Date(Number(goal.startDate) / 1000000);
            const endDate = new Date(Number(goal.endDate) / 1000000);
            const progress = Number(goal.progress);

            return (
              <Card key={goal.id.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription className="mt-1">{goal.description}</CardDescription>
                    </div>
                    {getStatusBadge(goal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start: </span>
                      <span>{startDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End: </span>
                      <span>{endDate.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {!isAdmin && goal.status !== 'completed' && goal.status !== 'failed' && displayEmployeeId && (
                    <GoalFormDialog
                      employeeId={displayEmployeeId}
                      goal={goal}
                      trigger={
                        <Button size="sm" variant="outline">
                          Update Progress
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAddDialog && displayEmployeeId && (
        <GoalFormDialog
          employeeId={displayEmployeeId}
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
