import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  useGetMyEmployeeId,
  useGetEmployeeReviews,
  useIsCallerAdmin,
  useSearchEmployees,
  useGetAllPerformanceCycles,
  useCreateReview,
  useCreatePerformanceCycle,
} from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import ReviewEditors from '../../components/performance/ReviewEditors';
import type { EmployeeId, CycleId } from '../../backend';
import { CycleStatus } from '../../backend';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ReviewsPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { employeeId?: string };
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: myEmployeeId } = useGetMyEmployeeId();
  const { data: employees } = useSearchEmployees('');
  const { data: cycles } = useGetAllPerformanceCycles();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<EmployeeId | null>(null);
  const [showCreateCycleDialog, setShowCreateCycleDialog] = useState(false);
  const [showCreateReviewDialog, setShowCreateReviewDialog] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<CycleId | null>(null);

  const displayEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : myEmployeeId;
  const { data: reviews, isLoading } = useGetEmployeeReviews(displayEmployeeId);

  const createCycle = useCreatePerformanceCycle();
  const createReview = useCreateReview();

  const [cycleTitle, setCycleTitle] = useState('');
  const [cycleStartDate, setCycleStartDate] = useState('');
  const [cycleEndDate, setCycleEndDate] = useState('');

  useEffect(() => {
    if (searchParams.employeeId && isAdmin) {
      setSelectedEmployeeId(BigInt(searchParams.employeeId));
    }
  }, [searchParams.employeeId, isAdmin]);

  const handleCreateCycle = () => {
    if (cycleTitle && cycleStartDate && cycleEndDate) {
      createCycle.mutate(
        {
          id: BigInt(0),
          title: cycleTitle,
          startDate: BigInt(new Date(cycleStartDate).getTime() * 1000000),
          endDate: BigInt(new Date(cycleEndDate).getTime() * 1000000),
          status: CycleStatus.active,
        },
        {
          onSuccess: () => {
            setShowCreateCycleDialog(false);
            setCycleTitle('');
            setCycleStartDate('');
            setCycleEndDate('');
          },
        }
      );
    }
  };

  const handleCreateReview = () => {
    if (selectedEmployeeId && selectedCycleId) {
      createReview.mutate(
        { employeeId: selectedEmployeeId, cycleId: selectedCycleId },
        {
          onSuccess: () => {
            setShowCreateReviewDialog(false);
            setSelectedCycleId(null);
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Performance Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage performance review cycles and feedback</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={showCreateCycleDialog} onOpenChange={setShowCreateCycleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Cycle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Performance Cycle</DialogTitle>
                  <DialogDescription>Create a new performance review cycle</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cycleTitle">Cycle Title</Label>
                    <Input
                      id="cycleTitle"
                      value={cycleTitle}
                      onChange={(e) => setCycleTitle(e.target.value)}
                      placeholder="Q1 2026 Performance Review"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={cycleStartDate}
                      onChange={(e) => setCycleStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={cycleEndDate}
                      onChange={(e) => setCycleEndDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateCycle} disabled={createCycle.isPending} className="w-full">
                    {createCycle.isPending ? 'Creating...' : 'Create Cycle'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {selectedEmployeeId && (
              <Dialog open={showCreateReviewDialog} onOpenChange={setShowCreateReviewDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Review</DialogTitle>
                    <DialogDescription>Assign a review cycle to the selected employee</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Cycle</Label>
                      <Select
                        value={selectedCycleId?.toString() || ''}
                        onValueChange={(value) => setSelectedCycleId(BigInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          {cycles?.map((cycle) => (
                            <SelectItem key={cycle.id.toString()} value={cycle.id.toString()}>
                              {cycle.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCreateReview}
                      disabled={createReview.isPending || !selectedCycleId}
                      className="w-full"
                    >
                      {createReview.isPending ? 'Creating...' : 'Create Review'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Select Employee</CardTitle>
            <CardDescription>View and manage reviews for a specific employee</CardDescription>
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

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              {isAdmin && !selectedEmployeeId
                ? 'Select an employee to view their reviews.'
                : 'No reviews assigned yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const cycle = cycles?.find((c) => c.id === review.cycleId);
            return (
              <Card key={review.id.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cycle?.title || 'Performance Review'}</CardTitle>
                      <CardDescription className="mt-1">Review ID: {review.id.toString()}</CardDescription>
                    </div>
                    <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                      {review.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {displayEmployeeId && (
                    <ReviewEditors review={review} employeeId={displayEmployeeId} isAdmin={!!isAdmin} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
