import { BeforeAfterToggle } from "@/components/projects/BeforeAfterToggle";
import type { Project } from "@/data/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="grid gap-8 border-b border-border py-12 md:grid-cols-2 md:gap-12">
      <BeforeAfterToggle project={project} />

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
          {project.engine}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          {project.title}
        </h3>

        <div className="mt-5">
          <p className="text-sm leading-relaxed text-foreground/90">
            {project.request}
          </p>
        </div>

        <div className="mt-5">
          <ul className="mt-2 space-y-2">
            {project.breakdown.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
