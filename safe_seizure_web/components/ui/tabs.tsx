'use client';

import React, { ReactNode, useState } from 'react';

interface TabsProps {
  children: ReactNode;
  defaultValue?: string;
}

interface TabsListProps {
  children: ReactNode;
}

interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  onClick?: () => void;
}

interface TabsContentProps {
  children: ReactNode;
  value: string;
}

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
} | null>(null);

export function Tabs({ children, defaultValue = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabsList({ children }: TabsListProps) {
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, onClick }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => {
        setActiveTab(value);
        onClick?.();
      }}
      className={`
        px-4 py-2 text-sm font-medium whitespace-nowrap
        border-b-2 transition-colors
        ${
          isActive
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }
      `}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value }: TabsContentProps) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return <>{children}</>;
}
