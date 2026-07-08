"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container, Box, Typography, Paper, Stack, TextField, Button, Alert, Link as MuiLink } from "@mui/material";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ההרשמה נכשלה");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("משהו השתבש. נסו שוב.");
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ pb: 8 }}>
      <Box sx={{ py: 7 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>חשבון</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>יצירת חשבון</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          חשבונות חדשים יכולים לצפות בהכל. בקשו ממנהל הליגה לשדרג אתכם אם אתם צריכים לנהל משחקים.
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              inputProps={{ minLength: 3 }}
              fullWidth
            />
            <TextField
              label="סיסמה"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              inputProps={{ minLength: 8 }}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} size="large">
              {loading ? "יוצר…" : "הרשמה"}
            </Button>
            <Typography variant="body2" color="text.secondary">
              כבר יש לך חשבון?{" "}
              <MuiLink href="/login" color="primary.main">התחברות</MuiLink>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
