import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Reveal } from "@/components/Reveal";

export function Projects() {
  return (
    <section id="projects" className="scroll-mt-16 bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Past Work
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Project highlights.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            A sample of custom builds and major repairs. Toggle each project
            to compare before and after.
          </p>
        </Reveal>

        <div className="mt-8">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
