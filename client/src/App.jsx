import React from 'react';
//import ChatComponent from './Hooks/hooks';
import DebugChatComponent from './Pages/fetch';
import Chat from './components/Chat';
import ClerkAuthProvider from './context/ClerkAuthContext';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkAuthProvider>
      <div className="app-background flex flex-col items-center justify-center p-4">
        <div className="app-container">
          <header className="w-full flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Real-Time Communication App</h1>
            <UserButton />
          </header>
          <SignedIn>
            <div className="w-full max-w-6xl space-y-8">
              <Chat />
              <DebugChatComponent />
            </div>
          </SignedIn>
          <SignedOut>
            <div className="auth-form">
              <SignIn routing="path" path="/sign-in" />
            </div>
          </SignedOut>
        </div>
      </div>
    </ClerkAuthProvider>
  );
}

export default App;
