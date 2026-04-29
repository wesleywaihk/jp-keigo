"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import StarIcon from "@mui/icons-material/Star";
import questions from "@/data/questions.json";

// ── Types ─────────────────────────────────────────────────────────────────────

type Question = {
  futsugo: string;
  zh: string;
  keigo: { written: string; read: string }[];
};

const ALL = questions as Question[];

type Screen = "landing" | "quiz" | "results" | "bookmarks";
type BookmarkLevel = 0 | 1 | 2;
type BookmarkMap = Record<number, BookmarkLevel>;

type QuizRecord = {
  index: number;
  question: Question;
  userInput: string;
  correct: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.replace(/[\s　、。！？・]/g, "");
}

function sampleN(pool: number[], n: number) {
  return [...pool]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(n, pool.length));
}

const LS_KEY = "keigo-bookmarks";
const LS_ORDER_KEY = "keigo-bookmark-order";

type BookmarkOrderMap = Record<number, number>;

function loadBookmarks(): BookmarkMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveBookmarks(m: BookmarkMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(m));
}

function loadBookmarkOrder(): BookmarkOrderMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_ORDER_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveBookmarkOrder(m: BookmarkOrderMap) {
  localStorage.setItem(LS_ORDER_KEY, JSON.stringify(m));
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const cardBase = {
  width: "100%",
  background: "var(--card)",
  borderRadius: 3,
  border: "1px solid var(--border)",
  boxShadow: "0 4px 24px rgba(46,125,82,0.1)",
};

const primaryBtn = {
  background: "var(--accent)",
  color: "#fff",
  "&:hover": { background: "var(--accent-hover)" },
  "&.Mui-disabled": { background: "var(--border)", color: "var(--text-muted)" },
  borderRadius: 2,
  py: 1.5,
  fontWeight: 600,
  fontSize: "1rem",
  textTransform: "none" as const,
  boxShadow: "none",
};

const outlineBtn = {
  borderColor: "var(--accent)",
  color: "var(--accent)",
  "&:hover": {
    background: "var(--accent-soft)",
    borderColor: "var(--accent-hover)",
  },
  "&.Mui-disabled": {
    borderColor: "var(--border)",
    color: "var(--text-muted)",
  },
  borderRadius: 2,
  py: 1.5,
  fontWeight: 600,
  fontSize: "1rem",
  textTransform: "none" as const,
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "var(--surface)",
    borderRadius: 2,
    color: "var(--foreground)",
    fontSize: "1.05rem",
    "& fieldset": { borderColor: "var(--border)" },
    "&:hover fieldset": { borderColor: "var(--accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--accent)" },
    "&.Mui-disabled": { opacity: 0.55 },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "var(--text-muted)",
    opacity: 1,
  },
};

// ── BookmarkBtn ───────────────────────────────────────────────────────────────

const BM_COLOR: Record<BookmarkLevel, string> = {
  0: "var(--text-muted)",
  1: "var(--accent)",
  2: "#e67e22",
};
const BM_HINT: Record<BookmarkLevel, string> = {
  0: "Bookmark",
  1: "★ Level 1 · click for level 2",
  2: "★★ Level 2 · click to remove",
};

function BmBtn({
  level,
  onToggle,
  listMode = false,
}: {
  level: BookmarkLevel;
  onToggle: () => void;
  listMode?: boolean;
}) {
  const Icon =
    level === 0 ? BookmarkBorderIcon : level === 1 ? BookmarkIcon : StarIcon;
  const hint =
    listMode && level === 2 ? "★★ Level 2 · click for level 1" : BM_HINT[level];
  return (
    <Tooltip title={hint}>
      <IconButton
        size="small"
        onClick={onToggle}
        sx={{ color: BM_COLOR[level] }}
      >
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

// ── LandingScreen ─────────────────────────────────────────────────────────────

function LandingScreen({
  bookmarks,
  onStart,
  onViewBookmarks,
}: {
  bookmarks: BookmarkMap;
  onStart: (idxs: number[]) => void;
  onViewBookmarks: () => void;
}) {
  const allPool = ALL.map((_, i) => i);
  const bmIdxs = Object.keys(bookmarks)
    .map(Number)
    .filter((i) => (bookmarks[i] ?? 0) > 0);

  const lv1Count = bmIdxs.filter((i) => bookmarks[i] === 1).length;
  const lv2Count = bmIdxs.filter((i) => bookmarks[i] === 2).length;

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <Box className="mb-2 text-center">
        <Typography
          variant="h4"
          sx={{ color: "var(--accent)", letterSpacing: 2, fontWeight: 700 }}
        >
          敬語練習
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "var(--text-muted)", mt: 0.5 }}
        >
          Keigo Practice
        </Typography>
      </Box>

      {/* Count selector */}
      <Card sx={{ ...cardBase, maxWidth: 560 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="overline"
            sx={{ color: "var(--text-muted)", letterSpacing: 2 }}
          >
            Start Quiz
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--text-muted)", mt: 0.5, mb: 3 }}
          >
            Choose number of questions
          </Typography>
          <Box className="flex flex-wrap gap-3">
            {[5, 10, 15, 20, 25].map((n) => (
              <Button
                key={n}
                variant="contained"
                onClick={() => onStart(sampleN(allPool, n))}
                sx={{ ...primaryBtn, minWidth: 72 }}
              >
                {n}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* All questions link */}
      <Card sx={{ ...cardBase, maxWidth: 560 }}>
        <CardContent
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ color: "var(--text-muted)", letterSpacing: 2 }}
            >
              Question List
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--text-muted)", mt: 0.5 }}
            >
              Browse all {ALL.length} questions
            </Typography>
          </Box>
          <Link href="/questions" style={{ textDecoration: "none" }}>
            <Button variant="outlined" sx={outlineBtn}>
              View All →
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Bookmarks card */}
      <Card sx={{ ...cardBase, maxWidth: 560 }}>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex items-start justify-between gap-3">
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "var(--text-muted)", letterSpacing: 2 }}
              >
                Bookmarks
              </Typography>
              <Box className="flex items-center gap-3 mt-1">
                <Box className="flex items-center gap-1">
                  <BookmarkIcon sx={{ color: "var(--accent)", fontSize: 16 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--text-muted)" }}
                    suppressHydrationWarning
                  >
                    {lv1Count}
                  </Typography>
                </Box>
                <Box className="flex items-center gap-1">
                  <StarIcon sx={{ color: "#e67e22", fontSize: 16 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--text-muted)" }}
                    suppressHydrationWarning
                  >
                    {lv2Count}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Button
              variant="outlined"
              disabled={bmIdxs.length === 0}
              onClick={() => onStart(sampleN(bmIdxs, bmIdxs.length))}
              sx={outlineBtn}
            >
              Practice Bookmarks
            </Button>
          </Box>

          {bmIdxs.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "var(--text-muted)", mt: 2, fontStyle: "italic" }}
            >
              No bookmarks yet. Add them during a quiz or from the results
              screen.
            </Typography>
          ) : (
            <>
              <Divider sx={{ my: 2, borderColor: "var(--border)" }} />
              <Button
                size="small"
                onClick={onViewBookmarks}
                sx={{
                  color: "var(--accent)",
                  textTransform: "none",
                  p: 0,
                  fontWeight: 600,
                }}
              >
                View bookmark list →
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// ── BookmarkListScreen ────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function BookmarkListScreen({
  bookmarks,
  bookmarkOrder,
  onToggleBookmark,
  onDeleteBookmark,
  onBack,
}: {
  bookmarks: BookmarkMap;
  bookmarkOrder: BookmarkOrderMap;
  onToggleBookmark: (idx: number) => void;
  onDeleteBookmark: (idx: number) => void;
  onBack: () => void;
}) {
  const [page, setPage] = useState(0);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const bmIdxs = Object.keys(bookmarks)
    .map(Number)
    .filter((i) => (bookmarks[i] ?? 0) > 0)
    .sort((a, b) => (bookmarkOrder[a] ?? 0) - (bookmarkOrder[b] ?? 0));

  const totalPages = Math.max(1, Math.ceil(bmIdxs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = bmIdxs.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  return (
    <Box className="min-h-screen flex flex-col items-center p-4 pt-10">
      <Box className="w-full mb-6" sx={{ maxWidth: 600 }}>
        <Button
          size="small"
          onClick={onBack}
          sx={{
            color: "var(--text-muted)",
            textTransform: "none",
            mb: 2,
            p: 0,
          }}
        >
          ← Back
        </Button>
        <Box className="flex items-baseline justify-between">
          <Typography
            variant="h5"
            sx={{ color: "var(--accent)", fontWeight: 700 }}
          >
            Bookmarks
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-muted)" }}>
            {bmIdxs.length} total
          </Typography>
        </Box>
      </Box>

      {bmIdxs.length === 0 ? (
        <Typography sx={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          No bookmarks yet.
        </Typography>
      ) : (
        <>
          <Box
            sx={{ width: "100%", maxWidth: 600 }}
            className="flex flex-col gap-3"
          >
            {pageItems.map((idx) => {
              const lv = (bookmarks[idx] ?? 0) as BookmarkLevel;
              const q = ALL[idx];
              return (
                <Card key={idx} sx={cardBase}>
                  <CardContent sx={{ p: 3 }}>
                    <Box className="flex items-start justify-between gap-2">
                      <Box className="flex-1 min-w-0">
                        <Typography
                          sx={{
                            color: "var(--foreground)",
                            fontWeight: 600,
                            fontSize: "1rem",
                          }}
                        >
                          {q.futsugo}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "var(--text-muted)", mb: 1.5 }}
                        >
                          {q.zh}
                        </Typography>
                        <Divider
                          sx={{ borderColor: "var(--border)", mb: 1.5 }}
                        />
                        <Box className="flex flex-col gap-2">
                          {q.keigo.map((k, i) => (
                            <Box
                              key={i}
                              className="rounded-lg px-3 py-2"
                              sx={{
                                background: "var(--accent-soft)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "var(--foreground)",
                                  fontSize: "0.95rem",
                                  fontWeight: 500,
                                }}
                              >
                                {k.written}
                              </Typography>
                              {k.read !== k.written && (
                                <Typography
                                  sx={{
                                    color: "var(--text-muted)",
                                    fontSize: "0.8rem",
                                    mt: 0.5,
                                  }}
                                >
                                  {k.read}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      <Box className="flex items-center">
                        <BmBtn
                          level={lv}
                          onToggle={() => onToggleBookmark(idx)}
                          listMode
                        />
                        <Tooltip title="Remove bookmark">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteIdx(idx)}
                            sx={{ color: "var(--text-muted)" }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Pagination */}
          <Box className="flex items-center gap-3 mt-6 mb-12">
            <Button
              variant="outlined"
              size="small"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
              sx={{ ...outlineBtn, py: 0.5, minWidth: 80 }}
            >
              ← Prev
            </Button>
            <Typography variant="body2" sx={{ color: "var(--text-muted)" }}>
              {safePage + 1} / {totalPages}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              sx={{ ...outlineBtn, py: 0.5, minWidth: 80 }}
            >
              Next →
            </Button>
          </Box>
        </>
      )}

      <Dialog open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <DialogTitle sx={{ color: "var(--foreground)" }}>
          Remove Bookmark
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--text-muted)" }}>
            Remove this bookmark?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteIdx(null)}
            sx={{ color: "var(--text-muted)", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDeleteBookmark(deleteIdx!);
              setDeleteIdx(null);
            }}
            sx={{
              color: "var(--error, #e74c3c)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── QuizScreen ────────────────────────────────────────────────────────────────

function QuizScreen({
  indices,
  bookmarks,
  onToggleBookmark,
  onFinish,
  onQuit,
}: {
  indices: number[];
  bookmarks: BookmarkMap;
  onToggleBookmark: (idx: number) => void;
  onFinish: (records: QuizRecord[]) => void;
  onQuit: () => void;
}) {
  const [cursor, setCursor] = useState(0);
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState<boolean | null>(null);
  const recordsRef = useRef<QuizRecord[]>([]);

  const idx = indices[cursor];
  const q = ALL[idx];
  const isLast = cursor === indices.length - 1;
  const bmLevel = (bookmarks[idx] ?? 0) as BookmarkLevel;
  const progress =
    ((cursor + (answered !== null ? 1 : 0)) / indices.length) * 100;

  const handleSubmit = useCallback(() => {
    if (!input.trim() || answered !== null) return;
    const trimmed = normalize(input.trim());
    const correct = q.keigo.some(
      (k) => normalize(k.written) === trimmed || normalize(k.read) === trimmed,
    );
    setAnswered(correct);
    recordsRef.current = [
      ...recordsRef.current,
      { index: idx, question: q, userInput: input.trim(), correct },
    ];
  }, [input, answered, q, idx]);

  const handleNext = useCallback(() => {
    if (answered === null) return;
    if (isLast) {
      onFinish(recordsRef.current);
      return;
    }
    setCursor((c) => c + 1);
    setInput("");
    setAnswered(null);
  }, [answered, isLast, onFinish]);

  const handleSkip = useCallback(() => {
    if (answered !== null) return;
    recordsRef.current = [
      ...recordsRef.current,
      { index: idx, question: q, userInput: "", correct: false },
    ];
    if (isLast) {
      onFinish(recordsRef.current);
      return;
    }
    setCursor((c) => c + 1);
    setInput("");
    setAnswered(null);
  }, [answered, idx, isLast, onFinish, q]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (answered === null) handleSubmit();
    else handleNext();
  };

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center p-4">
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
        <Button
          size="small"
          onClick={onQuit}
          sx={{
            color: "var(--text-muted)",
            textTransform: "none",
            fontSize: "0.85rem",
          }}
        >
          Quit ✕
        </Button>
      </Box>
      <Box className="mb-8 text-center">
        <Typography
          variant="h4"
          sx={{ color: "var(--accent)", letterSpacing: 2, fontWeight: 700 }}
        >
          敬語練習
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "var(--text-muted)", mt: 0.5 }}
        >
          {cursor + 1} / {indices.length}
        </Typography>
        <Box sx={{ width: 200, mt: 1.5, mx: "auto" }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 5,
              borderRadius: 3,
              background: "var(--border)",
              "& .MuiLinearProgress-bar": {
                background: "var(--accent)",
                borderRadius: 3,
              },
            }}
          />
        </Box>
      </Box>

      <Card sx={{ ...cardBase, maxWidth: 560 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Prompt */}
          <Box className="mb-6">
            <Box className="flex items-start justify-between">
              <Typography
                variant="overline"
                sx={{ color: "var(--text-muted)", letterSpacing: 2 }}
              >
                普通語 → 敬語に変えてください
              </Typography>
              <BmBtn level={bmLevel} onToggle={() => onToggleBookmark(idx)} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: "var(--foreground)",
                mt: 1,
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              {q.futsugo}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "var(--text-muted)", mt: 0.5 }}
            >
              {q.zh}
            </Typography>
          </Box>

          {/* Input */}
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="敬語を入力してください…"
            disabled={answered !== null}
            variant="outlined"
            slotProps={{ htmlInput: { lang: "ja" } }}
            sx={inputSx}
          />

          {/* Action button */}
          <Box
            className="mt-4"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            {answered === null ? (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleSkip}
                  sx={{ ...outlineBtn, flex: 1 }}
                >
                  Skip
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  sx={{ ...primaryBtn, flex: 2 }}
                >
                  Submit
                </Button>
              </>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleNext}
                sx={outlineBtn}
              >
                {isLast ? "See Results →" : "Next →"}
              </Button>
            )}
          </Box>

          {/* Feedback */}
          {answered !== null && (
            <Box
              className="mt-5 rounded-xl p-4"
              sx={{
                background: answered ? "var(--success-bg)" : "var(--error-bg)",
                border: `1px solid ${answered ? "var(--success)" : "var(--error)"}`,
              }}
            >
              <Box className="flex items-center gap-2 mb-3">
                {answered ? (
                  <CheckCircleIcon
                    sx={{ color: "var(--success)", fontSize: 22 }}
                  />
                ) : (
                  <CancelIcon sx={{ color: "var(--error)", fontSize: 22 }} />
                )}
                <Typography
                  sx={{
                    color: answered ? "var(--success)" : "var(--error)",
                    fontWeight: 700,
                  }}
                >
                  {answered ? "正解！Correct!" : "不正解 Incorrect"}
                </Typography>
              </Box>

              {!answered && (
                <Box className="mb-3">
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--text-muted)",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Your answer:
                  </Typography>
                  <Typography
                    sx={{
                      color: "var(--error)",
                      background: "#fbd5d1",
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5,
                      display: "inline-block",
                    }}
                  >
                    {input.trim()}
                  </Typography>
                </Box>
              )}

              <Typography
                variant="caption"
                sx={{ color: "var(--text-muted)", display: "block", mb: 1 }}
              >
                Correct answer:
              </Typography>
              <Box
                className="rounded-lg px-3 py-2"
                sx={{
                  background: "var(--accent-soft)",
                  border: "1px solid var(--border)",
                }}
              >
                {q.keigo.map((k, i) => (
                  <Box key={i} sx={{ mb: i < q.keigo.length - 1 ? 1 : 0 }}>
                    <Typography
                      sx={{ color: "var(--foreground)", fontSize: "0.95rem" }}
                    >
                      {k.written}
                    </Typography>
                    {k.read !== k.written && (
                      <Typography
                        sx={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                          mt: 0.5,
                        }}
                      >
                        {k.read}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ color: "var(--text-muted)", mt: 4 }}>
        Press Enter to submit · Enter again for next
      </Typography>
    </Box>
  );
}

// ── ResultsScreen ─────────────────────────────────────────────────────────────

function ResultsScreen({
  records,
  bookmarks,
  onToggleBookmark,
  onRetry,
  onHome,
}: {
  records: QuizRecord[];
  bookmarks: BookmarkMap;
  onToggleBookmark: (idx: number) => void;
  onRetry: () => void;
  onHome: () => void;
}) {
  const correctCount = records.filter((r) => r.correct).length;
  const pct = Math.round((correctCount / records.length) * 100);

  return (
    <Box className="min-h-screen flex flex-col items-center p-4 pt-12">
      <Box className="mb-6 text-center">
        <Typography
          variant="h4"
          sx={{ color: "var(--accent)", fontWeight: 700, letterSpacing: 2 }}
        >
          Results
        </Typography>
        <Typography
          variant="h2"
          sx={{ color: "var(--foreground)", fontWeight: 800, mt: 1 }}
        >
          {correctCount} / {records.length}
        </Typography>
        <Typography variant="body1" sx={{ color: "var(--text-muted)" }}>
          {pct}% correct
        </Typography>
      </Box>

      <Box className="flex gap-3 mb-8">
        <Button
          variant="outlined"
          onClick={onHome}
          sx={{ ...outlineBtn, py: 1 }}
        >
          ← Menu
        </Button>
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{ ...primaryBtn, py: 1 }}
        >
          Try Again
        </Button>
      </Box>

      <Box
        sx={{ width: "100%", maxWidth: 600 }}
        className="flex flex-col gap-3 pb-12"
      >
        {records.map((rec, i) => {
          const lv = (bookmarks[rec.index] ?? 0) as BookmarkLevel;
          return (
            <Card
              key={i}
              sx={{
                ...cardBase,
                borderLeft: `4px solid ${rec.correct ? "var(--success)" : "var(--error)"}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box className="flex items-start gap-2">
                  {rec.correct ? (
                    <CheckCircleIcon
                      sx={{
                        color: "var(--success)",
                        fontSize: 20,
                        mt: 0.3,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <CancelIcon
                      sx={{
                        color: "var(--error)",
                        fontSize: 20,
                        mt: 0.3,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Box className="flex-1 min-w-0">
                    <Typography
                      sx={{ color: "var(--foreground)", fontWeight: 600 }}
                    >
                      {rec.question.futsugo}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--text-muted)", mb: 1 }}
                    >
                      {rec.question.zh}
                    </Typography>

                    {!rec.correct && (
                      <Box className="mb-1">
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "var(--text-muted)" }}
                        >
                          Your answer:{" "}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ color: "var(--error)", fontSize: "0.9rem" }}
                        >
                          {rec.userInput}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: "var(--text-muted)" }}
                      >
                        Correct:{" "}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          color: "var(--success)",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        {rec.question.keigo.map((k, i) => (
                          <span key={i}>
                            {k.written}
                            {k.read !== k.written && ` (${k.read})`}
                            {i < rec.question.keigo.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </Typography>
                    </Box>
                  </Box>
                  <BmBtn
                    level={lv}
                    onToggle={() => onToggleBookmark(rec.index)}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function KeigoQuiz() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [indices, setIndices] = useState<number[]>([]);
  const [records, setRecords] = useState<QuizRecord[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkMap>(() =>
    loadBookmarks(),
  );
  const [bookmarkOrder, setBookmarkOrder] = useState<BookmarkOrderMap>(() =>
    loadBookmarkOrder(),
  );

  const toggleBookmark = useCallback(
    (idx: number) => {
      const lv = (bookmarks[idx] ?? 0) as BookmarkLevel;
      const next = ((lv + 1) % 3) as BookmarkLevel;
      if (lv === 0) {
        setBookmarkOrder((prev) => {
          const updated = { ...prev, [idx]: Date.now() };
          saveBookmarkOrder(updated);
          return updated;
        });
      } else if (next === 0) {
        setBookmarkOrder((prev) => {
          const updated = { ...prev };
          delete updated[idx];
          saveBookmarkOrder(updated);
          return updated;
        });
      }
      setBookmarks((prev) => {
        const updated = { ...prev };
        if (next === 0) delete updated[idx];
        else updated[idx] = next;
        saveBookmarks(updated);
        return updated;
      });
    },
    [bookmarks],
  );

  const toggleBookmarkLevel = useCallback((idx: number) => {
    setBookmarks((prev) => {
      const lv = (prev[idx] ?? 1) as BookmarkLevel;
      const updated = { ...prev, [idx]: (lv === 1 ? 2 : 1) as BookmarkLevel };
      saveBookmarks(updated);
      return updated;
    });
  }, []);

  const deleteBookmark = useCallback((idx: number) => {
    setBookmarks((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      saveBookmarks(updated);
      return updated;
    });
    setBookmarkOrder((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      saveBookmarkOrder(updated);
      return updated;
    });
  }, []);

  if (screen === "landing") {
    return (
      <LandingScreen
        bookmarks={bookmarks}
        onStart={(idxs) => {
          setIndices(idxs);
          setRecords([]);
          setScreen("quiz");
        }}
        onViewBookmarks={() => setScreen("bookmarks")}
      />
    );
  }

  if (screen === "bookmarks") {
    return (
      <BookmarkListScreen
        bookmarks={bookmarks}
        bookmarkOrder={bookmarkOrder}
        onToggleBookmark={toggleBookmarkLevel}
        onDeleteBookmark={deleteBookmark}
        onBack={() => setScreen("landing")}
      />
    );
  }

  if (screen === "quiz") {
    return (
      <QuizScreen
        indices={indices}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        onFinish={(recs) => {
          setRecords(recs);
          setScreen("results");
        }}
        onQuit={() => setScreen("landing")}
      />
    );
  }

  return (
    <ResultsScreen
      records={records}
      bookmarks={bookmarks}
      onToggleBookmark={toggleBookmark}
      onRetry={() => {
        setRecords([]);
        setScreen("quiz");
      }}
      onHome={() => setScreen("landing")}
    />
  );
}
