import { SESSION_ENDPOINT, LOGIN_ENDPOINT, VERIFY_ENDPOINT, LOGOUT_ENDPOINT } from "../config";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type User = {
  sub?: string;
  id?: string;
  name?: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.warn("Failed to parse response JSON", error);
    return null;
  }
}

function extractMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: string }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

function extractUser(source: unknown): User | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const candidate = source as Partial<User> & Record<string, unknown>;
  if (typeof candidate.email === "string") {
    const { email, name, id, sub } = candidate;
    return {
      email,
      name: typeof name === "string" ? name : undefined,
      id: typeof id === "string" ? id : undefined,
      sub: typeof sub === "string" ? sub : undefined
    };
  }

  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(SESSION_ENDPOINT, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const payload = await readJson<unknown>(response);
      const nextUser = extractUser(payload);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      console.warn("Failed to fetch session", error);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshSession();
      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const requestOtp = useCallback(async (email: string) => {
    if (!email) {
      throw new Error("Email is required");
    }

    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const payload = await readJson<{ message?: string }>(response);
      throw new Error(extractMessage(payload, "Failed to send verification code"));
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      if (!email || !otp) {
        throw new Error("Email and OTP are required");
      }

      const response = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const payload = await readJson<{ message?: string }>(response);
        throw new Error(extractMessage(payload, "Invalid verification code"));
      }

      const payload = await readJson<unknown>(response);
      const verifiedUser = extractUser(payload);
      if (verifiedUser) {
        setUser(verifiedUser);
        return;
      }

      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(LOGOUT_ENDPOINT, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.warn("Failed to log out", error);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      requestOtp,
      verifyOtp,
      logout
    }),
    [user, isLoading, requestOtp, verifyOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
