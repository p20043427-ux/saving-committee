import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen, title, message, confirmLabel = "확인", cancelLabel = "취소",
  variant = "danger", onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={isOpen}
      title={title}
      onClose={onCancel}
      width={384}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} size="md" onClick={onConfirm} autoFocus>{confirmLabel}</Button>
        </>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}
