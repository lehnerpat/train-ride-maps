import { createTheme } from "@mui/material/styles";
import { amber, deepPurple } from "@mui/material/colors";

export const theme = createTheme({
  palette: {
    primary: deepPurple,
    secondary: amber,
    mode: "dark",
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        thumb: ({ ownerState, theme }) => ({
          ...(ownerState.color === "primary" && {
            color: theme.palette.primary.light,
          }),
        }),
        track: ({ ownerState, theme }) => ({
          ...(ownerState.color === "primary" && {
            color: theme.palette.primary.light,
          }),
        }),
      },
    },
  },
});
