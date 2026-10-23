import { createContext, useContext } from 'react';
import type { IContext } from '@microsoft/power-apps/app';

export const PowerContext = createContext<IContext | null>(null);

export function usePowerContext(): IContext | null {
  return useContext(PowerContext);
}
