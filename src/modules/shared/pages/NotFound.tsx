import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../../../i18n/I18nProvider";

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Box sx={{ textAlign: "center", mt: 12 }}>
      <Typography variant="h3" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        {t("notFound.subtitle", "The requested page could not be found.")}
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        {t("notFound.action", "Back to home")}
      </Button>
    </Box>
  );
}
