import { ReactNode } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../../hooks/useQueries';
import { Home, Users, ClipboardList, Target, LogOut, User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import GlobalSearchBar from '../search/GlobalSearchBar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home, adminOnly: false },
    { label: 'Employees', path: '/employees', icon: Users, adminOnly: true },
    { label: 'My Profile', path: '/my-profile', icon: User, adminOnly: false },
    { label: 'My Onboarding', path: '/onboarding', icon: ClipboardList, adminOnly: false },
    { label: 'Manage Onboarding', path: '/onboarding/admin', icon: ClipboardList, adminOnly: true },
    { label: 'Onboarding Questionnaire', path: '/onboarding/questionnaire', icon: ClipboardList, adminOnly: false },
    { label: 'Goals', path: '/performance/goals', icon: Target, adminOnly: false },
    { label: 'Reviews', path: '/performance/reviews', icon: Target, adminOnly: false },
    { label: 'Performance Appraisal', path: '/performance/appraisal', icon: Target, adminOnly: false },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const NavLinks = () => (
    <>
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate({ to: item.path })}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent transition-colors text-left w-full"
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b readable-nav">
        <div className="container flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 readable-surface">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/generated/hrms-logo.dim_512x512.png"
                        alt="HRMS"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="font-bold text-lg">HRMS Portal</span>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-1">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/hrms-logo.dim_512x512.png"
                alt="HRMS"
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-lg hidden sm:inline">HRMS Portal</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden lg:block">
            <GlobalSearchBar />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline">{userProfile?.name || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userProfile?.name || 'User'}</p>
                  {userProfile?.email && (
                    <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                  )}
                  {isAdmin && (
                    <p className="text-xs font-medium text-primary">Admin</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Mobile Search */}
        <div className="lg:hidden px-4 pb-3">
          <GlobalSearchBar />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 border-r readable-nav min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="flex-1 p-4 space-y-1">
            <NavLinks />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto readable-surface rounded-lg p-6 md:p-8">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t readable-nav mt-12">
        <div className="container py-6 px-4 text-center text-sm text-muted-foreground">
          © 2026. Built with love using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
