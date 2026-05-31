import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, UserRound } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { searchPatients } from "@/features/patients/services/patientApi";
import type { SelectedPatient } from "@/features/sales/types";

interface PatientPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (patient: SelectedPatient) => void;
}

const PatientPickerModal: React.FC<PatientPickerModalProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setDebouncedKeyword("");
    }
  }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-search", debouncedKeyword],
    queryFn: () => searchPatients(debouncedKeyword, 0, 20),
    enabled: open,
    staleTime: 30_000,
  });

  const patients = data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Patient Record</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by patient name, contact number, or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : patients.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {debouncedKeyword
                  ? "No patients found matching your search query."
                  : "Type to search for patients."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {patients.map((patient) => (
                <div
                  key={patient.patientId}
                  className="flex items-center rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mr-3 shrink-0">
                    <UserRound className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {patient.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {patient.patientId.slice(0, 8)} &middot;{" "}
                      {patient.contactNumber}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="ml-3 shrink-0"
                    onClick={() => {
                      onSelect(patient);
                      onOpenChange(false);
                    }}
                  >
                    Select Patient
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientPickerModal;
