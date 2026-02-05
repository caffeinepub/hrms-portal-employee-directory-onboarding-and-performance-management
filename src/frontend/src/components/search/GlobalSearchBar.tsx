import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGlobalSearch, useIsCallerAdmin } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Search, User, ClipboardList, Target, Award } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: results, isLoading } = useGlobalSearch(debouncedSearchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [searchTerm]);

  const handleSelect = (result: any) => {
    if (result.__kind__ === 'employee') {
      navigate({ to: `/employees/${result.employee.id.toString()}` });
    } else if (result.__kind__ === 'onboardingTask') {
      navigate({ 
        to: '/onboarding/admin',
        search: { employeeId: result.onboardingTask.employeeId.toString() }
      });
    } else if (result.__kind__ === 'questionnaireResponse') {
      navigate({ 
        to: '/onboarding/questionnaire',
        search: { employeeId: result.questionnaireResponse.employeeId.toString() }
      });
    } else if (result.__kind__ === 'goal') {
      navigate({ 
        to: '/performance/goals',
        search: { employeeId: result.goal.employeeId.toString() }
      });
    } else if (result.__kind__ === 'review') {
      navigate({ 
        to: '/performance/reviews',
        search: { employeeId: result.review.employeeId.toString() }
      });
    } else if (result.__kind__ === 'appraisal') {
      navigate({ 
        to: '/performance/appraisal',
        search: { employeeId: result.appraisal.employeeId.toString() }
      });
    }
    setSearchTerm('');
    setOpen(false);
  };

  if (!isAdmin) {
    return null;
  }

  const employeeResults = results?.filter((r) => r.__kind__ === 'employee') || [];
  const onboardingResults = results?.filter((r) => 
    r.__kind__ === 'onboardingTask' || r.__kind__ === 'questionnaireResponse'
  ) || [];
  const performanceResults = results?.filter((r) => 
    r.__kind__ === 'goal' || r.__kind__ === 'review' || r.__kind__ === 'appraisal'
  ) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees, tasks, goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : !results || results.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <>
                {employeeResults.length > 0 && (
                  <CommandGroup heading="Employees">
                    {employeeResults.map((result, idx) => {
                      if (result.__kind__ === 'employee') {
                        const emp = result.employee;
                        return (
                          <CommandItem
                            key={`emp-${idx}`}
                            onSelect={() => handleSelect(result)}
                            className="cursor-pointer"
                          >
                            <User className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">{emp.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {emp.jobTitle} • ID: {emp.id.toString()}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      }
                      return null;
                    })}
                  </CommandGroup>
                )}

                {onboardingResults.length > 0 && (
                  <CommandGroup heading="Onboarding">
                    {onboardingResults.map((result, idx) => {
                      if (result.__kind__ === 'onboardingTask') {
                        const task = result.onboardingTask.task;
                        return (
                          <CommandItem
                            key={`task-${idx}`}
                            onSelect={() => handleSelect(result)}
                            className="cursor-pointer"
                          >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Employee ID: {result.onboardingTask.employeeId.toString()}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      } else if (result.__kind__ === 'questionnaireResponse') {
                        return (
                          <CommandItem
                            key={`quest-${idx}`}
                            onSelect={() => handleSelect(result)}
                            className="cursor-pointer"
                          >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">Questionnaire Response</div>
                              <div className="text-xs text-muted-foreground">
                                Employee ID: {result.questionnaireResponse.employeeId.toString()}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      }
                      return null;
                    })}
                  </CommandGroup>
                )}

                {performanceResults.length > 0 && (
                  <CommandGroup heading="Performance">
                    {performanceResults.map((result, idx) => {
                      if (result.__kind__ === 'goal') {
                        const goal = result.goal.goal;
                        return (
                          <CommandItem
                            key={`goal-${idx}`}
                            onSelect={() => handleSelect(result)}
                            className="cursor-pointer"
                          >
                            <Target className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">{goal.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Goal • Employee ID: {result.goal.employeeId.toString()}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      } else if (result.__kind__ === 'review') {
                        const review = result.review.review;
                        return (
                          <CommandItem
                            key={`review-${idx}`}
                            onSelect={() => handleSelect(result)}
                            className="cursor-pointer"
                          >
                            <Target className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">Performance Review</div>
                              <div className="text-xs text-muted-foreground">
                                Review ID: {review.id.toString()} • Employee ID: {result.review.employeeId.toString()}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      } else if (result.__kind__ === 'appraisal') {
                        const appraisal = result.appraisal;
                        return (
                          <CommandItem
                            key={`appraisal-${idx}`}
                            onSelect={() => handleSelect(result)}
                            className="cursor-pointer"
                          >
                            <Award className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">{appraisal.employeeName}</div>
                              <div className="text-xs text-muted-foreground">
                                Appraisal • {appraisal.appraisalPeriod}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      }
                      return null;
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
