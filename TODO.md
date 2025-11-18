# Backend Security Fixes TODO

## High Priority
- [ ] Update server.js to use authenticated SocketHandler instead of unauthenticated direct connections
- [x] Enhance message input sanitization to prevent XSS attacks
- [ ] Fix private message recipient ID validation and type conversion
- [ ] Add rate limiting for socket events (messages, typing, connections)

## Medium Priority
- [ ] Improve error handling to prevent information leakage
- [ ] Add HTTPS enforcement middleware
- [ ] Restrict CORS origins for better security
- [ ] Remove in-memory message storage from server.js (use DB consistently)

## Low Priority
- [ ] Add comprehensive input validation for all socket events
- [ ] Implement message content filtering (profanity, etc.)
- [ ] Add logging for security events
- [ ] Review and strengthen JWT configuration
