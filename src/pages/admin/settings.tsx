import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const sections = [
  {
    title: "Platform",
    fields: [
      { label: "Platform Name", defaultValue: "Nexus Learning", type: "text" },
      { label: "Support Email", defaultValue: "support@courses.dev", type: "email" },
    ],
  },
  {
    title: "Notifications",
    fields: [
      { label: "Alert Email", defaultValue: "alerts@courses.dev", type: "email" },
    ],
  },
  {
    title: "Security",
    fields: [
      { label: "Session Timeout (minutes)", defaultValue: "60", type: "number" },
    ],
  },
]

export function AdminSettings() {
  return (
    <div className="flex flex-col gap-8 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-white/50">Configure platform-wide preferences and defaults.</p>
      </div>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl">
            <h2 className="mb-5 text-sm font-semibold text-white/80">{section.title}</h2>
            <div className="flex flex-col gap-4">
              {section.fields.map((f) => (
                <div key={f.label} className="grid max-w-sm gap-2">
                  <Label className="text-xs text-white/60">{f.label}</Label>
                  <Input
                    type={f.type}
                    defaultValue={f.defaultValue}
                    className="border-white/10 bg-white/5 text-white/90 focus:border-indigo-500/50"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button className="bg-indigo-600 hover:bg-indigo-500">Save Changes</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  )
}
