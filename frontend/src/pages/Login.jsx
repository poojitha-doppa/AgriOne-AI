import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { login } = useAuth();
  
  const [form, setForm] = useState({ mobile: "", password: "" });
  const [errors, setErrors] = useState({ mobile: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = { mobile: "", password: "" };

    if (!/^\d{10}$/.test(form.mobile.trim())) {
      nextErrors.mobile = t("error.mobile_required");
    }

    if (!form.password.trim()) {
      nextErrors.password = t("error.password_required");
    } else if (form.password.length < 6) {
      nextErrors.password = t("error.password_min");
    }

    setErrors(nextErrors);
    return !nextErrors.mobile && !nextErrors.password;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(form.mobile, form.password);
      navigate(loggedInUser?.isAdmin ? "/admin" : "/dashboard");
    } catch (error) {
      setErrors({
        mobile: "",
        password: error.message || "Login failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5fff6] to-[#eef7f0] px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white/70 backdrop-blur-lg shadow-md border border-white/50 p-6 md:p-8 hover:shadow-lg transition duration-300">
        <h1 className="font-heading text-3xl font-bold text-foreground">{t("auth.login_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.login_subtitle")}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t("form.password")}</label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/50 px-3 py-3 focus-within:border-primary/50 focus-within:bg-white transition">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full bg-transparent text-sm outline-none"
                placeholder={t("form.password_placeholder")}
              />
            </div>
            {errors.password ? <p className="mt-1 text-xs text-destructive">{errors.password}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3.5 text-base font-semibold text-primary-foreground hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("btn.login")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline hover:text-secondary transition">
            {t("btn.forgot_password")}
          </Link>
          <div className="text-muted-foreground">
            {t("btn.create_account")}? <Link to="/signup" className="text-primary hover:underline hover:text-secondary transition font-medium">
              {t("btn.signup")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
