import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  useGetOnboardingQuestions,
  useGetQuestionnaireResponses,
  useSubmitQuestionnaireResponses,
  useIsCallerAdmin,
  useGetMyEmployeeId,
  useSearchEmployees,
} from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { EmployeeId, OnboardingResponse } from '../../backend';

export default function OnboardingQuestionnairePage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { employeeId?: string };
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: myEmployeeId, isLoading: myEmployeeIdLoading } = useGetMyEmployeeId();
  const { data: employees } = useSearchEmployees('', { adminOnly: true });
  const { data: questions, isLoading: questionsLoading, isError: questionsError } = useGetOnboardingQuestions();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<EmployeeId | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});

  const displayEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : myEmployeeId;
  const { data: existingResponses } = useGetQuestionnaireResponses(displayEmployeeId);
  const submitMutation = useSubmitQuestionnaireResponses();

  useEffect(() => {
    if (searchParams.employeeId && isAdmin) {
      setSelectedEmployeeId(BigInt(searchParams.employeeId));
    }
  }, [searchParams.employeeId, isAdmin]);

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!displayEmployeeId) return;

    const responseArray: OnboardingResponse[] = Object.entries(responses).map(([qId, response]) => ({
      questionId: BigInt(qId),
      response,
      timestamp: BigInt(Date.now() * 1000000),
    }));

    submitMutation.mutate(
      { employeeId: displayEmployeeId, responses: responseArray },
      {
        onSuccess: () => {
          setResponses({});
        },
      }
    );
  };

  const hasResponses = Object.keys(responses).length > 0;

  // Show loading while checking prerequisites
  if (isAdminLoading || myEmployeeIdLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Questions fetch error
  if (questionsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Questionnaire</h1>
          <p className="text-muted-foreground mt-1">Complete the onboarding questionnaire</p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-destructive">Failed to load questionnaire questions. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Non-admin without employee ID
  if (!isAdmin && !myEmployeeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Questionnaire</h1>
          <p className="text-muted-foreground mt-1">Complete the onboarding questionnaire</p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              Your employee profile has not been linked yet. Please contact your HR administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Questionnaire</h1>
        <p className="text-muted-foreground mt-1">Complete the onboarding questionnaire</p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Select Employee</CardTitle>
            <CardDescription>Choose an employee to view or submit questionnaire responses</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedEmployeeId?.toString() || ''}
              onValueChange={(value) => setSelectedEmployeeId(BigInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id.toString()} value={employee.id.toString()}>
                    {employee.name} - {employee.jobTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {displayEmployeeId && questions && questions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire</CardTitle>
            <CardDescription>
              {isAdmin ? 'Submit responses on behalf of the employee' : 'Please answer the following questions'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`question-${index}`}>
                  {index + 1}. {question}
                </Label>
                <Textarea
                  id={`question-${index}`}
                  value={responses[index] || ''}
                  onChange={(e) => handleResponseChange(index, e.target.value)}
                  placeholder="Your answer..."
                  rows={3}
                />
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              disabled={!hasResponses || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Questionnaire'}
            </Button>
          </CardContent>
        </Card>
      ) : displayEmployeeId ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">No questionnaire questions available.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              {isAdmin ? 'Select an employee to view their questionnaire.' : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      )}

      {displayEmployeeId && existingResponses && existingResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Submissions</CardTitle>
            <CardDescription>View previously submitted questionnaire responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {existingResponses.map((submission, subIdx) => {
              const submittedDate = new Date(Number(submission.submittedAt) / 1000000);
              return (
                <div key={subIdx} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Submission {subIdx + 1}</h3>
                    <span className="text-sm text-muted-foreground">
                      {submittedDate.toLocaleDateString()} {submittedDate.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {submission.responses.map((resp, respIdx) => {
                      const questionText = questions?.[Number(resp.questionId)] || `Question ${Number(resp.questionId) + 1}`;
                      return (
                        <div key={respIdx} className="space-y-1">
                          <p className="text-sm font-medium">{questionText}</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                            {resp.response}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {subIdx < existingResponses.length - 1 && <Separator className="my-4" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
