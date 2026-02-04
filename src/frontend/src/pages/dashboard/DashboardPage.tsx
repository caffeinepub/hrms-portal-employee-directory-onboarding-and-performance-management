import { useGetMyEmployeeId, useGetEmployee, useGetOnboardingTasks, useIsCallerAdmin } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, ClipboardList, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: myEmployeeId } = useGetMyEmployeeId();
  const { data: myEmployee } = useGetEmployee(myEmployeeId);
  const { data: onboardingTasks } = useGetOnboardingTasks(myEmployeeId);

  const completedTasks = onboardingTasks?.filter((task) => task.status === 'done').length || 0;
  const totalTasks = onboardingTasks?.length || 0;
  const onboardingProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <img
          src="/assets/generated/hrms-hero.dim_1600x600.png"
          alt="HRMS Dashboard"
          className="w-full h-48 md:h-64 object-cover opacity-20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2 px-4">
            <h1 className="text-3xl md:text-4xl font-bold">Welcome back, {myEmployee?.name || 'User'}!</h1>
            <p className="text-muted-foreground text-lg">
              {isAdmin ? 'Manage your team and HR operations' : 'Track your progress and goals'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/my-profile' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Profile</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myEmployee?.jobTitle || 'Employee'}</div>
            <p className="text-xs text-muted-foreground">{myEmployee?.department || 'Department'}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/onboarding' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTasks}/{totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/performance/goals' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">View your goals</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/performance/reviews' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Performance</div>
            <p className="text-xs text-muted-foreground">Track reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Progress */}
      {totalTasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
            <CardDescription>Complete your onboarding tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(onboardingProgress)}%</span>
              </div>
              <Progress value={onboardingProgress} className="h-2" />
            </div>
            <Button onClick={() => navigate({ to: '/onboarding' })} className="w-full sm:w-auto">
              View Onboarding Tasks
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to key areas of the portal</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate({ to: '/my-profile' })}>
            <Users className="h-6 w-6" />
            <span>View My Profile</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate({ to: '/performance/goals' })}>
            <Target className="h-6 w-6" />
            <span>My Goals</span>
          </Button>
          {isAdmin && (
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate({ to: '/employees' })}>
              <Users className="h-6 w-6" />
              <span>Manage Employees</span>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
