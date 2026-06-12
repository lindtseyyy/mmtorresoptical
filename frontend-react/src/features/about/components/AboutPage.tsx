import { Building2, Layers, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

const frontendStack = [
  { name: "React" },
  { name: "TypeScript" },
  { name: "Vite" },
  { name: "React Router" },
  { name: "Tailwind CSS" },
  { name: "TanStack React Query" },
  { name: "Axios" },
  { name: "React Hook Form" },
  { name: "Zod" },
  { name: "Lucide React" },
  { name: "Sonner" },
  { name: "Radix UI Primitives" },
  { name: "Shadcn UI" },
];

const backendStack = [
  { name: "Spring Boot" },
  { name: "Java" },
  { name: "Spring Security" },
  { name: "Spring Data JPA" },
  { name: "PostgreSQL" },
  { name: "JJWT" },
  { name: "Lombok" },
  { name: "MapStruct" },
  { name: "Apache PDFBox" },
  { name: "Apache POI" },
  { name: "SpringDoc OpenAPI" },
];

const otherStack = [
  { name: "PostgreSQL" },
  { name: "Maven" },
  { name: "Node.js" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">About</h1>
        <p className="text-muted-foreground">Company background and technology stack</p>
      </div>

      {/* Company Background */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Company Background</CardTitle>
              <CardDescription>MM Torres Optical Clinic</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            MM Torres Optical Clinic is a dedicated eye care provider committed to delivering
            quality optical services and products to its community. The clinic offers comprehensive
            eye examinations, prescription eyewear, contact lenses, and a curated selection of
            frames and lenses from trusted brands.
          </p>
          <p>
            With a focus on both clinical excellence and customer satisfaction, MM Torres Optical
            combines professional optometry services with a retail optical shop, providing patients
            with a seamless experience from eye examination to eyewear dispensing.
          </p>
          <p>
            The Optical Clinic Management System was developed to modernize and streamline the
            clinic&apos;s daily operations. By digitizing inventory management, billing and payment
            transactions, patient records, and administrative functions, the system enables
            staff to focus more on patient care and less on paperwork.
          </p>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Technology Stack</CardTitle>
              <CardDescription>
                Technologies and frameworks used in the development of this system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Frontend */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              Frontend
            </h3>
            <div className="flex flex-wrap gap-2">
              {frontendStack.map((tech) => (
                <Badge key={tech.name} variant="secondary" className="px-3 py-1.5 text-sm">
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Backend */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              Backend
            </h3>
            <div className="flex flex-wrap gap-2">
              {backendStack.map((tech) => (
                <Badge key={tech.name} variant="secondary" className="px-3 py-1.5 text-sm">
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Infrastructure */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              Infrastructure &amp; Tools
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherStack.map((tech) => (
                <Badge key={tech.name} variant="secondary" className="px-3 py-1.5 text-sm">
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Version */}
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Version</h3>
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              v1.0.0
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
