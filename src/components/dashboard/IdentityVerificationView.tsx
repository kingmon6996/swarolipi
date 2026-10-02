import { useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck,
  FileText,
  Globe,
  IdCard,
  Image as ImageIcon,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { formatAddress } from "@/components/WalletStatus";
import { Link } from "@tanstack/react-router";

export interface DocumentConfig {
  id: string;
  name: string;
  description: string;
  requiresBack: boolean;
  icon: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  documents: DocumentConfig[];
}

export const COUNTRY_CONFIGS: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    documents: [
      { id: "pan", name: "PAN Card", description: "Permanent Account Number card", requiresBack: false, icon: "🪪" },
      { id: "aadhaar", name: "Aadhaar Card", description: "Government issued UID identity card", requiresBack: true, icon: "🆔" },
      { id: "passport", name: "Indian Passport", description: "Republic of India official passport", requiresBack: false, icon: "📘" },
    ],
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    documents: [
      { id: "us_dl", name: "Driver's License", description: "State-issued driver license", requiresBack: true, icon: "🪪" },
      { id: "us_passport", name: "US Passport", description: "United States passport book", requiresBack: false, icon: "📘" },
      { id: "us_state_id", name: "State Identification Card", description: "Official state-issued photo ID", requiresBack: true, icon: "🆔" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    documents: [
      { id: "uk_passport", name: "UK Passport", description: "British citizen passport", requiresBack: false, icon: "📘" },
      { id: "uk_dl", name: "Driving Licence", description: "UK photocard driving licence", requiresBack: true, icon: "🪪" },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    documents: [
      { id: "de_id", name: "Personalausweis", description: "German national identity card", requiresBack: true, icon: "🪪" },
      { id: "de_passport", name: "Reisepass", description: "German passport", requiresBack: false, icon: "📘" },
    ],
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    documents: [
      { id: "fr_id", name: "Carte Nationale d'Identité", description: "French national identity card", requiresBack: true, icon: "🪪" },
      { id: "fr_passport", name: "Passeport Français", description: "French Republic passport", requiresBack: false, icon: "📘" },
    ],
  },
  {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    documents: [
      { id: "jp_mynumber", name: "My Number Card", description: "Japanese Individual Number Card", requiresBack: true, icon: "🪪" },
      { id: "jp_passport", name: "Japanese Passport", description: "Official Japanese passport", requiresBack: false, icon: "📘" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    documents: [
      { id: "au_dl", name: "Driver Licence", description: "Australian state driver licence", requiresBack: true, icon: "🪪" },
      { id: "au_passport", name: "Australian Passport", description: "Official Australian passport", requiresBack: false, icon: "📘" },
    ],
  },
];

type Step = "select_country" | "select_document" | "upload" | "processing" | "result";

export function IdentityVerificationView() {
  const { walletAddress } = useWallet();
  const { identityVerified, identityCountry, identityDocumentType, completeIdentityVerification } = useProfile();

  const [step, setStep] = useState<Step>(identityVerified ? "result" : "select_country");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRY_CONFIGS[0]!);
  const [selectedDocument, setSelectedDocument] = useState<DocumentConfig | null>(null);

  // Uploaded Files
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  // Processing pipeline
  const [pipelineIndex, setPipelineIndex] = useState(0);

  const filteredCountries = COUNTRY_CONFIGS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (c: CountryConfig) => {
    setSelectedCountry(c);
    setSelectedDocument(null);
    setStep("select_document");
  };

  const handleDocumentSelect = (doc: DocumentConfig) => {
    setSelectedDocument(doc);
    setStep("upload");
  };

  const handleFrontUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFrontPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBackUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitUpload = () => {
    if (!frontFile || (selectedDocument?.requiresBack && !backFile)) return;

    setStep("processing");
    setPipelineIndex(0);

    const steps = [0, 1, 2, 3];
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        setPipelineIndex(idx);
      } else {
        clearInterval(interval);
        if (selectedDocument) {
          completeIdentityVerification(selectedCountry.name, selectedDocument.name);
        }
        setStep("result");
      }
    }, 1200);
  };

  const pipelineItems = [
    "Uploading Document",
    "Processing Document",
    "Checking Identity",
    "Verification Complete",
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-bold text-primary">
            <FileCheck className="size-3.5" /> Government Document Layer
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Verify Your Identity
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Confirm your identity using a government-issued document accepted in your country.
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ================= STEP 1: COUNTRY SELECTION ================= */}
        {step === "select_country" && (
          <motion.div
            key="select_country"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h3 className="font-display text-xl font-extrabold text-foreground">Select your country</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                We will display the accepted government documents available for your jurisdiction.
              </p>

              {/* Search Bar */}
              <div className="relative mt-5">
                <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country..."
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Country Selection Grid */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCountries.map((country) => (
                  <motion.button
                    key={country.code}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCountrySelect(country)}
                    className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{country.name}</p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        {country.documents.length} accepted documents
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: DOCUMENT SELECTION ================= */}
        {step === "select_document" && (
          <motion.div
            key="select_document"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-primary">
                    {selectedCountry.flag} {selectedCountry.name}
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-foreground">Choose your document</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepted government documents for {selectedCountry.name}.
                  </p>
                </div>
                <Button variant="voxauthOutline" size="sm" onClick={() => setStep("select_country")}>
                  Change Country
                </Button>
              </div>

              {/* Document Cards */}
              <div className="mt-6 space-y-3">
                {selectedCountry.documents.map((doc) => (
                  <motion.button
                    key={doc.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleDocumentSelect(doc)}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="grid size-12 place-items-center rounded-xl bg-accent text-2xl">
                      {doc.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </div>
                    <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-[0.65rem] font-bold text-purple-300">
                      Supported
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: DOCUMENT UPLOAD ================= */}
        {step === "upload" && selectedDocument && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-primary">
                    {selectedCountry.flag} {selectedCountry.name} • {selectedDocument.name}
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-foreground">Upload your document</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload a high-quality scan or photo of your {selectedDocument.name} (JPG, PNG, PDF max 10MB).
                  </p>
                </div>
                <Button variant="voxauthOutline" size="sm" onClick={() => setStep("select_document")}>
                  Back
                </Button>
              </div>

              {/* Upload Dropzones Grid */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Front Side Upload */}
                <div className="rounded-xl border-2 border-dashed border-border bg-background p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">Front of document</p>

                  {frontPreview ? (
                    <div className="mt-4 relative overflow-hidden rounded-lg border border-border bg-card">
                      <img src={frontPreview} alt="Document Front" className="h-40 w-full object-cover" />
                      <button
                        onClick={() => { setFrontFile(null); setFrontPreview(null); }}
                        className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="front-upload" className="mt-4 block cursor-pointer py-6">
                      <UploadCloud className="mx-auto size-10 text-muted-foreground" />
                      <p className="mt-2 text-xs font-bold text-primary">Click or drop front photo</p>
                      <p className="text-[0.68rem] text-muted-foreground">JPG, PNG, PDF</p>
                      <input
                        id="front-upload"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFrontUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Back Side Upload (if required) */}
                {selectedDocument.requiresBack && (
                  <div className="rounded-xl border-2 border-dashed border-border bg-background p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">Back of document</p>

                    {backPreview ? (
                      <div className="mt-4 relative overflow-hidden rounded-lg border border-border bg-card">
                        <img src={backPreview} alt="Document Back" className="h-40 w-full object-cover" />
                        <button
                          onClick={() => { setBackFile(null); setBackPreview(null); }}
                          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="back-upload" className="mt-4 block cursor-pointer py-6">
                        <UploadCloud className="mx-auto size-10 text-muted-foreground" />
                        <p className="mt-2 text-xs font-bold text-primary">Click or drop back photo</p>
                        <p className="text-[0.68rem] text-muted-foreground">JPG, PNG, PDF</p>
                        <input
                          id="back-upload"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleBackUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Explicit Privacy Notice */}
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-500/15 bg-purple-950/20 p-4 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-bold text-foreground">Privacy Notice</p>
                  <p className="mt-0.5 leading-relaxed">
                    Your document is used only for identity verification. VoxAuth does not expose your government ID information to third-party applications through the authorization layer.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="mt-8 flex justify-end">
                <Button
                  variant="voxauth"
                  disabled={!frontFile || (selectedDocument.requiresBack && !backFile)}
                  onClick={handleSubmitUpload}
                  className="gap-2 px-8 py-6 text-base"
                >
                  Submit for Verification <ArrowRight className="size-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 4: PROCESSING PIPELINE ================= */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-purple-500/25 bg-card/60 backdrop-blur-xl p-8 text-center shadow-[0_0_35px_rgba(139,92,246,0.2)] sm:p-12"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 shadow-sm">
              <Loader2 className="size-8 animate-spin" />
            </div>

            <h3 className="mt-6 font-display text-2xl font-extrabold text-foreground">
              Processing Document Identity...
            </h3>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Validating document authenticity and verifying identity credentials.
            </p>

            <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {pipelineItems.map((item, idx) => {
                const isDone = idx < pipelineIndex;
                const isCurrent = idx === pipelineIndex;
                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold transition-all ${isDone
                      ? "border-purple-500/30 bg-purple-950/20 text-purple-200"
                      : isCurrent
                        ? "border-primary/40 bg-accent text-primary"
                        : "border-border/60 bg-background/50 text-muted-foreground opacity-60"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      {isDone ? (
                        <Check className="size-4 text-violet-400" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <span className="size-2 rounded-full bg-border" />
                      )}
                      {item}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase">
                      {isDone ? "COMPLETE" : isCurrent ? "PROCESSING" : "WAITING"}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 5: RESULT SCREEN ================= */}
        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-purple-500/35 bg-card/60 backdrop-blur-xl p-8 text-center shadow-[0_0_40px_rgba(139,92,246,0.25)] sm:p-12"
          >
            <div className="relative mx-auto grid size-20 place-items-center rounded-3xl border border-purple-500/30 bg-purple-950/40 text-purple-300 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <ShieldCheck className="size-10" />
              <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-violet-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.6)]">
                <Check className="size-4 stroke-[3]" />
              </span>
            </div>

            <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              IDENTITY VERIFIED
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Your government identity document has been verified for this wallet.
            </p>

            {/* Summary Card */}
            <div className="mx-auto mt-8 max-w-md rounded-xl border border-purple-500/20 bg-background/80 p-5 text-left text-xs space-y-3">
              <div className="flex justify-between py-1 border-b border-purple-500/15">
                <span className="text-muted-foreground">Identity Verification</span>
                <span className="font-bold text-purple-300 flex items-center gap-1">
                  <Check className="size-3.5 text-violet-400" /> Verified
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/15">
                <span className="text-muted-foreground">Country</span>
                <span className="font-bold text-foreground">{identityCountry || selectedCountry.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/15">
                <span className="text-muted-foreground">Document Type</span>
                <span className="font-bold text-foreground">{identityDocumentType || selectedDocument?.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Status</span>
                <span className="font-bold text-purple-300">VERIFIED</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Link to="/verify">
                <Button variant="voxauth" className="gap-2 px-8 py-6 text-base">
                  Continue to Verification Center <ArrowRight className="size-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
