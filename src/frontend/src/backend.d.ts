import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Goal {
    id: GoalId;
    status: GoalStatus;
    title: string;
    endDate: Time;
    description: string;
    progress: bigint;
    startDate: Time;
}
export interface UserProfile {
    name: string;
    email: string;
    employeeId?: EmployeeId;
}
export type Time = bigint;
export type CycleId = bigint;
export interface UpdateEmployeeProfileArgs {
    status?: EmploymentStatus;
    manager?: string;
    name?: string;
    email?: string;
    jobTitle?: string;
    department?: string;
    principalId?: Principal;
}
export interface OnboardingTask {
    id: TaskId;
    status: TaskStatus;
    title: string;
    dueDate: Time;
    description: string;
    links: string;
    notes: string;
}
export type TaskId = bigint;
export interface EmployeeProfile {
    id: EmployeeId;
    status: EmploymentStatus;
    manager: string;
    name: string;
    createdBy: Principal;
    performanceCycleId?: bigint;
    email: string;
    jobTitle: string;
    department: string;
    onboardingPlanId?: bigint;
    principalId?: Principal;
    startDate: Time;
}
export interface PerformanceReviewCycle {
    id: CycleId;
    status: CycleStatus;
    title: string;
    endDate: Time;
    startDate: Time;
}
export type ReviewId = bigint;
export type EmployeeId = bigint;
export interface CreateEmployeeProfileArgs {
    manager: string;
    name: string;
    email: string;
    jobTitle: string;
    department: string;
    principalId?: Principal;
    startDate: Time;
}
export interface Review {
    id: ReviewId;
    hrReview: string;
    status: ReviewStatus;
    managerReview: string;
    selfReview: string;
    employeeId: EmployeeId;
    cycleId: CycleId;
}
export type GoalId = bigint;
export enum CycleStatus {
    active = "active",
    completed = "completed",
    draft = "draft"
}
export enum EmploymentStatus {
    active = "active",
    terminated = "terminated"
}
export enum GoalStatus {
    notStarted = "notStarted",
    completed = "completed",
    inProgress = "inProgress",
    failed = "failed"
}
export enum ReviewStatus {
    pending = "pending",
    completed = "completed"
}
export enum TaskStatus {
    notStarted = "notStarted",
    done = "done",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGoals(employeeId: EmployeeId, newGoals: Array<Goal>): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignOnboardingTasks(employeeId: EmployeeId, tasks: Array<OnboardingTask>): Promise<boolean>;
    createEmployee(data: CreateEmployeeProfileArgs): Promise<EmployeeId | null>;
    createPerformanceCycle(cycle: PerformanceReviewCycle): Promise<CycleId>;
    createReview(employeeId: EmployeeId, cycleId: CycleId): Promise<ReviewId>;
    getAllPerformanceCycles(): Promise<Array<PerformanceReviewCycle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(id: EmployeeId): Promise<EmployeeProfile | null>;
    getEmployeeGoals(employeeId: EmployeeId): Promise<Array<Goal> | null>;
    getEmployeeReviews(employeeId: EmployeeId): Promise<Array<Review> | null>;
    getMyEmployeeId(): Promise<EmployeeId | null>;
    getOnboardingTasks(employeeId: EmployeeId): Promise<Array<OnboardingTask> | null>;
    getPerformanceCycle(cycleId: CycleId): Promise<PerformanceReviewCycle | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchEmployees(searchTerm: string): Promise<Array<EmployeeProfile>>;
    submitHRReview(employeeId: EmployeeId, reviewId: ReviewId, hrReviewText: string): Promise<boolean>;
    submitManagerReview(employeeId: EmployeeId, reviewId: ReviewId, managerReviewText: string): Promise<boolean>;
    submitSelfReview(employeeId: EmployeeId, reviewId: ReviewId, selfReviewText: string): Promise<boolean>;
    updateEmployee(id: EmployeeId, data: UpdateEmployeeProfileArgs): Promise<boolean>;
    updateGoalProgress(employeeId: EmployeeId, goalId: GoalId, progress: bigint, status: GoalStatus): Promise<boolean>;
    updateOnboardingTaskStatus(employeeId: EmployeeId, taskId: TaskId, newStatus: TaskStatus): Promise<boolean>;
}
