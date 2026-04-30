import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlusIcon, SearchIcon, FilterIcon } from "lucide-react"

const mockUsers = [
  { id: 1, name: "Sarah Smith",  email: "sarah@courses.dev",  role: "user",  status: "Active",   joined: "Jan 12, 2026" },
  { id: 2, name: "John Doe",     email: "john@courses.dev",   role: "user",  status: "Active",   joined: "Feb 03, 2026" },
  { id: 3, name: "Emma Wilson",  email: "emma@courses.dev",   role: "admin", status: "Active",   joined: "Dec 20, 2025" },
  { id: 4, name: "James Turner", email: "james@courses.dev",  role: "user",  status: "Inactive", joined: "Mar 15, 2026" },
  { id: 5, name: "Zara Ahmed",   email: "zara@courses.dev",   role: "user",  status: "Active",   joined: "Apr 01, 2026" },
]

export function AdminUsers() {
  return (
    <div className="flex flex-col gap-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-sm text-white/50">Manage accounts, roles, and permissions.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500">
          <UserPlusIcon className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            placeholder="Search users…"
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/3">
            <tr>
              {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b border-white/5 transition-colors hover:bg-white/4 ${i === mockUsers.length - 1 ? "border-0" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-white/90">{u.name}</td>
                <td className="px-4 py-3 text-white/50">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.status === "Active" ? "text-emerald-400" : "text-white/30"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-400" : "bg-white/20"}`} />
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40">{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
