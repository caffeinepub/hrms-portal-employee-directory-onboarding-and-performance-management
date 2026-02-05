import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

// Apply migration on upgrade.
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  var idCounter = 0;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let employees = Map.empty<EmployeeId, EmployeeProfile>();
  let principalToEmployee = Map.empty<Principal, EmployeeId>();
  let onboardingTasks = Map.empty<EmployeeId, List.List<OnboardingTask>>();
  let goals = Map.empty<EmployeeId, List.List<Goal>>();
  let performanceCycles = Map.empty<CycleId, PerformanceReviewCycle>();
  let reviews = Map.empty<EmployeeId, List.List<Review>>();
  let questionnaireResponses = Map.empty<EmployeeId, List.List<QuestionnaireResponse>>();
  let appraisalDetails = Map.empty<EmployeeId, AppraisalDetails>();

  func nextId() : Nat {
    idCounter += 1;
    idCounter;
  };

  // Onboarding Questions
  let onboardingQuestions = [
    "What is your preferred name?", // 1
    "Do you have any accessibility requirements?", // 2
    "What are your preferred working hours?", // 3
    "Do you have any dietary restrictions?", // 4
    "What is your preferred communication method?", // 5
    "Do you have any specific learning objectives?", // 6
    "Are there any tools or software you need?", // 7
    "What are your expectations from the company?", // 8
    "Do you have any previous experience in this role?", // 9
    "What motivates you at work?", // 10
    "Do you require any relocation assistance?", // 11
    "What are your career goals?", // 12
    "Are there any concerns you have about onboarding?", // 13
    "What type of work environment do you prefer?", // 14
    "Is there anything else we should know about you?", // 15
  ];

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Ensure backend user profile exists after sign-in and return principal.
  // Requires authenticated user (not anonymous/guest)
  public shared ({ caller }) func ensureUserProfile(name : Text, email : Text) : async Principal {
    // Reject anonymous principals to prevent spam and unauthorized profile creation
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot create profiles");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let newProfile : UserProfile = {
          name;
          email;
          employeeId = null;
        };
        userProfiles.add(caller, newProfile);
      };
      case (_) {
        // Don't update if already exists (keep existing profile)
      };
    };
    caller;
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Helper function to check if caller owns employee record
  func isEmployeeOwner(caller : Principal, employeeId : EmployeeId) : Bool {
    switch (principalToEmployee.get(caller)) {
      case (?eid) { eid == employeeId };
      case null { false };
    };
  };

  // Employee Management
  public type CreateEmployeeProfileArgs = {
    name : Text;
    email : Text;
    department : Text;
    jobTitle : Text;
    manager : Text;
    startDate : Time.Time;
    principalId : ?Principal;
    externalEmployeeId : ?ExternalEmployeeId;
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
      externalEmployeeId = data.externalEmployeeId;
    };

    employees.add(id, profile);

    switch (data.principalId) {
      case (?pid) { principalToEmployee.add(pid, id) };
      case null {};
    };

    ?id;
  };

  public type UpdateEmployeeProfileArgs = {
    name : ?Text;
    email : ?Text;
    department : ?Text;
    jobTitle : ?Text;
    manager : ?Text;
    status : ?EmploymentStatus;
    principalId : ?Principal;
    externalEmployeeId : ?ExternalEmployeeId;
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
          principalId = switch (data.principalId) { case (?p) { ?p }; case null existing.principalId };
          externalEmployeeId = switch (data.externalEmployeeId) {
            case (?extId) { ?extId };
            case (null) { existing.externalEmployeeId };
          };
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
      Runtime.trap("Unauthorized: Only users can view employees");
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

  // Changed from query to shared to allow state modification (auto-linking)
  public shared ({ caller }) func getMyEmployeeId() : async ?EmployeeId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get employee ID");
    };

    switch (principalToEmployee.get(caller)) {
      case (?employeeId) { ?employeeId };
      case null {
        switch (userProfiles.get(caller)) {
          case (null) { null };
          case (?profile) {
            let normalizedUserName = profile.name.trim(#char ' ').toLower();
            if (normalizedUserName == "") {
              return null;
            };

            // Find all matching employees (case-insensitive name compare)
            var numMatches = 0;
            var matchedEmployee : ?EmployeeProfile = null;

            for ((_, emp) in employees.entries()) {
              let normalizedEmployeeName = emp.name.trim(#char ' ').toLower();
              if (normalizedEmployeeName == normalizedUserName) {
                numMatches += 1;
                if (numMatches > 1) {
                  return null;
                };
                matchedEmployee := ?emp;
              };
            };

            if (numMatches == 1) {
              switch (matchedEmployee) {
                case (null) { null };
                case (?employee) {
                  principalToEmployee.add(caller, employee.id);
                  ?employee.id;
                };
              };
            } else {
              null;
            };
          };
        };
      };
    };
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

  // Onboarding Questionnaire
  public query ({ caller }) func getOnboardingQuestions() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view onboarding questions");
    };
    onboardingQuestions;
  };

  public shared ({ caller }) func submitQuestionnaireResponses(employeeId : EmployeeId, responses : [OnboardingResponse]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit questionnaire responses");
    };

    // Allow both the employee themselves and admins to submit responses
    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only submit questionnaire responses for your own employee record or as an admin");
    };

    let newResponse : QuestionnaireResponse = {
      employeeId;
      responses;
      submittedBy = caller;
      submittedAt = Time.now();
    };

    switch (questionnaireResponses.get(employeeId)) {
      case (null) {
        let responseList = List.empty<QuestionnaireResponse>();
        responseList.add(newResponse);
        questionnaireResponses.add(employeeId, responseList);
      };
      case (?existingList) {
        existingList.add(newResponse);
        questionnaireResponses.add(employeeId, existingList);
      };
    };
  };

  public query ({ caller }) func getQuestionnaireResponses(employeeId : EmployeeId) : async [QuestionnaireResponse] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view questionnaire responses");
    };

    // Allow both the employee themselves and admins to view responses
    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only view questionnaire responses for your own employee record or as an admin");
    };

    switch (questionnaireResponses.get(employeeId)) {
      case (null) { [] };
      case (?responses) { responses.toArray() };
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

  // Appraisal Details
  public shared ({ caller }) func saveAppraisalDetails(details : AppraisalDetails) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can save appraisal details");
    };

    appraisalDetails.add(details.employeeId, details);
  };

  public query ({ caller }) func getAppraisalDetails(employeeId : EmployeeId) : async ?AppraisalDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view appraisal details");
    };

    if (not AccessControl.isAdmin(accessControlState, caller) and not isEmployeeOwner(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only view your own appraisal details");
    };

    appraisalDetails.get(employeeId);
  };

  public query ({ caller }) func searchAppraisalDetails(searchTerm : Text) : async [AppraisalDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can search appraisal details");
    };

    let results = List.empty<AppraisalDetails>();

    for ((_, details) in appraisalDetails.entries()) {
      if (
        details.employeeName.contains(#text searchTerm) or
        details.department.contains(#text searchTerm) or
        details.jobTitle.contains(#text searchTerm) or
        details.appraisalPeriod.contains(#text searchTerm)
      ) {
        results.add(details);
      };
    };

    results.toArray();
  };

  // Global Search
  public type SearchResult = {
    #employee : EmployeeProfile;
    #onboardingTask : { employeeId : EmployeeId; task : OnboardingTask };
    #questionnaireResponse : { employeeId : EmployeeId; response : QuestionnaireResponse };
    #goal : { employeeId : EmployeeId; goal : Goal };
    #review : { employeeId : EmployeeId; review : Review };
    #appraisal : AppraisalDetails;
  };

  public query ({ caller }) func globalSearch(searchTerm : Text) : async [SearchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform global search");
    };

    let results = List.empty<SearchResult>();

    // Search employees
    for ((_, employee) in employees.entries()) {
      if (
        employee.name.contains(#text searchTerm) or
        employee.email.contains(#text searchTerm) or
        employee.department.contains(#text searchTerm) or
        employee.jobTitle.contains(#text searchTerm)
      ) {
        results.add(#employee(employee));
      };
    };

    // Search onboarding tasks
    for ((empId, taskList) in onboardingTasks.entries()) {
      for (task in taskList.values()) {
        if (
          task.title.contains(#text searchTerm) or
          task.description.contains(#text searchTerm)
        ) {
          results.add(#onboardingTask({ employeeId = empId; task }));
        };
      };
    };

    // Search questionnaire responses
    for ((empId, responseList) in questionnaireResponses.entries()) {
      for (qr in responseList.values()) {
        var matchFound = false;
        for (resp in qr.responses.vals()) {
          if (resp.response.contains(#text searchTerm)) {
            matchFound := true;
          };
        };
        if (matchFound) {
          results.add(#questionnaireResponse({ employeeId = empId; response = qr }));
        };
      };
    };

    // Search goals
    for ((empId, goalList) in goals.entries()) {
      for (goal in goalList.values()) {
        if (
          goal.title.contains(#text searchTerm) or
          goal.description.contains(#text searchTerm)
        ) {
          results.add(#goal({ employeeId = empId; goal }));
        };
      };
    };

    // Search reviews
    for ((empId, reviewList) in reviews.entries()) {
      for (review in reviewList.values()) {
        if (
          review.selfReview.contains(#text searchTerm) or
          review.managerReview.contains(#text searchTerm) or
          review.hrReview.contains(#text searchTerm)
        ) {
          results.add(#review({ employeeId = empId; review }));
        };
      };
    };

    // Search appraisal details
    for ((_, details) in appraisalDetails.entries()) {
      if (
        details.employeeName.contains(#text searchTerm) or
        details.department.contains(#text searchTerm) or
        details.jobTitle.contains(#text searchTerm) or
        details.appraisalPeriod.contains(#text searchTerm) or
        details.qualityOfWork.contains(#text searchTerm) or
        details.reasonForIncrement.contains(#text searchTerm)
      ) {
        results.add(#appraisal(details));
      };
    };

    results.toArray();
  };
};
