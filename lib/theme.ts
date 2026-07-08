import { createTheme } from "@mui/material/styles";
import { heIL } from "@mui/material/locale";

const theme = createTheme(
  {
    direction: "rtl",
    palette: {
      mode: "dark",
      primary: { main: "#F2A93B", contrastText: "#1a1305" },
      error: { main: "#E14B4B" },
      success: { main: "#4CD07A" },
      background: { default: "#0F1B2D", paper: "#16243F" },
      text: { primary: "#F5F7FA", secondary: "#90A2BC" },
      divider: "#24365A",
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "'Assistant', sans-serif",
      h1: { fontFamily: "'Heebo', sans-serif", fontWeight: 700 },
      h2: { fontFamily: "'Heebo', sans-serif", fontWeight: 700 },
      h3: { fontFamily: "'Heebo', sans-serif", fontWeight: 700 },
      h4: { fontFamily: "'Heebo', sans-serif", fontWeight: 700 },
      h5: { fontFamily: "'Heebo', sans-serif", fontWeight: 700 },
      h6: { fontFamily: "'Heebo', sans-serif", fontWeight: 700 },
      button: { fontFamily: "'Assistant', sans-serif", fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: "none" } },
      },
      MuiCard: {
        styleOverrides: {
          root: { border: "1px solid #24365A" },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
        },
      },
    },
  },
  heIL
);

export default theme;
