import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, Loader2, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SchemeFinder() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    state: "Andhra Pradesh",
    landHectares: "",
    landUnit: "hectares",
    annualIncome: "",
    hasAadhaar: "yes",
    hasBankAccount: "yes",
  });

  const parseNumber = (raw: string) => {
    const normalized = raw.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const submit = () => {
    setError("");

    if (!form.landHectares) {
      setError(t("schemes.land_required"));
      return;
    }

    if (!form.annualIncome) {
      setError(t("schemes.income_required"));
      return;
    }

    const landValue = parseNumber(form.landHectares);
    const incomeValue = parseNumber(form.annualIncome);

    if (landValue == null || landValue <= 0) {
      setError(t("schemes.land_required"));
      return;
    }

    if (incomeValue == null || incomeValue < 0) {
      setError(t("schemes.income_required"));
      return;
    }

    const profileData = {
      state: form.state,
      annualIncome: incomeValue,
      isIndianResident: true,
      farmerType: "landowner",
      hasCropCultivation: true,
      hasCropInsuranceNeed: false,
      needsIrrigation: false,
      hasAadhaar: form.hasAadhaar === "yes",
      hasBankAccount: form.hasBankAccount === "yes",
      hasLandProof: true,
      isRegisteredCultivator: true,
      hasEnrolledBeforeSeason: false,
      enteredAnnualIncome: form.annualIncome,
      ...(form.landUnit === "acres"
        ? { landAcres: landValue }
        : form.landUnit === "cents"
          ? { landAcres: landValue / 100 }
        : { landHectares: landValue }),
    };

    setLoading(true);
    navigate("/scheme-results", { state: { profileData } });
  };

  const states = [
    { value: "Andhra Pradesh", label: lang === "te" ? "ఆంధ్ర ప్రదేశ్" : "Andhra Pradesh" },
    { value: "Telangana", label: lang === "te" ? "తెలంగాణ" : "Telangana" },
    { value: "Karnataka", label: lang === "te" ? "కర్ణాటక" : "Karnataka" },
    { value: "Tamil Nadu", label: lang === "te" ? "తమిళనాడు" : "Tamil Nadu" },
    { value: "Maharashtra", label: lang === "te" ? "మహారాష్ట్ర" : "Maharashtra" },
    { value: "Other", label: lang === "te" ? "ఇతర" : "Other" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto min-w-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-4"
      >
        <div className="space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            {t("schemes.title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("schemes.subtitle")}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-md shadow-lg p-4 sm:p-8 space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            {t("schemes.profile")}
          </h2>

          {/* Question 1: State */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-base font-medium text-foreground">
              1. {t("schemes.state")}
            </label>
            <select
              value={form.state}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, state: e.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-background px-5 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            >
              {states.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Question 2: Land Size */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-base font-medium text-foreground">
              2. {t("schemes.land")}
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.landHectares}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, landHectares: e.target.value }))
              }
              placeholder={t("schemes.land_example")}
              className="w-full rounded-2xl border border-border bg-background px-5 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
              <select
                value={form.landUnit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, landUnit: e.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              >
                <option value="hectares">{t("schemes.unit_hectares")}</option>
                <option value="acres">{t("schemes.unit_acres")}</option>
                <option value="cents">{t("schemes.unit_cents")}</option>
              </select>
            </div>
          </motion.div>

          {/* Question 3: Annual Income */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <label className="text-base font-medium text-foreground">
              3. {t("schemes.income")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.annualIncome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, annualIncome: e.target.value }))
              }
              placeholder={t("schemes.income_example")}
              className="w-full rounded-2xl border border-border bg-background px-5 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </motion.div>

          {/* Question 4: Aadhaar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <label className="text-base font-medium text-foreground">
              4. {t("schemes.aadhaar")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="aadhaar"
                  value="yes"
                  checked={form.hasAadhaar === "yes"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hasAadhaar: e.target.value }))
                  }
                  className="w-5 h-5 text-primary"
                />
                <span className="text-foreground">{t("common.yes")}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="aadhaar"
                  value="no"
                  checked={form.hasAadhaar === "no"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hasAadhaar: e.target.value }))
                  }
                  className="w-5 h-5 text-primary"
                />
                <span className="text-foreground">{t("common.no")}</span>
              </label>
            </div>
          </motion.div>

          {/* Question 5: Bank Account */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <label className="text-base font-medium text-foreground">
              5. {t("schemes.bank")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="bank"
                  value="yes"
                  checked={form.hasBankAccount === "yes"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      hasBankAccount: e.target.value,
                    }))
                  }
                  className="w-5 h-5 text-primary"
                />
                <span className="text-foreground">{t("common.yes")}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="bank"
                  value="no"
                  checked={form.hasBankAccount === "no"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      hasBankAccount: e.target.value,
                    }))
                  }
                  className="w-5 h-5 text-primary"
                />
                <span className="text-foreground">{t("common.no")}</span>
              </label>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
            >
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={submit}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sprout className="h-5 w-5" />
            )}
            {t("schemes.check")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
