import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Lock, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [step, setStep] = useState(1); // 1: mobile, 2: otp, 3: new password
  const [form, setForm] = useState({ mobile: "", otp: "", newPassword: "" });
  const [errors, setErrors] = useState({ mobile: "", otp: "", newPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Generate and store OTP on mobile submit
  const handleSendOTP = (e) => {
    e.preventDefault();
    const nextErrors = { mobile: "", otp: "", newPassword: "" };

    if (!/^\d{10}$/.test(form.mobile.trim())) {
      nextErrors.mobile = t("error.mobile_required");
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Generate 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOTP(otp);
      localStorage.setItem(`agrimitra-otp-${form.mobile}`, otp);
      
      // Demo: log OTP to console
      console.log(
        `%c📧 DEMO OTP for ${form.mobile}: ${otp}`,
        "color: #16a34a; font-weight: bold; font-size: 14px;"
      );

      setOtpSent(true);
      setStep(2);
      setErrors({ mobile: "", otp: "", newPassword: "" });
      setIsSubmitting(false);
    }, 500);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const nextErrors = { mobile: "", otp: "", newPassword: "" };

    if (!/^\d{4,6}$/.test(form.otp.trim())) {
      nextErrors.otp = t("error.otp_required");
      setErrors(nextErrors);
      return;
    }

    // Check OTP
    const storedOTP = localStorage.getItem(`agrimitra-otp-${form.mobile}`);
    if (form.otp !== storedOTP) {
      nextErrors.otp = "Invalid OTP. Check browser console for demo OTP.";
      setErrors(nextErrors);
      return;
    }

    setStep(3);
    setErrors({ mobile: "", otp: "", newPassword: "" });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    const nextErrors = { mobile: "", otp: "", newPassword: "" };

    if (!form.newPassword.trim()) {
      nextErrors.newPassword = t("error.password_required");
    } else if (form.newPassword.length < 6) {
      nextErrors.newPassword = t("error.password_min");
    }

    if (nextErrors.newPassword) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Update password in localStorage
      localStorage.setItem(`agrimitra-pwd-${form.mobile}`, form.newPassword);
      localStorage.removeItem(`agrimitra-otp-${form.mobile}`);
      
      console.log(`%c✓ Password reset successfully!`, "color: #16a34a; font-weight: bold;");
      navigate("/login");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5fff6] to-[#eef7f0] px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white/70 backdrop-blur-lg shadow-md border border-white/50 p-6 md:p-8 hover:shadow-lg transition duration-300">
        <h1 className="font-heading text-3xl font-bold text-foreground">{t("auth.forgot_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.forgot_subtitle")}</p>

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step 1: Mobile */}
        {step === 1 && (
          <form className="mt-6 space-y-4" onSubmit={handleSendOTP}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t("form.mobile")}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/50 px-3 py-3 focus-within:border-primary/50 focus-within:bg-white transition">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder={t("form.mobile_placeholder")}
                />
              </div>
              {errors.mobile ? <p className="mt-1 text-xs text-destructive">{errors.mobile}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3.5 text-base font-semibold text-primary-foreground hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("btn.send_otp")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form className="mt-6 space-y-4" onSubmit={handleVerifyOTP}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t("form.otp")}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/50 px-3 py-3 focus-within:border-primary/50 focus-within:bg-white transition">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.otp}
                  onChange={(e) => setForm((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, "") }))}
                  className="w-full bg-transparent text-sm outline-none tracking-widest"
                  placeholder={t("form.otp_placeholder")}
                />
              </div>
              {errors.otp ? <p className="mt-1 text-xs text-destructive">{errors.otp}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                💡 Demo: Check browser console (F12) for OTP
              </p>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3.5 text-base font-semibold text-primary-foreground hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition duration-300"
            >
              Verify OTP
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t("form.new_password")}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/50 px-3 py-3 focus-within:border-primary/50 focus-within:bg-white transition">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder={t("form.new_password_placeholder")}
                />
              </div>
              {errors.newPassword ? <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3.5 text-base font-semibold text-primary-foreground hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("form.new_password")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          {t("btn.back_to_login")} <Link to="/login" className="text-primary hover:underline hover:text-secondary transition font-medium">{t("btn.login")}</Link>
        </p>
      </div>
    </div>
  );
}
