import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  useGetMyEmployeeId,
  useGetAppraisalDetails,
  useSaveAppraisalDetails,
  useIsCallerAdmin,
  useSearchEmployees,
  useGetEmployee,
} from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { EmployeeId } from '../../backend';

export default function AppraisalPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { employeeId?: string };
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: myEmployeeId, isLoading: myEmployeeIdLoading } = useGetMyEmployeeId();
  const { data: employees } = useSearchEmployees('', { adminOnly: true });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<EmployeeId | null>(null);

  const displayEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : myEmployeeId;
  const { data: appraisal, isLoading: appraisalLoading } = useGetAppraisalDetails(displayEmployeeId);
  const { data: employee } = useGetEmployee(displayEmployeeId);
  const saveMutation = useSaveAppraisalDetails();

  useEffect(() => {
    if (searchParams.employeeId && isAdmin) {
      setSelectedEmployeeId(BigInt(searchParams.employeeId));
    }
  }, [searchParams.employeeId, isAdmin]);

  const handleCreateSampleAppraisal = () => {
    if (!displayEmployeeId || !employee) return;

    const sampleAppraisal = {
      employeeId: displayEmployeeId,
      employeeName: employee.name,
      department: employee.department,
      jobTitle: employee.jobTitle,
      appraisalPeriod: 'April 2025 – March 2026',
      workCompletionPercent: BigInt(85),
      qualityOfWork: 'Good and accurate',
      timeliness: 'Meets deadlines regularly',
      teamwork: 'Works well with team members',
      communicationSkills: 'Clear and professional',
      overallRatingPercent: BigInt(85),
      grade: 'Grade A',
      appraisalType: 'Annual Performance Appraisal',
      incrementPercent: BigInt(10),
      reasonForIncrement: 'Consistent performance and positive contribution to the organization',
      criteria: [
        'Work efficiency',
        'Quality of output',
        'Discipline and punctuality',
        'Team coordination',
        'Willingness to learn and improve',
      ],
      feedback: [
        'Appreciated for dedication and consistency',
        'Encouraged to improve leadership and decision-making skills',
        'Advised to take more initiative in HR activities',
      ],
      createdAt: BigInt(Date.now() * 1000000),
    };

    saveMutation.mutate(sampleAppraisal);
  };

  // Show loading while checking prerequisites
  if (isAdminLoading || myEmployeeIdLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Non-admin without employee ID
  if (!isAdmin && !myEmployeeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Performance Appraisal</h1>
          <p className="text-muted-foreground mt-1">View and manage employee performance appraisals</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Performance Appraisal</h1>
          <p className="text-muted-foreground mt-1">View and manage employee performance appraisals</p>
        </div>
        {isAdmin && displayEmployeeId && !appraisal && (
          <Button onClick={handleCreateSampleAppraisal} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Creating...' : 'Create Sample Appraisal'}
          </Button>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Select Employee</CardTitle>
            <CardDescription>View appraisal details for a specific employee</CardDescription>
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

      {appraisalLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading appraisal details...</p>
          </div>
        </div>
      ) : !appraisal ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              {isAdmin && !selectedEmployeeId
                ? 'Select an employee to view their appraisal.'
                : 'No appraisal details available yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{appraisal.employeeName}</CardTitle>
                  <CardDescription className="mt-1">
                    {appraisal.jobTitle} • {appraisal.department}
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-base px-4 py-2">
                  {appraisal.grade}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Appraisal Period</h3>
                <p className="text-muted-foreground">{appraisal.appraisalPeriod}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Work Performance Summary</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Work Completion</p>
                    <p className="text-sm text-muted-foreground">{Number(appraisal.workCompletionPercent)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quality of Work</p>
                    <p className="text-sm text-muted-foreground">{appraisal.qualityOfWork}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Timeliness</p>
                    <p className="text-sm text-muted-foreground">{appraisal.timeliness}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Teamwork</p>
                    <p className="text-sm text-muted-foreground">{appraisal.teamwork}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Communication Skills</p>
                    <p className="text-sm text-muted-foreground">{appraisal.communicationSkills}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Overall Performance Rating</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Performance Percentage</p>
                    <p className="text-2xl font-bold text-primary">{Number(appraisal.overallRatingPercent)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Performance Grade</p>
                    <Badge variant="default" className="text-lg px-3 py-1">{appraisal.grade}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Appraisal / Increment Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Type of Appraisal</p>
                    <p className="text-sm text-muted-foreground">{appraisal.appraisalType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Increment Given</p>
                    <p className="text-sm text-muted-foreground">{Number(appraisal.incrementPercent)}% salary increment</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reason</p>
                    <p className="text-sm text-muted-foreground">{appraisal.reasonForIncrement}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Organization's Performance Criteria</h3>
                <ul className="list-disc list-inside space-y-1">
                  {appraisal.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{criterion}</li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Feedback Shared with Employee</h3>
                <ul className="list-disc list-inside space-y-1">
                  {appraisal.feedback.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
