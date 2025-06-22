"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isBulk: boolean;
  selectedCount?: number;
  error?: string | null;
  isLoading: boolean;
}

export function ApprovalConfirmationModal({
  isOpen,
  onClose,
  onSubmit,
  isBulk,
  selectedCount = 0,
  error,
  isLoading
}: ApprovalConfirmationModalProps) {
  const handleSubmit = async () => {
    try {
      await onSubmit();
    } catch {
      // Error handling is managed by the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBulk 
              ? `Approve ${selectedCount} Posts` 
              : "Approve Post"
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to approve {isBulk ? "these posts" : "this post"}?
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}