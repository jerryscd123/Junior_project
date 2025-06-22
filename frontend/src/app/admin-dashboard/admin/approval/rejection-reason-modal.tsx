"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (admin_note: string) => Promise<void>;
  isBulk: boolean;
  selectedCount?: number;
  error?: string | null;
  isLoading: boolean;
}

export function RejectionReasonModal({
  isOpen,
  onClose,
  onSubmit,
  isBulk,
  selectedCount = 0,
  error,
  isLoading
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    try {
      await onSubmit(reason);
      setReason("");
    } catch {
      // Error handling is managed by the parent component
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBulk 
              ? `Reject ${selectedCount} Posts` 
              : "Reject Post"
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting {isBulk ? "these posts" : "this post"}. 
            This will be stored as an admin note.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Textarea
            placeholder="Enter admin note for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Rejecting...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Reject
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}