import {
  Bell,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Globe,
  Mail,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Send,
  Ticket,
  Users,
} from "lucide-react";
import { FlowDiagram, type FlowStep } from "@/components/admin/FlowDiagram";
import { ArchitectureDiagram } from "@/components/admin/ArchitectureDiagram";

const iconClass = "h-5 w-5";

const ONBOARDING_STEPS: FlowStep[] = [
  {
    title: "Customer submits the intake form",
    detail:
      "Public form on the site — bike details, service needed, photos. Submits straight into the database.",
    status: "live",
    icon: <FileText className={iconClass} />,
  },
  {
    title: "...or texts the shop directly",
    detail:
      "No inbound-SMS integration yet. A text today just lands in the owner's personal messages, not the CRM.",
    status: "proposed",
    icon: <MessageSquare className={iconClass} />,
  },
  {
    title: "Owner is notified instantly",
    detail:
      "Email fires immediately (Resend). SMS notification code is fully built, just paused until Twilio's business registration is approved — one setting flips it back on.",
    status: "paused",
    icon: <Bell className={iconClass} />,
  },
  {
    title: "Owner reviews & approves in the dashboard",
    detail: "The owner opens the admin, reviews the request, and sets a drop-off time. This creates the official Job.",
    status: "live",
    icon: <CheckCircle className={iconClass} />,
  },
  {
    title: "Customer gets confirmation with the address",
    detail:
      "Email confirmation sends automatically on approval. SMS confirmation is built, same Twilio pause as above.",
    status: "paused",
    icon: <Mail className={iconClass} />,
  },
  {
    title: "Reminder sent the day before drop-off",
    detail: "Not built yet — needs a scheduled daily check for upcoming drop-offs to text/email a reminder.",
    status: "proposed",
    icon: <Clock className={iconClass} />,
  },
  {
    title: "CRM ticket is created automatically",
    detail:
      "Every form submission matches or creates a customer record and opens a ticket — built tonight, running now.",
    status: "live",
    icon: <Ticket className={iconClass} />,
  },
  {
    title: "...or a ticket is created via Telegram",
    detail: "Not built yet. Would need a small Telegram bot so the owner can log a walk-in or phone call by texting a bot.",
    status: "proposed",
    icon: <Send className={iconClass} />,
  },
  {
    title: "Job marked complete → customer notified",
    detail:
      "The Kanban board already tracks a job to \"Complete\" — it doesn't yet trigger an automatic customer notification.",
    status: "proposed",
    icon: <PartyPopper className={iconClass} />,
  },
  {
    title: "Ticket & customer record updated",
    detail: "Status and history update any time the owner touches a job. A full record lives in the CRM.",
    status: "live",
    icon: <Users className={iconClass} />,
  },
];

const ARCHITECTURE_ZONES = [
  {
    title: "Website & Hosting",
    icon: <Globe className="h-4 w-4" />,
    services: [
      {
        name: "Next.js site (Vercel)",
        detail: "The public site + this admin dashboard — deploys automatically on every push.",
        status: "live" as const,
      },
      {
        name: "GitHub",
        detail: "Source code and full deployment history — every change is tracked and reversible.",
        status: "live" as const,
      },
      {
        name: "Domain (GoDaddy DNS)",
        detail: "swaffordspeed.com points to Vercel via DNS records.",
        status: "live" as const,
      },
    ],
  },
  {
    title: "Data & Backend",
    icon: <Database className="h-4 w-4" />,
    services: [
      {
        name: "Neon Postgres",
        detail: "The database — every request, customer, job, and ticket lives here.",
        status: "live" as const,
      },
    ],
  },
  {
    title: "Customer Notifications",
    icon: <Bell className="h-4 w-4" />,
    services: [
      {
        name: "Resend (email)",
        detail: "Sends every email — owner alerts, customer confirmations, replies.",
        status: "live" as const,
      },
      {
        name: "Twilio (SMS)",
        detail: "Phone number purchased and registered — paused on carrier approval, not cost or code.",
        status: "paused" as const,
      },
    ],
  },
  {
    title: "Marketing & Local Presence",
    icon: <Megaphone className="h-4 w-4" />,
    services: [
      {
        name: "Google Business Profile",
        detail:
          "Free local listing — shows up on Google Maps/Search, collects reviews. Single biggest lever for \"near me\" searches.",
        status: "proposed" as const,
      },
      {
        name: "Google Workspace",
        detail: "A professional @swaffordspeed.com email/calendar instead of a personal address.",
        status: "proposed" as const,
      },
      {
        name: "Google Ads",
        detail: "Paid search targeting the exact keyword patterns from tonight's SEO research.",
        status: "proposed" as const,
      },
    ],
  },
];

export default function PresentationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Digital Rollout Plan</h1>
      <p className="mt-1 text-sm text-muted">
        Working diagrams for walking the owner through what&apos;s live, what&apos;s built-but-paused, and
        what&apos;s proposed next.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">1. Customer onboarding lifecycle</h2>
        <p className="mt-1 text-sm text-muted">
          Green = live today. Amber = fully built, paused on Twilio approval. Gray dashed = proposed, not built.
        </p>
        <div className="mt-6">
          <FlowDiagram steps={ONBOARDING_STEPS} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-semibold">2. The full digital experience</h2>
        <p className="mt-1 text-sm text-muted">
          Every service behind the site today, plus the marketing layer that isn&apos;t wired up yet.
        </p>
        <div className="mt-6">
          <ArchitectureDiagram zones={ARCHITECTURE_ZONES} />
        </div>
      </section>
    </div>
  );
}
