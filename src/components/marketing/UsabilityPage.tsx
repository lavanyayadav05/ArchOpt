import { Eye, MousePointerClick, ShieldCheck, Undo2, Keyboard, Layout, HelpCircle, Gauge, Accessibility, MessageSquare, Users } from "lucide-react";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Section, SectionHeading } from "./Section";
import { SusCalculator } from "./SusCalculator";

const personas = [
  {
    name: "Meera, architecture student",
    goal: "Test several room arrangements for a studio brief before a review.",
    needs: "Fast feedback, clear reasons when something does not fit, a way to export results.",
    pain: "Gets lost in CAD menus; unsure whether a layout is valid.",
  },
  {
    name: "Rohan, facilities planner",
    goal: "Check whether a school wing can hold a required program on a fixed site.",
    needs: "Numbers he can trust, side-by-side comparison, repeatable results.",
    pain: "Spreadsheets cannot show circulation or adjacency.",
  },
  {
    name: "Anita, project reviewer",
    goal: "Understand quickly why one layout was recommended over another.",
    needs: "Plain-language metrics, before/after views, no hidden steps.",
    pain: "Dense tools that bury the reasoning.",
  },
];

const heuristics = [
  { n: 1, name: "Visibility of system status", icon: Eye, how: "Optimization shows a staged progress bar and live stage list; buttons show loading states; toasts confirm every save, export and generation." },
  { n: 2, name: "Match between system and real world", icon: Layout, how: "Plain architectural vocabulary (reception, corridor, plot) in metres and square metres; floor plans drawn to scale with a colour legend." },
  { n: 3, name: "User control and freedom", icon: Undo2, how: "Undo and redo (Ctrl+Z / Ctrl+Shift+Z) in the editor, cancel for running optimizations, Reset for planner changes." },
  { n: 4, name: "Consistency and standards", icon: Gauge, how: "One set of design tokens and components (buttons, cards, tables, dialogs) used on every screen; the same icons for the same actions." },
  { n: 5, name: "Error prevention", icon: ShieldCheck, how: "Numeric inputs are validated on blur, the planner checks that a program fits the site before searching, destructive actions ask for confirmation." },
  { n: 6, name: "Recognition rather than recall", icon: MousePointerClick, how: "Persistent sidebar, breadcrumbs of state in page headers, a command palette listing every page and project, labels on all icons." },
  { n: 7, name: "Flexibility and efficiency of use", icon: Keyboard, how: "Ctrl+K palette, G-then-letter navigation, / to search, ? for the shortcut list. Novices use the visible menus; experts never leave the keyboard." },
  { n: 8, name: "Aesthetic and minimalist design", icon: Layout, how: "Flat, low-ornament components, one accent colour, generous spacing, and metrics grouped into small cards instead of long text." },
  { n: 9, name: "Help users recognise and recover from errors", icon: HelpCircle, how: "Messages state the problem and the fix, for example how many square metres are required versus available, with a role of alert for screen readers." },
  { n: 10, name: "Help and documentation", icon: MessageSquare, how: "Inline hints under inputs, tooltips on weights, an in-app shortcuts dialog and this page." },
];

const accessibility = [
  { item: "Keyboard", detail: "Every control is reachable with Tab; visible 2 px focus ring; skip link on every page; dialogs trap and restore focus; Escape closes overlays." },
  { item: "Screen readers", detail: "Semantic landmarks, labelled form controls, aria-live regions for progress and results, role=progressbar, aria-pressed for toggles, text alternatives for floor plans." },
  { item: "Colour and contrast", detail: "Text meets WCAG AA in light and dark themes. Status is never colour-only: violations also carry an icon and a message." },
  { item: "Motion", detail: "Short, subtle transitions; all animation is disabled when the system requests reduced motion." },
  { item: "Responsive layout", detail: "Layouts reflow from phone to wide desktop; tables scroll inside their own container; touch targets are at least 36 px." },
  { item: "Theme choice", detail: "Light, dark or follow-the-system, remembered between visits and applied before first paint to avoid flashes." },
];

const tasks = [
  { task: "Generate four layouts for a 30 m × 20 m site", metric: "Time on task, success", target: "Under 60 s, 90 % success" },
  { task: "Find out why a room is flagged as invalid", metric: "Errors, success", target: "Under 30 s, no help" },
  { task: "Compare optimized and unoptimized layouts", metric: "Time on task", target: "Under 45 s" },
  { task: "Switch to dark theme and export a layout", metric: "Success, first-click accuracy", target: "100 % success" },
];

export function UsabilityPage() {
  return (
    <>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Usability & design"
          title="Designed around the people who use it"
          description="ArchOpt applies Nielsen’s heuristics, WCAG accessibility guidance and a small usability-testing toolkit. This page records the decisions and shows how to evaluate them."
        />
        <ul className="grid list-none gap-4 p-0 md:grid-cols-3">
          {personas.map((p) => (
            <li key={p.name} className="border border-line bg-surface p-5 shadow-card rounded-md">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-base font-semibold text-ink">{p.name}</h2>
              <dl className="mt-2 flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Goal</dt>
                  <dd className="m-0 text-ink">{p.goal}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Needs</dt>
                  <dd className="m-0 text-ink">{p.needs}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Pain point</dt>
                  <dd className="m-0 text-muted">{p.pain}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <h2 className="text-xl font-bold tracking-tight text-ink">Nielsen&rsquo;s ten heuristics in ArchOpt</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Each heuristic with the concrete feature that implements it.</p>
        <ol className="grid list-none gap-3 p-0 md:grid-cols-2">
          {heuristics.map((h) => (
            <li key={h.n} className="flex gap-3 border border-line bg-bg p-4 rounded-md">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-primary bg-highlight font-mono text-sm font-semibold text-primary rounded-xs">{h.n}</span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <h.icon className="h-4 w-4 text-primary" aria-hidden /> {h.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">{h.how}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="mb-5 flex items-center gap-3">
          <Accessibility className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="text-xl font-bold tracking-tight text-ink">Accessibility decisions</h2>
        </div>
        <Table>
          <thead>
            <tr>
              <Th className="w-40">Area</Th>
              <Th>What was done</Th>
            </tr>
          </thead>
          <tbody>
            {accessibility.map((a) => (
              <Tr key={a.item}>
                <Td className="font-medium">{a.item}</Td>
                <Td className="whitespace-normal text-muted">{a.detail}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section tone="surface">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Usability test plan</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Five participants complete the tasks below while thinking aloud. Record success, time on task and errors, then ask them to fill in the System Usability Scale.
              Five users typically reveal most major problems.
            </p>
            <div className="mt-4">
              <Table>
                <thead>
                  <tr>
                    <Th>Task</Th>
                    <Th>Measure</Th>
                    <Th>Target</Th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <Tr key={t.task}>
                      <Td className="whitespace-normal font-medium">{t.task}</Td>
                      <Td className="whitespace-normal text-muted">{t.metric}</Td>
                      <Td className="whitespace-normal">
                        <Badge tone="info" size="sm">
                          {t.target}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
          <SusCalculator />
        </div>
      </Section>
    </>
  );
}
