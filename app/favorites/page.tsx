import type { Metadata } from "next";
import { FavoritesClient } from "@/components/page/Favorites";

export const metadata: Metadata = {
  title: "즐겨찾기 | SKKU 공지",
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
