"use client";

import { Paper, Stack, Text, Title } from "@mantine/core";
import classes from "./Auth.module.css";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, description, children }: Props) {
  return (
    <div className={classes.page}>
      <Paper className={classes.card} shadow="none">
        <Stack gap="lg">
          <Stack gap={6}>
            <Title order={1} size="h2" className={classes.heading}>
              {title}
            </Title>
            {description && (
              <Text size="sm" c="dimmed" className={classes.subtle}>
                {description}
              </Text>
            )}
          </Stack>
          {children}
        </Stack>
      </Paper>
    </div>
  );
}
