import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/* ─── Mock data ──────────────────────────────────────────────────────────── */

const users = [
  { id: 1, name: "Alice Martin",  email: "alice@example.com",  role: "Admin",   status: "Active",   joined: "Jan 12, 2026" },
  { id: 2, name: "Bob Chen",      email: "bob@example.com",    role: "Editor",  status: "Active",   joined: "Jan 18, 2026" },
  { id: 3, name: "Carol Davis",   email: "carol@example.com",  role: "Viewer",  status: "Inactive", joined: "Feb 3, 2026"  },
  { id: 4, name: "Daniel Kim",    email: "daniel@example.com", role: "Editor",  status: "Active",   joined: "Feb 14, 2026" },
  { id: 5, name: "Eva Müller",    email: "eva@example.com",    role: "Viewer",  status: "Pending",  joined: "Mar 2, 2026"  },
  { id: 6, name: "Frank Osei",    email: "frank@example.com",  role: "Admin",   status: "Active",   joined: "Mar 19, 2026" },
  { id: 7, name: "Grace Lee",     email: "grace@example.com",  role: "Editor",  status: "Active",   joined: "Apr 1, 2026"  },
  { id: 8, name: "Henry Park",    email: "henry@example.com",  role: "Viewer",  status: "Inactive", joined: "Apr 10, 2026" },
]

type StatusVariant = "default" | "secondary" | "outline" | "destructive"

const statusStyles: Record<string, { variant: StatusVariant; dot: string }> = {
  Active:   { variant: "default",   dot: "bg-emerald-400" },
  Inactive: { variant: "secondary", dot: "bg-zinc-400"    },
  Pending:  { variant: "outline",   dot: "bg-amber-400"   },
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function RecentUsersTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>New accounts registered in the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-6">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pe-6 text-end">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const s = statusStyles[user.status] ?? statusStyles.Pending
              return (
                <TableRow key={user.id}>
                  <TableCell className="ps-6 font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={s.variant} className="gap-1.5">
                      <span className={`size-1.5 rounded-full ${s.dot}`} />
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pe-6 text-end text-muted-foreground">{user.joined}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
