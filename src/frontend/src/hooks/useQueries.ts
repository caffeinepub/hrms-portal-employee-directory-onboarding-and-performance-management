import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  EmployeeProfile,
  CreateEmployeeProfileArgs,
  UpdateEmployeeProfileArgs,
  OnboardingTask,
  Goal,
  PerformanceReviewCycle,
  Review,
  EmployeeId,
  TaskId,
  TaskStatus,
  GoalId,
  GoalStatus,
  CycleId,
  ReviewId,
  UserRole,
} from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// Role Queries
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Employee Queries
export function useGetMyEmployeeId() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<EmployeeId | null>({
    queryKey: ['myEmployeeId'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyEmployeeId();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetEmployee(employeeId: EmployeeId | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<EmployeeProfile | null>({
    queryKey: ['employee', employeeId?.toString()],
    queryFn: async () => {
      if (!actor || !employeeId) return null;
      return actor.getEmployee(employeeId);
    },
    enabled: !!actor && !actorFetching && !!employeeId,
  });
}

export function useSearchEmployees(searchTerm: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<EmployeeProfile[]>({
    queryKey: ['employees', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchEmployees(searchTerm);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeProfileArgs) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createEmployee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create employee: ${error.message}`);
    },
  });
}

export function useUpdateEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: EmployeeId; data: UpdateEmployeeProfileArgs }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateEmployee(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id.toString()] });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });
}

// Onboarding Queries
export function useGetOnboardingTasks(employeeId: EmployeeId | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OnboardingTask[] | null>({
    queryKey: ['onboardingTasks', employeeId?.toString()],
    queryFn: async () => {
      if (!actor || !employeeId) return null;
      return actor.getOnboardingTasks(employeeId);
    },
    enabled: !!actor && !actorFetching && !!employeeId,
  });
}

export function useAssignOnboardingTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, tasks }: { employeeId: EmployeeId; tasks: OnboardingTask[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignOnboardingTasks(employeeId, tasks);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingTasks', variables.employeeId.toString()] });
      toast.success('Onboarding tasks assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign tasks: ${error.message}`);
    },
  });
}

export function useUpdateOnboardingTaskStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      taskId,
      newStatus,
    }: {
      employeeId: EmployeeId;
      taskId: TaskId;
      newStatus: TaskStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOnboardingTaskStatus(employeeId, taskId, newStatus);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingTasks', variables.employeeId.toString()] });
      toast.success('Task status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

// Performance Goals Queries
export function useGetEmployeeGoals(employeeId: EmployeeId | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Goal[] | null>({
    queryKey: ['goals', employeeId?.toString()],
    queryFn: async () => {
      if (!actor || !employeeId) return null;
      return actor.getEmployeeGoals(employeeId);
    },
    enabled: !!actor && !actorFetching && !!employeeId,
  });
}

export function useAddGoals() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, goals }: { employeeId: EmployeeId; goals: Goal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addGoals(employeeId, goals);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.employeeId.toString()] });
      toast.success('Goals added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add goals: ${error.message}`);
    },
  });
}

export function useUpdateGoalProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      goalId,
      progress,
      status,
    }: {
      employeeId: EmployeeId;
      goalId: GoalId;
      progress: bigint;
      status: GoalStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGoalProgress(employeeId, goalId, progress, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.employeeId.toString()] });
      toast.success('Goal progress updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update goal: ${error.message}`);
    },
  });
}

// Performance Review Queries
export function useGetAllPerformanceCycles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PerformanceReviewCycle[]>({
    queryKey: ['performanceCycles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPerformanceCycles();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPerformanceCycle(cycleId: CycleId | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PerformanceReviewCycle | null>({
    queryKey: ['performanceCycle', cycleId?.toString()],
    queryFn: async () => {
      if (!actor || !cycleId) return null;
      return actor.getPerformanceCycle(cycleId);
    },
    enabled: !!actor && !actorFetching && !!cycleId,
  });
}

export function useCreatePerformanceCycle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cycle: PerformanceReviewCycle) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPerformanceCycle(cycle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceCycles'] });
      toast.success('Performance cycle created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create cycle: ${error.message}`);
    },
  });
}

export function useGetEmployeeReviews(employeeId: EmployeeId | null | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Review[] | null>({
    queryKey: ['reviews', employeeId?.toString()],
    queryFn: async () => {
      if (!actor || !employeeId) return null;
      return actor.getEmployeeReviews(employeeId);
    },
    enabled: !!actor && !actorFetching && !!employeeId,
  });
}

export function useCreateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, cycleId }: { employeeId: EmployeeId; cycleId: CycleId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createReview(employeeId, cycleId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.employeeId.toString()] });
      toast.success('Review created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create review: ${error.message}`);
    },
  });
}

export function useSubmitSelfReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      reviewId,
      selfReviewText,
    }: {
      employeeId: EmployeeId;
      reviewId: ReviewId;
      selfReviewText: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitSelfReview(employeeId, reviewId, selfReviewText);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.employeeId.toString()] });
      toast.success('Self review submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });
}

export function useSubmitManagerReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      reviewId,
      managerReviewText,
    }: {
      employeeId: EmployeeId;
      reviewId: ReviewId;
      managerReviewText: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitManagerReview(employeeId, reviewId, managerReviewText);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.employeeId.toString()] });
      toast.success('Manager review submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });
}

export function useSubmitHRReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      reviewId,
      hrReviewText,
    }: {
      employeeId: EmployeeId;
      reviewId: ReviewId;
      hrReviewText: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitHRReview(employeeId, reviewId, hrReviewText);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.employeeId.toString()] });
      toast.success('HR review submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });
}
