import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusIcon } from "lucide-react"

const mockCourses = [
  { id: 1, title: "UI/UX Masterclass",        instructor: "Sarah Johnson", students: 1240, status: "Published", category: "Design" },
  { id: 2, title: "Advanced React Patterns",  instructor: "Mike Chen",     students: 870,  status: "Published", category: "Dev" },
  { id: 3, title: "Data Science Fundamentals",instructor: "Emma Davis",    students: 520,  status: "Draft",     category: "Data" },
  { id: 4, title: "Cloud Architecture & AWS", instructor: "James Wilson",  students: 340,  status: "Published", category: "Cloud" },
  { id: 5, title: "Machine Learning w/ Python",instructor: "Zara Ahmed",   students: 0,    status: "Draft",     category: "Data" },
]

const categoryColor: Record<string, string> = {
  Design: "text-fuchsia-400 bg-fuchsia-400/10",
  Dev:    "text-indigo-400 bg-indigo-400/10",
  Data:   "text-violet-400 bg-violet-400/10",
  Cloud:  "text-sky-400 bg-sky-400/10",
}

export function AdminCourses() {
  return (
    <div className="flex flex-col gap-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Course Management</h1>
          <p className="text-sm text-white/50">Create, edit, and publish courses for learners.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500">
          <PlusIcon className="h-4 w-4" />
          New Course
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/3">
            <tr>
              {["Title", "Instructor", "Students", "Category", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockCourses.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b border-white/5 transition-colors hover:bg-white/4 ${i === mockCourses.length - 1 ? "border-0" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-white/90">{c.title}</td>
                <td className="px-4 py-3 text-white/50">{c.instructor}</td>
                <td className="px-4 py-3 text-white/70">{c.students.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor[c.category] ?? ""}`}>
                    {c.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.status === "Published" ? "default" : "secondary"}>{c.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
