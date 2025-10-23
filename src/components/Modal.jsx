
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import '../styles/Modal.css';

export default function Modal({
  open,
  title,
  content,
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  className,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth className={className}>
      {title && <DialogTitle className="modal-header">{title}</DialogTitle>}
      <DialogContent dividers>{content}</DialogContent>
      <DialogActions>
        <Button className="cancel-button" onClick={onCancel} color="inherit" variant="outlined">
          {cancelText}
        </Button>
        <Button className="save-button" onClick={onSave} color="primary" variant="contained">
          {saveText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}