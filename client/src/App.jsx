import React from 'react';
import socket from './socket/socket';
//import ChatComponent from './Hooks/hooks';
import DebugChatComponent from './Pages/fetch';
import Chat from './components/Chat';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Real-Time Communication App</h1>
        <div className="w-full max-w-6xl space-y-8">
          <Chat />
          <DebugChatComponent />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
