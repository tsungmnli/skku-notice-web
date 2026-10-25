"use client";

import {
  Group,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { IconBell, IconStar, IconCalendar } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classes from "./BottomTabs.module.css";

const tabs = [
  { href: "/", label: "공지", icon: IconBell },
  { href: "/favorites", label: "즐겨찾기", icon: IconStar },
  { href: "/calendar", label: "캘린더", icon: IconCalendar },
];

export function BottomTabs() {
  const pathname = usePathname();
  const { colorScheme } = useMantineColorScheme();

  return (
    <nav className={classes.nav} aria-label="하단 탭">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={classes.link}
            aria-label={tab.label}
          >
            <UnstyledButton className={classes.button} data-active={active}>
              <Group gap={4} align="center" wrap="nowrap">
                <Icon
                  size={22}
                  stroke={active ? 2.2 : 1.8}
                  color={
                    active
                      ? colorScheme === "dark"
                        ? "var(--mantine-color-skku-green-4)"
                        : "var(--mantine-color-skku-green-6)"
                      : "var(--mantine-color-gray-5)"
                  }
                />
                <Text
                  size="xs"
                  fw={active ? 600 : 500}
                  c={active ? "var(--mantine-color-skku-green-6)" : "dimmed"}
                >
                  {tab.label}
                </Text>
              </Group>
            </UnstyledButton>
          </Link>
        );
      })}
    </nav>
  );
}
