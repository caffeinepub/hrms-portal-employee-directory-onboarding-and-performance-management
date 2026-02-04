import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginScreen from './components/auth/LoginScreen';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeeDirectoryPage from './pages/employees/EmployeeDirectoryPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import MyProfilePage from './pages/employees/MyProfilePage';
import OnboardingEmployeePage from './pages/onboarding/OnboardingEmployeePage';
import OnboardingAdminPage from './pages/onboarding/OnboardingAdminPage';
import GoalsPage from './pages/performance/GoalsPage';
import ReviewsPage from './pages/performance/ReviewsPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      {showProfileSetup && <ProfileSetupDialog />}
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  employeesRoute,
  employeeDetailRoute,
  myProfileRoute,
  onboardingEmployeeRoute,
  onboardingAdminRoute,
  goalsRoute,
  reviewsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
