import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  type EmployeeId = Nat;
  type TaskId = Nat;
  type GoalId = Nat;
  type CycleId = Nat;
  type ReviewId = Nat;
  type ExternalEmployeeId = Text;

  type OnboardingResponse = {
    questionId : Nat;
    response : Text;
    timestamp : Time.Time;
  };

  type QuestionnaireResponse = {
    employeeId : EmployeeId;
    responses : [OnboardingResponse];
    submittedBy : Principal;
    submittedAt : Time.Time;
  };

  type AppraisalDetails = {
    employeeId : EmployeeId;
    employeeName : Text;
    department : Text;
    jobTitle : Text;
    appraisalPeriod : Text;
    workCompletionPercent : Nat;
    qualityOfWork : Text;
    timeliness : Text;
    teamwork : Text;
    communicationSkills : Text;
    overallRatingPercent : Nat;
    grade : Text;
    appraisalType : Text;
    incrementPercent : Nat;
    reasonForIncrement : Text;
    criteria : [Text];
    feedback : [Text];
    createdAt : Time.Time;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    employeeId : ?EmployeeId;
  };

  type OldEmployeeProfile = {
    id : EmployeeId;
    name : Text;
    email : Text;
    department : Text;
    jobTitle : Text;
    manager : Text;
    startDate : Time.Time;
    status : EmploymentStatus;
    createdBy : Principal;
    onboardingPlanId : ?Nat;
    performanceCycleId : ?Nat;
    principalId : ?Principal;
  };

  type NewEmployeeProfile = {
    id : EmployeeId;
    name : Text;
    email : Text;
    department : Text;
    jobTitle : Text;
    manager : Text;
    startDate : Time.Time;
    status : EmploymentStatus;
    createdBy : Principal;
    onboardingPlanId : ?Nat;
    performanceCycleId : ?Nat;
    principalId : ?Principal;
    externalEmployeeId : ?ExternalEmployeeId;
  };

  type EmploymentStatus = {
    #active;
    #terminated;
  };

  type OnboardingTask = {
    id : TaskId;
    title : Text;
    description : Text;
    dueDate : Time.Time;
    status : TaskStatus;
    notes : Text;
    links : Text;
  };

  type TaskStatus = {
    #notStarted;
    #inProgress;
    #done;
  };

  type Goal = {
    id : GoalId;
    title : Text;
    description : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : GoalStatus;
    progress : Nat;
  };

  type GoalStatus = {
    #notStarted;
    #inProgress;
    #completed;
    #failed;
  };

  type PerformanceReviewCycle = {
    id : CycleId;
    title : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : CycleStatus;
  };

  type CycleStatus = {
    #active;
    #completed;
    #draft;
  };

  type Review = {
    id : ReviewId;
    employeeId : EmployeeId;
    cycleId : CycleId;
    selfReview : Text;
    managerReview : Text;
    hrReview : Text;
    status : ReviewStatus;
  };

  type ReviewStatus = {
    #pending;
    #completed;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    employees : Map.Map<EmployeeId, OldEmployeeProfile>;
    principalToEmployee : Map.Map<Principal, EmployeeId>;
    onboardingTasks : Map.Map<EmployeeId, List.List<OnboardingTask>>;
    goals : Map.Map<EmployeeId, List.List<Goal>>;
    performanceCycles : Map.Map<CycleId, PerformanceReviewCycle>;
    reviews : Map.Map<EmployeeId, List.List<Review>>;
    questionnaireResponses : Map.Map<EmployeeId, List.List<QuestionnaireResponse>>;
    appraisalDetails : Map.Map<EmployeeId, AppraisalDetails>;
    idCounter : Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    employees : Map.Map<EmployeeId, NewEmployeeProfile>;
    principalToEmployee : Map.Map<Principal, EmployeeId>;
    onboardingTasks : Map.Map<EmployeeId, List.List<OnboardingTask>>;
    goals : Map.Map<EmployeeId, List.List<Goal>>;
    performanceCycles : Map.Map<CycleId, PerformanceReviewCycle>;
    reviews : Map.Map<EmployeeId, List.List<Review>>;
    questionnaireResponses : Map.Map<EmployeeId, List.List<QuestionnaireResponse>>;
    appraisalDetails : Map.Map<EmployeeId, AppraisalDetails>;
    idCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let employees = old.employees.map<EmployeeId, OldEmployeeProfile, NewEmployeeProfile>(
      func(_id, oldEmployeeProfile) {
        { oldEmployeeProfile with externalEmployeeId = null };
      }
    );
    { old with employees };
  };
};
