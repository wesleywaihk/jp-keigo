"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import questions from "@/data/questions.json";

type Question = {
  futsugo: string;
  zh: string;
  keigo: string[];
};

function pickRandom(list: Question[], exclude?: Question): Question {
  const pool = list.length > 1 ? list.filter((q) => q !== exclude) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

type Result = "correct" | "incorrect" | null;

export default function KeigoQuiz() {
  const [current, setCurrent] = useState<Question>(() =>
    pickRandom(questions as Question[])
  );
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [streak, setStreak] = useState(0);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || result !== null) return;
    const trimmed = input.trim();
    const correct = current.keigo.some((k) => k === trimmed);
    setResult(correct ? "correct" : "incorrect");
    if (correct) setStreak((s) => s + 1);
    else setStreak(0);
  }, [input, result, current]);

  const handleNext = useCallback(() => {
    setCurrent((prev) => pickRandom(questions as Question[], prev));
    setInput("");
    setResult(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (result === null) handleSubmit();
      else handleNext();
    }
  };

  const isCorrect = result === "correct";

  return (
    <Box
      className="min-h-screen flex flex-col items-center justify-center p-4"
      sx={{ background: "var(--background)" }}
    >
      {/* Header */}
      <Box className="mb-8 text-center">
        <Typography
          variant="h4"
          sx={{ color: "var(--accent)", letterSpacing: 2, fontWeight: 700 }}
        >
          敬語練習
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--text-muted)", mt: 0.5 }}>
          Keigo Practice
        </Typography>
        {streak > 0 && (
          <Chip
            label={`🔥 ${streak} streak`}
            size="small"
            sx={{
              mt: 1,
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Question Card */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 560,
          background: "var(--card)",
          borderRadius: 3,
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px rgba(46,125,82,0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Prompt */}
          <Box className="mb-6">
            <Typography
              variant="overline"
              sx={{ color: "var(--text-muted)", letterSpacing: 2 }}
            >
              普通語 → 敬語に変えてください
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "var(--foreground)", mt: 1, lineHeight: 1.6, fontWeight: 600 }}
            >
              {current.futsugo}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "var(--text-muted)", mt: 0.5 }}
            >
              {current.zh}
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
            disabled={result !== null}
            variant="outlined"
            slotProps={{ htmlInput: { lang: "ja" } }}
            sx={{
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
            }}
          />

          {/* Action buttons */}
          <Box className="mt-4 flex gap-3">
            {result === null ? (
              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={!input.trim()}
                sx={{
                  background: "var(--accent)",
                  "&:hover": { background: "var(--accent-hover)" },
                  "&.Mui-disabled": { background: "var(--border)", color: "var(--text-muted)" },
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: "none",
                }}
              >
                Submit
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleNext}
                sx={{
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                  "&:hover": {
                    background: "var(--accent-soft)",
                    borderColor: "var(--accent-hover)",
                  },
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                }}
              >
                Next question →
              </Button>
            )}
          </Box>

          {/* Result */}
          {result !== null && (
            <Box
              className="mt-5 rounded-xl p-4"
              sx={{
                background: isCorrect ? "var(--success-bg)" : "var(--error-bg)",
                border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}`,
              }}
            >
              {/* Verdict */}
              <Box className="flex items-center gap-2 mb-3">
                {isCorrect ? (
                  <CheckCircleIcon sx={{ color: "var(--success)", fontSize: 22 }} />
                ) : (
                  <CancelIcon sx={{ color: "var(--error)", fontSize: 22 }} />
                )}
                <Typography
                  sx={{ color: isCorrect ? "var(--success)" : "var(--error)", fontWeight: 700 }}
                >
                  {isCorrect ? "正解！Correct!" : "不正解 Incorrect"}
                </Typography>
              </Box>

              {/* Your answer (when wrong) */}
              {!isCorrect && (
                <Box className="mb-3">
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--text-muted)", display: "block", mb: 0.5 }}
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

              {/* All valid answers */}
              <Typography
                variant="caption"
                sx={{ color: "var(--text-muted)", display: "block", mb: 1 }}
              >
                {current.keigo.length === 1 ? "Correct answer:" : "All accepted answers:"}
              </Typography>
              <Box className="flex flex-col gap-2">
                {current.keigo.map((k, i) => (
                  <Box
                    key={i}
                    className="rounded-lg px-3 py-2"
                    sx={{
                      background: "var(--accent-soft)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--accent)", fontWeight: 700, minWidth: 20 }}
                    >
                      {i + 1}.
                    </Typography>
                    <Typography sx={{ color: "var(--foreground)", fontSize: "0.95rem" }}>
                      {k}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ color: "var(--text-muted)", mt: 4 }}>
        Press Enter to submit · Enter again for next question
      </Typography>
    </Box>
  );
}
