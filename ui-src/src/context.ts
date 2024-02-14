import React, { createContext } from 'react';

interface ConfigContextValue {
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}

export const ConfigContext = createContext<ConfigContextValue>({} as ConfigContextValue);
