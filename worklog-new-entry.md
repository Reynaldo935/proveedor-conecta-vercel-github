---
Task ID: 1
Agent: main
Task: Fix preview error - sandbox inactive / server not responding

Work Log:
- Diagnosed that the Next.js dev server was crashing after processing HTTP requests
- Tested multiple approaches: nohup, setsid, watchdog scripts, double-fork daemon
- Found that the double-fork daemon pattern provides stable background execution
- Regenerated Prisma client with bun run db:push
- Verified all API endpoints work correctly
- Updated start-dev.sh to use the stable daemon approach

Stage Summary:
- Fix: Double-fork daemon pattern in start-dev.sh for stable background execution
- Server stable on port 3000, all routes responding correctly
- Homepage: 132KB full ProveedorConecta app
- API: 13 products, 4 users, 3 sellers loaded
- Lint passes with no errors
