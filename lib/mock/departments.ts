import { todayInSeoul } from "../../utils/date";
import { ApiError } from "../api/errors";
import type {
  Department,
  Source,
  Status,
  ReadItem,
  ReadsResponse,
  ReadsSaved,
} from "../api/types";
import { mockCurrentUserId } from "./auth";
import { mockArticles, MOCK_DEPARTMENT_DEFS, MOCK_BOARD_DEFS } from "./data";

const MOCK_DELAYED_SLUGS: string[] = [];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const READS_KEY_PREFIX = "skku-mock-reads:";

function readReads(userId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(READS_KEY_PREFIX + userId);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeReads(userId: string, reads: Record<string, string>): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      READS_KEY_PREFIX + userId,
      JSON.stringify(reads),
    );
  }
}

export async function mockListDepartments(): Promise<Department[]> {
  await delay(150);
  return MOCK_DEPARTMENT_DEFS.map((deptDef) => {
    const boardDefs = MOCK_BOARD_DEFS.filter(
      (b) => b.department === deptDef.code,
    );
    const sources: Source[] = boardDefs.map((board) => ({
      slug: board.slug,
      name: board.name,
      level: board.level,
      common: board.common,
      count: mockArticles.filter((a) => a.source === board.slug).length,
    }));
    const count = sources.reduce((sum, s) => sum + s.count, 0);
    return {
      code: deptDef.code,
      name: deptDef.name,
      kind: deptDef.kind,
      college: deptDef.college,
      count,
      sources,
      board_url: deptDef.board_url ?? null,
    };
  });
}

export async function mockGetStatus(): Promise<Status> {
  await delay(150);
  const allSlugs = ["skku", ...MOCK_BOARD_DEFS.map((b) => b.slug)];
  const now = todayInSeoul();
  return {
    sources: allSlugs.map((slug) => {
      const delayed = MOCK_DELAYED_SLUGS.includes(slug);
      const minutesAgo = delayed ? 300 : 3 + (slug.length % 5);
      return {
        slug,
        last_crawled_at: now
          .subtract(minutesAgo, "minute")
          .format("YYYY-MM-DDTHH:mm:ssZ"),
        delayed,
      };
    }),
  };
}

export async function mockListReads(): Promise<ReadsResponse> {
  await delay(150);
  const userId = mockCurrentUserId();
  if (!userId) {
    throw new ApiError("로그인이 필요합니다.", 401, "not_authenticated");
  }
  const reads = readReads(userId);
  return {
    items: Object.entries(reads).map(([id, readAt]) => ({
      article_id: Number(id),
      read_at: readAt,
    })),
  };
}

export async function mockMarkReads(items: ReadItem[]): Promise<ReadsSaved> {
  await delay(200);
  const userId = mockCurrentUserId();
  if (!userId) {
    throw new ApiError("로그인이 필요합니다.", 401, "not_authenticated");
  }
  if (items.length > 200) {
    throw new ApiError("한 번에 200개까지 가능합니다.", 422);
  }
  const validIds = new Set(mockArticles.map((a) => a.id));
  const reads = readReads(userId);
  let saved = 0;
  for (const item of items) {
    if (!validIds.has(item.article_id)) continue;
    saved++;
    const readAt = item.read_at || new Date().toISOString();
    const prev = reads[String(item.article_id)];
    if (!prev || readAt > prev) {
      reads[String(item.article_id)] = readAt;
    }
  }
  writeReads(userId, reads);
  return { saved };
}
