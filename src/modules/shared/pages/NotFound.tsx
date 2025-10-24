import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../../../i18n/I18nProvider";

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.35;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.6;
  }
`;

const streak = keyframes`
  0% {
    transform: translateX(-30%) translateY(0);
    opacity: 0;
  }
  40% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(130%) translateY(-8%);
    opacity: 0;
  }
`;

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: { xs: 6, md: 10 },
        background: (theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(180deg, #e8edff 0%, #f8fafc 100%)"
            : "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)",
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: "100%",
          maxWidth: 560,
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          textAlign: "left",
          position: "relative",
          overflow: "hidden",
          color: "common.white",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(56,91,230,0.95) 100%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 20% 20%, rgba(129,140,248,0.45), transparent 55%), radial-gradient(circle at 80% 70%, rgba(96,165,250,0.45), transparent 50%)",
            opacity: 0.65,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: { xs: -60, sm: -70 },
            right: { xs: -20, sm: -10 },
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(148,163,255,0.15)",
            animation: `${float} 6s ease-in-out infinite`,
            filter: "blur(0px)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: { xs: -70, sm: -90 },
            left: { xs: -40, sm: -50 },
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.15)",
            animation: `${pulse} 10s ease-in-out infinite`,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 240,
            height: 120,
            top: "20%",
            left: "-10%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0) 100%)",
            filter: "blur(6px)",
            animation: `${streak} 6s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            animationDelay: "1.2s",
          }}
        />

        <Stack spacing={3} sx={{ position: "relative", alignItems: "flex-start" }}>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 6,
              textTransform: "uppercase",
              fontWeight: 600,
              color: "rgba(226,232,240,0.85)",
            }}
          >
            HabitDesk
          </Typography>
          <Typography
            component="p"
            sx={{
              fontSize: { xs: "3rem", sm: "4.25rem" },
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            404
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {t("notFound.title", "We hit a blank spot.")}
          </Typography>
          <Typography variant="body1">
            {t("notFound.tagline", "HabitDesk is almost back online for you.")}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {t(
              "notFound.helper",
              "Double-check the address or jump back to your dashboard."
            )}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="flex-start"
            sx={{ pt: 1 }}
          >
            <Button
              size="large"
              variant="contained"
              color="secondary"
              onClick={() => navigate("/")}
            >
              {t("notFound.action", "Return to dashboard")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
