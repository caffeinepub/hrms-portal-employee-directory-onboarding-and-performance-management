import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type EmployeeId = Nat;
  type TaskId = Nat;
  type GoalId = Nat;
  type CycleId = Nat;
  type ReviewId = Nat;

  var idCounter = 0;

  func nextId() : Nat {
    idCounter += 1;
    idCounter;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    employeeId : ?EmployeeId;
  };

  type EmployeeProfile = {
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

  let userProfiles = Map.empty<Principal, UserProfile>();
  let employees = Map.empty<EmployeeId, EmployeeProfile>();
  let principalToEmployee = Map.empty<Principal, EmployeeId>();
  let onboardingTasks = Map.empty<EmployeeId, List.List<OnboardingTask>>();
  let goals = Map.empty<EmployeeId, List.List<Goal>>();
  let performanceCycles = Map.empty<CycleId, PerformanceReviewCycle>();
  let reviews = Map.empty<EmployeeId, List.List<Review>>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper function to check if caller owns employee record
  func isEmployeeOwner(caller : Principal, employeeId : EmployeeId) : Bool {
    switch (principalToEmployee.get(caller)) {
      case (?eid) { eid == employeeId };
      case null { false };
    };
  };

  // Employee Management
  type CreateEmployeeProfileArgs = {
    name : Text;
    email : Text;
    department : Text;
    jobTitle : Text;
    manager : Text;
    startDate : Time.Time;
    principalId : ?Principal;
  };

  public shared ({ caller }) func createEmployee(data : CreateEmployeeProfileArgs) : async ?EmployeeId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create employees");
    };

    let id = nextId();
    let profile : EmployeeProfile = {
      id;
      name = data.name;
      email = data.email;
      department = data.department;
      jobTitle = data.jobTitle;
      manager = data.manager;
      startDate = data.startDate;
      status = #active;
      createdBy = caller;
      onboardingPlanId = null;
      performanceCycleId = null;
      principalId = data.principalId;
    };

    employees.add(id, profile);

    switch (data.principalId) {
      case (?pid) { principalToEmployee.add(pid, id) };
      case null {};
    };

    ?id;
  };

  type UpdateEmployeeProfileArgs = {
    name : ?Text;
    email : ?Text;
    department : ?Text;
    jobTitle : ?Text;
    manager : ?Text;
    status : ?EmploymentStatus;
    principalId : ?Principal;
  };

  public shared ({ caller }) func updateEmployee(id : EmployeeId, data : UpdateEmployeeProfileArgs) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update employees");
    };

    switch (employees.get(id)) {
      case null { false };
      case (?existing) {
        let updated : EmployeeProfile = {
          id = existing.id;
          name = switch (data.name) { case (?n) n; case null existing.name };
          email = switch (data.email) { case (?e) e; case null existing.email };
          department = switch (data.department) { case (?d) d; case null existing.department };
          jobTitle = switch (data.jobTitle) { case (?j) j; case null existing.jobTitle };
          manager = switch (data.manager) { case (?m) m; case null existing.manager };
          startDate = existing.startDate;
          status = switch (data.status) { case (?s) s; case null existing.status };
          createdBy = existing.createdBy;
          onboardingPlanId = existing.onboardingPlanId;
          performanceCycleId = existing.performanceCycleId;
          principalId = switch (data.principalId) { case (?p) ?p; case null existing.principalId };
        };

        employees.add(id, updated);

        switch (updated.principalId) {
          case (?pid) { principalToEmployee.add(pid, id) };
          case null {};
        };

        true;
      };
    };
  };

  public query ({ caller }) func getEmployee(id : EmployeeId) : async ?EmployeeProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view employees");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, id)) {
      Runtime.trap("Unauthorized: Can only view your own employee record");
    };

    employees.get(id);
  };

  public query ({ caller }) func searchEmployees(searchTerm : Text) : async [EmployeeProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can search all employees");
    };

    let results = List.empty<EmployeeProfile>();

    for ((_, employee) in employees.entries()) {
      if (
        employee.name.contains(#text searchTerm) or
        employee.email.contains(#text searchTerm) or
        employee.department.contains(#text searchTerm) or
        employee.jobTitle.contains(#text searchTerm)
      ) {
        results.add(employee);
      };
    };

    results.toArray();
  };

  public query ({ caller }) func getMyEmployeeId() : async ?EmployeeId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get employee ID");
    };
    principalToEmployee.get(caller);
  };

  // Onboarding Tasks
  public shared ({ caller }) func assignOnboardingTasks(employeeId : EmployeeId, tasks : [OnboardingTask]) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign onboarding tasks");
    };

    let tasksList = List.fromArray<OnboardingTask>(tasks);
    onboardingTasks.add(employeeId, tasksList);
    true;
  };

  public query ({ caller }) func getOnboardingTasks(employeeId : EmployeeId) : async ?[OnboardingTask] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view onboarding tasks");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only view your own onboarding tasks");
    };

    switch (onboardingTasks.get(employeeId)) {
      case null { null };
      case (?taskList) { ?taskList.toArray() };
    };
  };

  public shared ({ caller }) func updateOnboardingTaskStatus(employeeId : EmployeeId, taskId : TaskId, newStatus : TaskStatus) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update tasks");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only update your own onboarding tasks");
    };

    switch (onboardingTasks.get(employeeId)) {
      case null { false };
      case (?taskList) {
        let updatedList = List.empty<OnboardingTask>();
        var found = false;

        for (task in taskList.values()) {
          if (task.id == taskId) {
            let updatedTask = {
              id = task.id;
              title = task.title;
              description = task.description;
              dueDate = task.dueDate;
              status = newStatus;
              notes = task.notes;
              links = task.links;
            };
            updatedList.add(updatedTask);
            found := true;
          } else {
            updatedList.add(task);
          };
        };

        if (found) {
          onboardingTasks.add(employeeId, updatedList);
          true;
        } else {
          false;
        };
      };
    };
  };

  // Performance Goals
  public shared ({ caller }) func addGoals(employeeId : EmployeeId, newGoals : [Goal]) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add goals");
    };

    let goalsList = List.fromArray<Goal>(newGoals);
    goals.add(employeeId, goalsList);
    true;
  };

  public query ({ caller }) func getEmployeeGoals(employeeId : EmployeeId) : async ?[Goal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view goals");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only view your own goals");
    };

    switch (goals.get(employeeId)) {
      case null { null };
      case (?goalList) { ?goalList.toArray() };
    };
  };

  public shared ({ caller }) func updateGoalProgress(employeeId : EmployeeId, goalId : GoalId, progress : Nat, status : GoalStatus) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update goals");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only update your own goals");
    };

    switch (goals.get(employeeId)) {
      case null { false };
      case (?goalList) {
        let updatedList = List.empty<Goal>();
        var found = false;

        for (goal in goalList.values()) {
          if (goal.id == goalId) {
            let updatedGoal = {
              id = goal.id;
              title = goal.title;
              description = goal.description;
              startDate = goal.startDate;
              endDate = goal.endDate;
              status = status;
              progress = progress;
            };
            updatedList.add(updatedGoal);
            found := true;
          } else {
            updatedList.add(goal);
          };
        };

        if (found) {
          goals.add(employeeId, updatedList);
          true;
        } else {
          false;
        };
      };
    };
  };

  // Performance Cycles
  public shared ({ caller }) func createPerformanceCycle(cycle : PerformanceReviewCycle) : async CycleId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create performance cycles");
    };

    let id = nextId();
    let cycleWithId = {
      id;
      title = cycle.title;
      startDate = cycle.startDate;
      endDate = cycle.endDate;
      status = cycle.status;
    };
    performanceCycles.add(id, cycleWithId);
    id;
  };

  public query ({ caller }) func getPerformanceCycle(cycleId : CycleId) : async ?PerformanceReviewCycle {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view performance cycles");
    };
    performanceCycles.get(cycleId);
  };

  public query ({ caller }) func getAllPerformanceCycles() : async [PerformanceReviewCycle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view performance cycles");
    };

    let cycleList = List.empty<PerformanceReviewCycle>();
    for ((_, cycle) in performanceCycles.entries()) {
      cycleList.add(cycle);
    };
    cycleList.toArray();
  };

  // Reviews
  public shared ({ caller }) func createReview(employeeId : EmployeeId, cycleId : CycleId) : async ReviewId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create reviews");
    };

    let reviewId = nextId();
    let review : Review = {
      id = reviewId;
      employeeId;
      cycleId;
      selfReview = "";
      managerReview = "";
      hrReview = "";
      status = #pending;
    };

    switch (reviews.get(employeeId)) {
      case null {
        let reviewList = List.empty<Review>();
        reviewList.add(review);
        reviews.add(employeeId, reviewList);
      };
      case (?existingList) {
        existingList.add(review);
        reviews.add(employeeId, existingList);
      };
    };

    reviewId;
  };

  public shared ({ caller }) func submitSelfReview(employeeId : EmployeeId, reviewId : ReviewId, selfReviewText : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit self reviews");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only submit your own self review");
    };

    switch (reviews.get(employeeId)) {
      case null { false };
      case (?reviewList) {
        let updatedList = List.empty<Review>();
        var found = false;

        for (review in reviewList.values()) {
          if (review.id == reviewId) {
            let updatedReview = {
              id = review.id;
              employeeId = review.employeeId;
              cycleId = review.cycleId;
              selfReview = selfReviewText;
              managerReview = review.managerReview;
              hrReview = review.hrReview;
              status = review.status;
            };
            updatedList.add(updatedReview);
            found := true;
          } else {
            updatedList.add(review);
          };
        };

        if (found) {
          reviews.add(employeeId, updatedList);
          true;
        } else {
          false;
        };
      };
    };
  };

  public shared ({ caller }) func submitManagerReview(employeeId : EmployeeId, reviewId : ReviewId, managerReviewText : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can submit manager reviews");
    };

    switch (reviews.get(employeeId)) {
      case null { false };
      case (?reviewList) {
        let updatedList = List.empty<Review>();
        var found = false;

        for (review in reviewList.values()) {
          if (review.id == reviewId) {
            let updatedReview = {
              id = review.id;
              employeeId = review.employeeId;
              cycleId = review.cycleId;
              selfReview = review.selfReview;
              managerReview = managerReviewText;
              hrReview = review.hrReview;
              status = review.status;
            };
            updatedList.add(updatedReview);
            found := true;
          } else {
            updatedList.add(review);
          };
        };

        if (found) {
          reviews.add(employeeId, updatedList);
          true;
        } else {
          false;
        };
      };
    };
  };

  public shared ({ caller }) func submitHRReview(employeeId : EmployeeId, reviewId : ReviewId, hrReviewText : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can submit HR reviews");
    };

    switch (reviews.get(employeeId)) {
      case null { false };
      case (?reviewList) {
        let updatedList = List.empty<Review>();
        var found = false;

        for (review in reviewList.values()) {
          if (review.id == reviewId) {
            let updatedReview = {
              id = review.id;
              employeeId = review.employeeId;
              cycleId = review.cycleId;
              selfReview = review.selfReview;
              managerReview = review.managerReview;
              hrReview = hrReviewText;
              status = #completed;
            };
            updatedList.add(updatedReview);
            found := true;
          } else {
            updatedList.add(review);
          };
        };

        if (found) {
          reviews.add(employeeId, updatedList);
          true;
        } else {
          false;
        };
      };
    };
  };

  public query ({ caller }) func getEmployeeReviews(employeeId : EmployeeId) : async ?[Review] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reviews");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only view your own reviews");
    };

    switch (reviews.get(employeeId)) {
      case null { null };
      case (?reviewList) { ?reviewList.toArray() };
    };
  };
};
