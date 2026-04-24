"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import questions from "@/data/questions.json";

type Question = {
  futsugo: string;
  zh: string;
  keigo: { written: string; read: string }[];
};

const ALL = questions as Question[];
const PAGE_SIZE = 10;

const cardBase = {
  width: "100%",
  background: "var(--card)",
  borderRadius: 3,
  border: "1px solid var(--border)",
  boxShadow: "0 4px 24px rgba(46,125,82,0.1)",
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
  fontWeight: 600,
  fontSize: "1rem",
  textTransform: "none" as const,
};

export default function QuestionsPage() {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(ALL.length / PAGE_SIZE);
  const pageItems = ALL.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const startNum = page * PAGE_SIZE + 1;

  return (
    <Box className="min-h-screen flex flex-col items-center p-4 pt-10">
      <Box className="w-full mb-6" sx={{ maxWidth: 600 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Button
            size="small"
            sx={{
              color: "var(--text-muted)",
              textTransform: "none",
              mb: 2,
              p: 0,
            }}
          >
            ← Back
          </Button>
        </Link>
        <Box className="flex items-baseline justify-between">
          <Typography
            variant="h5"
            sx={{ color: "var(--accent)", fontWeight: 700 }}
          >
            All Questions
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-muted)" }}>
            {ALL.length} total
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", maxWidth: 600 }} className="flex flex-col gap-3">
        {pageItems.map((q, i) => (
          <Card key={startNum + i} sx={cardBase}>
            <CardContent sx={{ p: 3 }}>
              <Box className="flex items-start gap-3">
                <Typography
                  sx={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    minWidth: 28,
                    mt: 0.25,
                  }}
                >
                  {startNum + i}
                </Typography>
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
                  <Divider sx={{ borderColor: "var(--border)", mb: 1.5 }} />
                  <Box className="flex flex-col gap-2">
                    {q.keigo.map((k, ki) => (
                      <Box
                        key={ki}
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
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex items-center gap-3 mt-6 mb-12">
        <Button
          variant="outlined"
          size="small"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          sx={{ ...outlineBtn, py: 0.5, minWidth: 80 }}
        >
          ← Prev
        </Button>
        <Typography variant="body2" sx={{ color: "var(--text-muted)" }}>
          {page + 1} / {totalPages}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          sx={{ ...outlineBtn, py: 0.5, minWidth: 80 }}
        >
          Next →
        </Button>
      </Box>
    </Box>
  );
}
