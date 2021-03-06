import { Card } from "@mui/material";
import { FC, ReactNode } from "react";

interface TopLevelCardProps {
  children: ReactNode;
}
export const TopLevelCard: FC<TopLevelCardProps> = ({ children }) => (
  <Card raised sx={{ my: 2 }}>
    {children}
  </Card>
);
