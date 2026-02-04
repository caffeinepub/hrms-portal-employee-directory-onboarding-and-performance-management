import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useGetOnboardingTasks, useAssignOnboardingTasks } from '../../hooks/useQueries';
import type { EmployeeId, OnboardingTask } from '../../backend';
import { TaskStatus } from '../../backend';

interface OnboardingTaskEditorProps {
  employeeId: EmployeeId;
}

interface TaskForm {
  id: bigint;
  title: string;
  description: string;
  dueDate: string;
  notes: string;
  links: string;
}

export default function OnboardingTaskEditor({ employeeId }: OnboardingTaskEditorProps) {
  const { data: existingTasks } = useGetOnboardingTasks(employeeId);
  const assignTasks = useAssignOnboardingTasks();
  const [tasks, setTasks] = useState<TaskForm[]>([]);

  useEffect(() => {
    if (existingTasks && existingTasks.length > 0) {
      setTasks(
        existingTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: new Date(Number(task.dueDate) / 1000000).toISOString().split('T')[0],
          notes: task.notes,
          links: task.links,
        }))
      );
    } else {
      setTasks([
        {
          id: BigInt(Date.now()),
          title: '',
          description: '',
          dueDate: '',
          notes: '',
          links: '',
        },
      ]);
    }
  }, [existingTasks]);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: BigInt(Date.now()),
        title: '',
        description: '',
        dueDate: '',
        notes: '',
        links: '',
      },
    ]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof TaskForm, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const handleSubmit = () => {
    const onboardingTasks: OnboardingTask[] = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: BigInt(new Date(task.dueDate).getTime() * 1000000),
      status: TaskStatus.notStarted,
      notes: task.notes,
      links: task.links,
    }));

    assignTasks.mutate({ employeeId, tasks: onboardingTasks });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Tasks</CardTitle>
        <CardDescription>Create and assign onboarding tasks for this employee</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {tasks.map((task, index) => (
          <div key={task.id.toString()} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Task {index + 1}</h4>
              {tasks.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeTask(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={task.title}
                onChange={(e) => updateTask(index, 'title', e.target.value)}
                placeholder="Task title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={task.description}
                onChange={(e) => updateTask(index, 'description', e.target.value)}
                placeholder="Task description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={task.dueDate}
                onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={task.notes}
                onChange={(e) => updateTask(index, 'notes', e.target.value)}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Resource Links</Label>
              <Input
                value={task.links}
                onChange={(e) => updateTask(index, 'links', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={addTask} className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <Button onClick={handleSubmit} disabled={assignTasks.isPending} className="flex-1">
            {assignTasks.isPending ? 'Saving...' : 'Save Tasks'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
