import { useNavigate } from "react-router-dom";
import { FileSearch } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <FileSearch className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
      </div>

      <h1 className="text-8xl font-extrabold tracking-tight text-primary">
        404
      </h1>

      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        Page Not Found
      </h2>

      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
        Check the URL or return to the homepage.
      </p>

      <Button
        size="lg"
        className="mt-8"
        onClick={() => navigate("/inventory")}
      >
        Return to Homepage
      </Button>
    </div>
  );
};

export default NotFound;
