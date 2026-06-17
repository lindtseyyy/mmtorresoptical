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
            placeholder="Search by patient name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-[500px] overflow-y-auto">
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
            <div className="space-y-0.5">
              {patients.map((patient) => (
                <div
                  key={patient.patientId}
                  className="flex items-center rounded-md border px-3 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 mr-2 shrink-0">
                    <UserRound className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate leading-tight">
                      {patient.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                      {patient.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="ml-2 shrink-0 h-7 px-2 text-xs"
                    onClick={() => {
                      onSelect(patient);
                      onOpenChange(false);
                    }}
                  >
                    Select
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
