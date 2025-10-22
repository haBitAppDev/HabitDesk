import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: "center", mt: 12 }}>
      <Typography variant="h3" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Die gewünschte Seite wurde nicht gefunden.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Zurück zum Dashboard
      </Button>
    </Box>
  );
}
