import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type GoalId = bigint;
export type SearchResult = {
    __kind__: "review";
    review: {
        review: Review;
        employeeId: EmployeeId;
    };
} | {
    __kind__: "onboardingTask";
    onboardingTask: {
        task: OnboardingTask;
        employeeId: EmployeeId;
    };
} | {
    __kind__: "goal";
    goal: {
        goal: Goal;
        employeeId: EmployeeId;
    };
} | {
    __kind__: "questionnaireResponse";
    questionnaireResponse: {
        employeeId: EmployeeId;
        response: QuestionnaireResponse;
    };
} | {
    __kind__: "employee";
    employee: EmployeeProfile;
} | {
    __kind__: "appraisal";
    appraisal: AppraisalDetails;
};
export type Time = bigint;
export interface Goal {
    id: GoalId;
    status: GoalStatus;
    title: string;
    endDate: Time;
    description: string;
    progress: bigint;
    startDate: Time;
}
export type ExternalEmployeeId = string;
export type CycleId = bigint;
export interface AppraisalDetails {
    employeeName: string;
    teamwork: string;
    overallRatingPercent: bigint;
    createdAt: Time;
    timeliness: string;
    feedback: Array<string>;
    qualityOfWork: string;
    appraisalType: string;
    communicationSkills: string;
    appraisalPeriod: string;
    jobTitle: string;
    employeeId: EmployeeId;
    incrementPercent: bigint;
    grade: string;
    workCompletionPercent: bigint;
    criteria: Array<string>;
    department: string;
    reasonForIncrement: string;
}
export interface OnboardingResponse {
    response: string;
    timestamp: Time;
    questionId: bigint;
}
export interface UpdateEmployeeProfileArgs {
    status?: EmploymentStatus;
    manager?: string;
    externalEmployeeId?: ExternalEmployeeId;
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
export interface QuestionnaireResponse {
    responses: Array<OnboardingResponse>;
    submittedAt: Time;
    submittedBy: Principal;
    employeeId: EmployeeId;
}
export interface PerformanceReviewCycle {
    id: CycleId;
    status: CycleStatus;
    title: string;
    endDate: Time;
    startDate: Time;
}
export type ReviewId = bigint;
export interface EmployeeProfile {
    id: EmployeeId;
    status: EmploymentStatus;
    manager: string;
    externalEmployeeId?: ExternalEmployeeId;
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
export type EmployeeId = bigint;
export interface CreateEmployeeProfileArgs {
    manager: string;
    externalEmployeeId?: ExternalEmployeeId;
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
export interface UserProfile {
    name: string;
    email: string;
    employeeId?: EmployeeId;
}
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
    ensureUserProfile(name: string, email: string): Promise<Principal>;
    getAllPerformanceCycles(): Promise<Array<PerformanceReviewCycle>>;
    getAppraisalDetails(employeeId: EmployeeId): Promise<AppraisalDetails | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(id: EmployeeId): Promise<EmployeeProfile | null>;
    getEmployeeGoals(employeeId: EmployeeId): Promise<Array<Goal> | null>;
    getEmployeeReviews(employeeId: EmployeeId): Promise<Array<Review> | null>;
    getMyEmployeeId(): Promise<EmployeeId | null>;
    getOnboardingQuestions(): Promise<Array<string>>;
    getOnboardingTasks(employeeId: EmployeeId): Promise<Array<OnboardingTask> | null>;
    getPerformanceCycle(cycleId: CycleId): Promise<PerformanceReviewCycle | null>;
    getQuestionnaireResponses(employeeId: EmployeeId): Promise<Array<QuestionnaireResponse>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    globalSearch(searchTerm: string): Promise<Array<SearchResult>>;
    isCallerAdmin(): Promise<boolean>;
    saveAppraisalDetails(details: AppraisalDetails): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchAppraisalDetails(searchTerm: string): Promise<Array<AppraisalDetails>>;
    searchEmployees(searchTerm: string): Promise<Array<EmployeeProfile>>;
    submitHRReview(employeeId: EmployeeId, reviewId: ReviewId, hrReviewText: string): Promise<boolean>;
    submitManagerReview(employeeId: EmployeeId, reviewId: ReviewId, managerReviewText: string): Promise<boolean>;
    submitQuestionnaireResponses(employeeId: EmployeeId, responses: Array<OnboardingResponse>): Promise<void>;
    submitSelfReview(employeeId: EmployeeId, reviewId: ReviewId, selfReviewText: string): Promise<boolean>;
    updateEmployee(id: EmployeeId, data: UpdateEmployeeProfileArgs): Promise<boolean>;
    updateGoalProgress(employeeId: EmployeeId, goalId: GoalId, progress: bigint, status: GoalStatus): Promise<boolean>;
    updateOnboardingTaskStatus(employeeId: EmployeeId, taskId: TaskId, newStatus: TaskStatus): Promise<boolean>;
}
