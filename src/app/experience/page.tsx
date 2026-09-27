import PageTitle from "@/components/motion/PageTitle";
import Timeline from "@/components/experience/Timeline";
import SectionHeading from "@/components/home/SectionHeading";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import profile from "@/data/profile.json";
import { careerSchema, educationSchema } from "@/lib/schemas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
  description: "What Akash has studied, built, and contributed.",
};

export default function ExperiencePage() {
  const career = careerSchema.parse(careerData).career;
  const education = educationSchema.parse(educationData).education;
  const os = profile.openSource;

  return (
    <div className="flex flex-col gap-16 pb-8 pt-10 sm:pt-16">
      <header>
        <PageTitle label="WORK" title="Work" />
        <p className="measure mt-4 text-muted-foreground sm:text-lg">
          A degree in progress at IIT Madras, a hackathon build, and the public
          projects on {os.name}.
        </p>
      </header>

      {education.length > 0 && (
        <section>
          <SectionHeading label="01 / EDUCATION" title="Education" />
          <Timeline
            items={education.map((e) => ({
              name: e.name,
              href: e.href,
              title: e.title,
              logo: e.logo,
              start: e.start,
              end: e.end,
              description: e.description,
            }))}
          />
        </section>
      )}

      {career.length > 0 && (
        <section>
          <SectionHeading label="02 / HACKATHONS" title="Hackathons" />
          <Timeline
            items={career.map((c) => ({
              name: c.name,
              href: c.href,
              title: c.title,
              logo: c.logo,
              meta: c.location,
              start: c.start,
              end: c.end,
              description: c.description,
              tech: c.tech,
            }))}
          />
        </section>
      )}

      <section>
        <SectionHeading label="03 / PUBLIC CODE" title="Public code" />
        <Timeline
          items={[
            {
              name: os.name,
              href: os.href,
              title: os.role,
              meta: "Public",
              start: os.start,
              end: os.end ?? undefined,
              description: os.description,
            },
          ]}
        />
      </section>

    </div>
  );
}
