"use client";

import {
  ActionIcon,
  Button,
  Group,
  Menu,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconStar,
  IconUserCircle,
  IconLogout,
  IconChevronDown,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { safeNext } from "@/lib/auth/safeNext";
import classes from "./Header.module.css";

const navItems = [
  { href: "/", label: "공지사항" },
  { href: "/dept", label: "학과" },
  { href: "/favorites", label: "즐겨찾기" },
  { href: "/calendar", label: "캘린더" },
];

export function Header() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  const loginHref = `/login?next=${encodeURIComponent(safeNext(pathname))}`;

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
            const active =
              pathname === item.href ||
              (item.href === "/dept" && pathname.startsWith("/dept"));
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

        <Group gap="sm" align="center" className={classes.actions}>
          {status === "loading" ? (
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              visibleFrom="36em"
              disabled
              loading
            >
              로그인
            </Button>
          ) : status === "authenticated" && user ? (
            <Menu shadow="md" width={240} position="bottom-end">
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  leftSection={<IconUserCircle size={18} />}
                  rightSection={<IconChevronDown size={14} />}
                  styles={{ root: { maxWidth: 160 } }}
                >
                  <span className={classes.userLabel}>
                    {user.name || user.email}
                  </span>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="xs" c="dimmed">
                    {user.email}
                  </Text>
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconUserCircle size={16} />}
                  component={Link}
                  href="/account"
                >
                  내 계정
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                  color="red"
                >
                  로그아웃
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button
              component={Link}
              href={loginHref}
              variant="light"
              color="skku-green"
              size="sm"
              visibleFrom="36em"
            >
              로그인
            </Button>
          )}

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
        </Group>
      </div>
    </header>
  );
}
