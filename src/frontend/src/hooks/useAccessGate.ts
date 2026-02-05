import { useState, useEffect } from 'react';

const ACCESS_GATE_KEY = 'hrms_access_gate_completed';
const ACCESS_GATE_NAME_KEY = 'hrms_access_gate_name';

interface AccessGateState {
  isCompleted: boolean;
  storedName: string;
}

export function useAccessGate() {
  const [state, setState] = useState<AccessGateState>(() => {
    const completed = localStorage.getItem(ACCESS_GATE_KEY) === 'true';
    const storedName = localStorage.getItem(ACCESS_GATE_NAME_KEY) || '';
    return { isCompleted: completed, storedName };
  });

  const completeGate = (firstName: string, lastName: string) => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    localStorage.setItem(ACCESS_GATE_KEY, 'true');
    localStorage.setItem(ACCESS_GATE_NAME_KEY, fullName);
    setState({ isCompleted: true, storedName: fullName });
  };

  const resetGate = () => {
    localStorage.removeItem(ACCESS_GATE_KEY);
    localStorage.removeItem(ACCESS_GATE_NAME_KEY);
    setState({ isCompleted: false, storedName: '' });
  };

  return {
    isGateCompleted: state.isCompleted,
    storedName: state.storedName,
    completeGate,
    resetGate,
  };
}
