import { useState, useEffect, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddGoals, useUpdateGoalProgress } from '../../hooks/useQueries';
import type { EmployeeId, Goal } from '../../backend';
import { GoalStatus } from '../../backend';

interface GoalFormDialogProps {
  employeeId: EmployeeId;
  goal?: Goal;
  open?: boolean;
  onClose?: () => void;
  trigger?: ReactNode;
}

export default function GoalFormDialog({ employeeId, goal, open, onClose, trigger }: GoalFormDialogProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState('0');
  const [status, setStatus] = useState<GoalStatus>(GoalStatus.notStarted);

  const addGoals = useAddGoals();
  const updateGoalProgress = useUpdateGoalProgress();

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setStartDate(new Date(Number(goal.startDate) / 1000000).toISOString().split('T')[0]);
      setEndDate(new Date(Number(goal.endDate) / 1000000).toISOString().split('T')[0]);
      setProgress(goal.progress.toString());
      setStatus(goal.status);
    } else {
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setProgress('0');
      setStatus(GoalStatus.notStarted);
    }
  }, [goal, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (goal) {
      updateGoalProgress.mutate(
        {
          employeeId,
          goalId: goal.id,
          progress: BigInt(progress),
          status,
        },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    } else {
      const newGoal: Goal = {
        id: BigInt(Date.now()),
        title,
        description,
        startDate: BigInt(new Date(startDate).getTime() * 1000000),
        endDate: BigInt(new Date(endDate).getTime() * 1000000),
        status,
        progress: BigInt(progress),
      };

      addGoals.mutate(
        { employeeId, goals: [newGoal] },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const isPending = addGoals.isPending || updateGoalProgress.isPending;

  const content = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{goal ? 'Update Goal Progress' : 'Add New Goal'}</DialogTitle>
        <DialogDescription>
          {goal ? 'Update the progress and status of this goal' : 'Create a new performance goal'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!goal && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%) *</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as GoalStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GoalStatus.notStarted}>Not Started</SelectItem>
              <SelectItem value={GoalStatus.inProgress}>In Progress</SelectItem>
              <SelectItem value={GoalStatus.completed}>Completed</SelectItem>
              <SelectItem value={GoalStatus.failed}>Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : goal ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {content}
    </Dialog>
  );
}
