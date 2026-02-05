import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { useAccessGate } from './hooks/useAccessGate';
import { useEffect, useState } from 'react';
import AccessGateScreen from './components/auth/AccessGateScreen';
import LoginScreen from './components/auth/LoginScreen';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeeDirectoryPage from './pages/employees/EmployeeDirectoryPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import MyProfilePage from './pages/employees/MyProfilePage';
import OnboardingEmployeePage from './pages/onboarding/OnboardingEmployeePage';
import OnboardingAdminPage from './pages/onboarding/OnboardingAdminPage';
import OnboardingQuestionnairePage from './pages/onboarding/OnboardingQuestionnairePage';
import GoalsPage from './pages/performance/GoalsPage';
import ReviewsPage from './pages/performance/ReviewsPage';
import AppraisalPage from './pages/performance/AppraisalPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isGateCompleted, storedName } = useAccessGate();
  const saveProfile = useSaveCallerUserProfile();
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const isAuthenticated = !!identity;

  // Automatic profile bootstrap after login
  useEffect(() => {
    const autoSaveProfile = async () => {
      // Only auto-save if:
      // 1. User is authenticated
      // 2. Profile query has completed (isFetched)
      // 3. No profile exists yet
      // 4. We have a stored name from the access gate
      // 5. We're not already in the process of saving
      if (isAuthenticated && isFetched && userProfile === null && storedName && !isAutoSaving) {
        setIsAutoSaving(true);
        try {
          await saveProfile.mutateAsync({
            name: storedName,
            email: '',
            employeeId: undefined,
          });
        } catch (error) {
          console.error('Auto-save profile failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    };

    autoSaveProfile();
  }, [isAuthenticated, isFetched, userProfile, storedName, isAutoSaving]);

  // Show loading screen during Internet Identity initialization or auto-save
  if (isInitializing || isAutoSaving) {
    return (
      <>
        <div className="app-shell-bg" />
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center readable-surface p-8 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {isAutoSaving ? 'Setting up your profile...' : 'Loading...'}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show access gate first if not completed
  if (!isGateCompleted) {
    return (
      <>
        <div className="app-shell-bg" />
        <div className="relative z-10">
          <AccessGateScreen />
        </div>
      </>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="app-shell-bg" />
        <div className="relative z-10">
          <LoginScreen />
        </div>
      </>
    );
  }

  // Fallback: Show profile setup dialog only if auto-save didn't work and no stored name
  const showProfileSetupFallback = isAuthenticated && !profileLoading && isFetched && userProfile === null && !storedName;

  // Show authenticated app
  return (
    <>
      <div className="app-shell-bg" />
      <div className="relative z-10">
        <AppLayout>
          <Outlet />
        </AppLayout>
        {showProfileSetupFallback && <ProfileSetupDialog suggestedName={storedName} />}
      </div>
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees',
  component: EmployeeDirectoryPage,
});

const employeeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees/$employeeId',
  component: EmployeeDetailPage,
});

const myProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-profile',
  component: MyProfilePage,
});

const onboardingEmployeeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingEmployeePage,
});

const onboardingAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding/admin',
  component: OnboardingAdminPage,
});

const onboardingQuestionnaireRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding/questionnaire',
  component: OnboardingQuestionnairePage,
});

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/performance/goals',
  component: GoalsPage,
});

const reviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/performance/reviews',
  component: ReviewsPage,
});

const appraisalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/performance/appraisal',
  component: AppraisalPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  employeesRoute,
  employeeDetailRoute,
  myProfileRoute,
  onboardingEmployeeRoute,
  onboardingAdminRoute,
  onboardingQuestionnaireRoute,
  goalsRoute,
  reviewsRoute,
  appraisalRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
