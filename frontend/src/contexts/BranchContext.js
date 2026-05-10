import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_BRANCH_ID, branches, getBranchById } from '../data/branches';

const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
  const [branchId, setBranchId] = useState(() => localStorage.getItem('selectedBranchId') || DEFAULT_BRANCH_ID);

  useEffect(() => {
    localStorage.setItem('selectedBranchId', branchId);
  }, [branchId]);

  const value = useMemo(() => ({
    branches,
    branchId,
    selectedBranch: getBranchById(branchId),
    setBranchId,
  }), [branchId]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return context;
};

export default BranchContext;
