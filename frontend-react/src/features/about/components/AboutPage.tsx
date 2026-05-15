import { Building2, Layers, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

const frontendStack = [
  { name: "React", version: "19.1.1" },
  { name: "TypeScript", version: "5.9.3" },
  { name: "Vite", version: "7.1.7" },
  { name: "React Router", version: "7.9.5" },
  { name: "Tailwind CSS", version: "4.1.17" },
  { name: "TanStack React Query", version: "5.90.7" },
  { name: "Axios", version: "1.13.2" },
  { name: "React Hook Form", version: "7.66.0" },
  { name: "Zod", version: "4.1.12" },
  { name: "Lucide React", version: "0.553.0" },
  { name: "Sonner", version: "2.0.7" },
  { name: "Radix UI Primitives", version: "2.x" },
  { name: "Shadcn UI", version: "latest" },
];

const backendStack = [
  { name: "Spring Boot", version: "3.5.7" },
  { name: "Java", version: "17" },
  { name: "Spring Security", version: "6.x" },
  { name: "Spring Data JPA", version: "3.x" },
  { name: "PostgreSQL", version: "42.7.3" },
  { name: "JJWT", version: "0.11.5" },
  { name: "Lombok", version: "1.18.32" },
  { name: "MapStruct", version: "1.6.3" },
  { name: "Apache PDFBox", version: "2.0.29" },
  { name: "Apache POI", version: "5.2.3" },
  { name: "SpringDoc OpenAPI", version: "2.8.6" },
];

const otherStack = [
  { name: "PostgreSQL", version: "14+" },
  { name: "Maven", version: "3.x" },
  { name: "Node.js", version: "20+" },
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
                <Badge key={tech.name} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                  {tech.name}
                  <span className="text-muted-foreground">{tech.version}</span>
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
                <Badge key={tech.name} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                  {tech.name}
                  <span className="text-muted-foreground">{tech.version}</span>
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
                <Badge key={tech.name} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                  {tech.name}
                  <span className="text-muted-foreground">{tech.version}</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
