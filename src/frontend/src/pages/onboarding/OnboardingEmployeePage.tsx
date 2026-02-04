import { useGetMyEmployeeId, useGetOnboardingTasks, useUpdateOnboardingTaskStatus } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, ExternalLink } from 'lucide-react';
import { TaskStatus } from '../../backend';
import type { TaskStatus as TaskStatusType } from '../../backend';

export default function OnboardingEmployeePage() {
  const { data: myEmployeeId } = useGetMyEmployeeId();
  const { data: tasks, isLoading } = useGetOnboardingTasks(myEmployeeId);
  const updateTaskStatus = useUpdateOnboardingTaskStatus();

  const completedTasks = tasks?.filter((task) => task.status === TaskStatus.done).length || 0;
  const totalTasks = tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleStatusChange = (taskId: bigint, newStatus: TaskStatusType) => {
    if (myEmployeeId) {
      updateTaskStatus.mutate({ employeeId: myEmployeeId, taskId, newStatus });
    }
  };

  const getStatusIcon = (status: TaskStatusType) => {
    switch (status) {
      case TaskStatus.done:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case TaskStatus.inProgress:
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TaskStatusType) => {
    switch (status) {
      case TaskStatus.done:
        return <Badge variant="default">Done</Badge>;
      case TaskStatus.inProgress:
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding tasks...</p>
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Onboarding</h1>
          <p className="text-muted-foreground mt-1">Track your onboarding progress</p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              No onboarding tasks assigned yet. Your HR team will assign tasks soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Onboarding</h1>
        <p className="text-muted-foreground mt-1">Complete your onboarding tasks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {completedTasks} of {totalTasks} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tasks.map((task) => {
          const dueDate = new Date(Number(task.dueDate) / 1000000);
          const isOverdue = dueDate < new Date() && task.status !== TaskStatus.done;

          return (
            <Card key={task.id.toString()} className={isOverdue ? 'border-destructive' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription className="mt-1">{task.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Due Date: </span>
                    <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                      {dueDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {task.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{task.notes}</p>
                  </div>
                )}

                {task.links && (
                  <div>
                    <p className="text-sm font-medium mb-1">Resources:</p>
                    <a
                      href={task.links}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {task.links}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {task.status !== TaskStatus.done && (
                    <>
                      {task.status === TaskStatus.notStarted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, TaskStatus.inProgress)}
                          disabled={updateTaskStatus.isPending}
                        >
                          Start Task
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(task.id, TaskStatus.done)}
                        disabled={updateTaskStatus.isPending}
                      >
                        Mark as Done
                      </Button>
                    </>
                  )}
                  {task.status === TaskStatus.done && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, TaskStatus.inProgress)}
                      disabled={updateTaskStatus.isPending}
                    >
                      Reopen Task
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
