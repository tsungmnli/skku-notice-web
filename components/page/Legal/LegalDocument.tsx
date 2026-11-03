"use client";

import { Stack, Title, Text, Container, Anchor } from "@mantine/core";
import type { LegalDocument, LegalClause } from "@/lib/legal/documents";
import classes from "./LegalDocument.module.css";

type Props = {
  title: string;
  document: LegalDocument;
};

function Clause({ clause }: { clause: LegalClause }) {
  return (
    <section id={clause.id} className={classes.clause}>
      <Title order={3} className={classes.clauseTitle}>
        {clause.title}
      </Title>
      {clause.body.map((paragraph, index) => (
        <Text key={index} size="sm" className={classes.clauseBody}>
          {paragraph}
        </Text>
      ))}
    </section>
  );
}

export function LegalDocumentView({ title, document }: Props) {
  return (
    <Container size="sm" className={classes.page}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} className={classes.title}>
            {title}
          </Title>
          <Text size="xs" c="dimmed">
            시행일: {document.effectiveDate}
          </Text>
        </Stack>
        <Stack gap="md">
          {document.clauses.map((clause) => (
            <Anchor key={clause.id} href={`#${clause.id}`} className={classes.tocLink}>
              {clause.title}
            </Anchor>
          ))}
        </Stack>
        <Stack gap="lg">
          {document.clauses.map((clause) => (
            <Clause key={clause.id} clause={clause} />
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
