import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateEmployee, useUpdateEmployee } from '../../hooks/useQueries';
import type { EmployeeProfile } from '../../backend';
import { EmploymentStatus } from '../../backend';

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  employee?: EmployeeProfile;
}

export default function EmployeeFormDialog({ open, onClose, employee }: EmployeeFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [manager, setManager] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<EmploymentStatus>(EmploymentStatus.active);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setDepartment(employee.department);
      setJobTitle(employee.jobTitle);
      setManager(employee.manager);
      const date = new Date(Number(employee.startDate) / 1000000);
      setStartDate(date.toISOString().split('T')[0]);
      setStatus(employee.status);
    } else {
      setName('');
      setEmail('');
      setDepartment('');
      setJobTitle('');
      setManager('');
      setStartDate('');
      setStatus(EmploymentStatus.active);
    }
  }, [employee, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (employee) {
      updateEmployee.mutate(
        {
          id: employee.id,
          data: {
            name,
            email,
            department,
            jobTitle,
            manager,
            status,
            principalId: undefined,
          },
        },
        {
          onSuccess: () => onClose(),
        }
      );
    } else {
      createEmployee.mutate(
        {
          name,
          email,
          department,
          jobTitle,
          manager,
          startDate: BigInt(new Date(startDate).getTime() * 1000000),
          principalId: undefined,
        },
        {
          onSuccess: () => onClose(),
        }
      );
    }
  };

  const isPending = createEmployee.isPending || updateEmployee.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information' : 'Create a new employee record'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">Manager *</Label>
            <Input id="manager" value={manager} onChange={(e) => setManager(e.target.value)} required />
          </div>
          {!employee && (
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
          )}
          {employee && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as EmploymentStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EmploymentStatus.active}>Active</SelectItem>
                  <SelectItem value={EmploymentStatus.terminated}>Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : employee ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
