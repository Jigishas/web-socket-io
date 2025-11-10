# Socket.io Chat Application

A real-time chat application built with Socket.io, featuring user authentication, instant messaging, typing indicators, and private messaging capabilities.

## Features

- **Real-time Messaging**: Send and receive messages instantly using WebSockets
- **User Authentication**: Secure login and registration system with JWT tokens
- **Typing Indicators**: See when other users are typing
- **Private Messages**: Send direct messages to specific users
- **User Management**: Track online users and join/leave notifications
- **Message History**: View recent chat history
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Tech Stack

### Frontend
- React 19
- Vite (build tool)
- Tailwind CSS (styling)
- Socket.io-client (real-time communication)

### Backend
- Node.js
- Express.js
- Socket.io (real-time communication)
- MongoDB with Mongoose (database)
- JWT (authentication)
- bcryptjs (password hashing)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local installation or cloud service like MongoDB Atlas)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd web-socket-io
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd ../client
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file in the `server` directory
   - Add the following variables:
     ```
     PORT=3000
     CLIENT_URL=http://localhost:5173
     MONGODB_URI=mongodb://localhost:27017/chatapp
     JWT_SECRET=your-secret-key-here
     ```

## Usage

1. Start the MongoDB server (if running locally)

2. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

3. In a new terminal, start the frontend:
   ```bash
   cd client
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

5. Register a new account or log in to start chatting!

## API Endpoints

- `GET /api/messages` - Retrieve chat message history
- `GET /api/users` - Get list of online users

## Project Structure

```
web-socket-io/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── Pages/          # Page components
│   │   └── socket/         # Socket.io client setup
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── config/             # Database and server configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── socket/             # Socket.io server handlers
│   ├── utils/              # Utility functions
│   ├── package.json
│   └── server.js           # Main server file
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
