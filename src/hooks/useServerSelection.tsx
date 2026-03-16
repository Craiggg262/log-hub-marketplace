import { useState, useEffect, createContext, useContext } from 'react';

export type ServerType = 'king' | 'lite';

interface ServerContextType {
  server: ServerType;
  setServer: (s: ServerType) => void;
  serverLabel: string;
}

const ServerContext = createContext<ServerContextType>({
  server: 'king',
  setServer: () => {},
  serverLabel: 'King Server',
});

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [server, setServerState] = useState<ServerType>(() => {
    return (localStorage.getItem('preferred_server') as ServerType) || 'king';
  });

  const setServer = (s: ServerType) => {
    setServerState(s);
    localStorage.setItem('preferred_server', s);
  };

  const serverLabel = server === 'king' ? 'King Server' : 'Lite Server';

  return (
    <ServerContext.Provider value={{ server, setServer, serverLabel }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerSelection() {
  return useContext(ServerContext);
}
