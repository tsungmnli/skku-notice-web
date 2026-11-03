"use client";

import {
  Group,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconBell,
  IconStar,
  IconCalendar,
  IconUserCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { safeNext } from "@/lib/auth/safeNext";
import classes from "./BottomTabs.module.css";

const tabs = [
  { href: "/", label: "공지", icon: IconBell },
  { href: "/favorites", label: "즐겨찾기", icon: IconStar },
  { href: "/calendar", label: "캘린더", icon: IconCalendar },
];

export function BottomTabs() {
  const pathname = usePathname();
  const { colorScheme } = useMantineColorScheme();
  const { status } = useAuth();

  const accountHref =
    status === "authenticated"
      ? "/account"
      : `/login?next=${encodeURIComponent(safeNext(pathname))}`;
  const accountActive = pathname === "/account";

  const activeColor =
    colorScheme === "dark"
      ? "var(--mantine-color-skku-green-4)"
      : "var(--mantine-color-skku-green-6)";

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
                  color={active ? activeColor : "var(--mantine-color-gray-5)"}
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
      <Link href={accountHref} className={classes.link} aria-label="계정">
        <UnstyledButton className={classes.button} data-active={accountActive}>
          <Group gap={4} align="center" wrap="nowrap">
            <IconUserCircle
              size={22}
              stroke={accountActive ? 2.2 : 1.8}
              color={
                accountActive ? activeColor : "var(--mantine-color-gray-5)"
              }
            />
            <Text
              size="xs"
              fw={accountActive ? 600 : 500}
              c={accountActive ? "var(--mantine-color-skku-green-6)" : "dimmed"}
            >
              {status === "authenticated" ? "계정" : "로그인"}
            </Text>
          </Group>
        </UnstyledButton>
      </Link>
    </nav>
  );
}
