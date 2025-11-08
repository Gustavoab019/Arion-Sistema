// Legacy compatibility wrapper for /api/[id]
// Reuse the real handlers defined under /api/obras/[id]
export { GET, PATCH, DELETE } from "@/src/app/api/obras/[id]/route";
