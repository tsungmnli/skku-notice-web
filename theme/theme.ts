import { createTheme, type MantineColorsTuple } from "@mantine/core";

const skkuGreen: MantineColorsTuple = [
  "#f0f7f3",
  "#d9ebdf",
  "#b3d7c0",
  "#84b89a",
  "#4f9070",
  "#2f7355",
  "#1f5a40",
  "#194733",
  "#133626",
  "#0d2418",
];

export const theme = createTheme({
  primaryColor: "skku-green",
  primaryShade: { light: 6, dark: 4 },
  colors: {
    "skku-green": skkuGreen,
  },
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  headings: {
    fontWeight: "700",
  },
  components: {
    Button: {
      defaultProps: {
        size: "sm",
      },
    },
    ActionIcon: {
      defaultProps: {
        size: "lg",
      },
    },
  },
});
