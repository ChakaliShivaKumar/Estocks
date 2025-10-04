import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PortfolioHolding {
  stockSymbol: string;
  coinsInvested: number;
}

export interface Contest {
  id: string;
  name: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  participants: number;
  maxParticipants: number;
  timeRemaining: string;
  featured?: boolean;
  closingSoon?: boolean;
}

interface ContestContextType {
  selectedContest: Contest | null;
  selectedPortfolio: PortfolioHolding[];
  setSelectedContest: (contest: Contest | null) => void;
  setSelectedPortfolio: (portfolio: PortfolioHolding[]) => void;
  clearSelection: () => void;
}

const ContestContext = createContext<ContestContextType | undefined>(undefined);

export function useContest() {
  const context = useContext(ContestContext);
  if (context === undefined) {
    throw new Error('useContest must be used within a ContestProvider');
  }
  return context;
}

interface ContestProviderProps {
  children: ReactNode;
}

export function ContestProvider({ children }: ContestProviderProps) {
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioHolding[]>([]);

  const clearSelection = () => {
    setSelectedContest(null);
    setSelectedPortfolio([]);
  };

  const value = {
    selectedContest,
    selectedPortfolio,
    setSelectedContest,
    setSelectedPortfolio,
    clearSelection
  };

  return (
    <ContestContext.Provider value={value}>
      {children}
    </ContestContext.Provider>
  );
}
