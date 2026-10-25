"use client";

import {
  Button,
  Group,
  ActionIcon,
  useMantineColorScheme,
  Text,
} from "@mantine/core";
import { IconSun, IconMoon, IconStar } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classes from "./Header.module.css";

const navItems = [
  { href: "/", label: "공지사항" },
  { href: "/favorites", label: "즐겨찾기" },
  { href: "/calendar", label: "캘린더" },
];

export function Header() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Link href="/" className={classes.logo}>
          <Text fw={800} size="lg" c="var(--accent-green)">
            SKKU
          </Text>
          <Text fw={500} size="sm" c="dimmed" className={classes.logoSub}>
            공지사항
          </Text>
        </Link>

        <Group gap="sm" className={classes.nav}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant="subtle"
                color="gray"
                className={active ? classes.activeNav : undefined}
                size="sm"
                leftSection={
                  item.href === "/favorites" ? (
                    <IconStar size={16} />
                  ) : undefined
                }
              >
                {item.label}
              </Button>
            );
          })}
        </Group>

        <ActionIcon
          onClick={toggleColorScheme}
          variant="subtle"
          color="gray"
          aria-label="색상 테마 전환"
        >
          {colorScheme === "dark" ? (
            <IconSun size={20} />
          ) : (
            <IconMoon size={20} />
          )}
        </ActionIcon>
      </div>
    </header>
  );
}
