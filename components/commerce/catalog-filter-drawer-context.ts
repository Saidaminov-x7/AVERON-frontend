'use client';

import { createContext, useContext } from 'react';

type CatalogFilterDrawerState = {
  close: () => void;
  stickyActions: boolean;
};

const CatalogFilterDrawerContext = createContext<CatalogFilterDrawerState | null>(null);

export function useCatalogFilterDrawer() {
  return useContext(CatalogFilterDrawerContext);
}

export { CatalogFilterDrawerContext };
