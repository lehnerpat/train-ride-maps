import { Card } from "@mui/material";
import { FC, ReactNode } from "react";

interface TopLevelCardProps {
  children: ReactNode;
}
export const TopLevelCard: FC<TopLevelCardProps> = ({ children }) => (
  <Card raised sx={{ mx: 4, my: 2 }}>
    {children}
  </Card>
);
