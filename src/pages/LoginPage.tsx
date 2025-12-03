import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type LoginFormValues = {
  email: string;
  otp: string;
};

type Phase = "collect-email" | "verify-otp";

export function LoginPage() {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, user, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    resetField,
    formState: { errors }
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      otp: ""
    }
  });
  const [phase, setPhase] = useState<Phase>("verify-otp");
  const [pendingEmail, setPendingEmail] = useState("dennawequouye-9209@yopmail.com");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/chat", { replace: true });
    }
  }, [isLoading, navigate, user]);

  useEffect(() => {
    if (phase === "verify-otp") {
      setValue("email", pendingEmail);
      setFocus("otp");
    }
  }, [phase, pendingEmail, setFocus, setValue]);

  const onRequestOtp = handleSubmit(async ({ email }) => {
    setSubmitError(null);
    setInfoMessage(null);
    setIsRequestingOtp(true);
    try {
      await requestOtp(email);
      setPendingEmail(email);
      setPhase("verify-otp");
      setInfoMessage(`We sent a verification code to ${email}. Enter it below to continue.`);
      resetField("otp", { keepDirty: false, keepTouched: false });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setIsRequestingOtp(false);
    }
  });

  const onVerifyOtp = handleSubmit(async ({ email, otp }) => {
    const targetEmail = pendingEmail || email;
    setSubmitError(null);
    setIsVerifyingOtp(true);
    try {
      await verifyOtp(targetEmail, otp);
      navigate("/chat", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Verification failed");
      setPhase("verify-otp");
      setPendingEmail(targetEmail);
      setValue("email", targetEmail, { shouldDirty: false, shouldValidate: false });
      setFocus("otp");
    } finally {
      setIsVerifyingOtp(false);
    }
  });

  const handleResend = async () => {
    if (!pendingEmail) {
      return;
    }
    setSubmitError(null);
    setInfoMessage(null);
    setIsRequestingOtp(true);
    try {
      await requestOtp(pendingEmail);
      setInfoMessage(`We resent the verification code to ${pendingEmail}.`);
      resetField("otp", { keepDirty: false, keepTouched: false });
      setFocus("otp");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to resend verification code");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleEditEmail = () => {
    setPhase("collect-email");
    setInfoMessage(null);
    setSubmitError(null);
    setPendingEmail("");
    resetField("otp", { keepDirty: false, keepTouched: false });
    setFocus("email");
  };

  const isSubmitting = phase === "collect-email" ? isRequestingOtp : isVerifyingOtp;
  const onSubmit = phase === "collect-email" ? onRequestOtp : onVerifyOtp;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 px-6 py-16 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in with the one-time passcode sent to your email address.
          </p>
        </header>

        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-700/40"
              disabled={phase === "verify-otp"}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /.+@.+\..+/,
                  message: "Enter a valid email"
                }
              })}
            />
            {errors.email ? (
              <small className="text-xs font-medium text-rose-500">{errors.email.message}</small>
            ) : null}
            {phase === "verify-otp" ? (
              <button
                type="button"
                className="self-start text-xs font-semibold text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                onClick={handleEditEmail}
              >
                Use a different email
              </button>
            ) : null}
          </label>

          {phase === "verify-otp" ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">One-time passcode</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter the 6-digit code"
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm tracking-[0.4em] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-700/40"
                {...register("otp", {
                  validate: (value) => {
                    if (phase !== "verify-otp") {
                      return true;
                    }
                    if (!value || value.trim().length === 0) {
                      return "Enter the verification code";
                    }
                    if (!/^\d{6}$/.test(value.trim())) {
                      return "Enter the 6-digit code";
                    }
                    return true;
                  }
                })}
              />
              {errors.otp ? (
                <small className="text-xs font-medium text-rose-500">{errors.otp.message}</small>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  The code expires quickly. Use the latest one you received.
                </span>
              )}
            </label>
          ) : null}

          {infoMessage ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
              {infoMessage}
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 dark:from-sky-500 dark:via-sky-600 dark:to-sky-700"
            disabled={isSubmitting}
          >
            {phase === "collect-email"
              ? isSubmitting
                ? "Sending code..."
                : "Send verification code"
              : isSubmitting
                ? "Verifying..."
                : "Verify & Sign in"}
          </button>

          {phase === "verify-otp" ? (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Didn&apos;t get the code?</span>
              <button
                type="button"
                className="font-semibold text-sky-600 transition hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-400 dark:hover:text-sky-300"
                onClick={handleResend}
                disabled={isRequestingOtp}
              >
                Resend code
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
