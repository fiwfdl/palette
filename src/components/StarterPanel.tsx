import { motion, useReducedMotion } from "motion/react";
import { Blocks, Gauge, ShieldCheck, type LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Blocks,
    title: "Composable sections",
    body: "Drop in the header, footer, and Radix primitives, then compose pages from token-styled blocks.",
  },
  {
    icon: Gauge,
    title: "Static by default",
    body: "Astro ships zero JavaScript except the islands you opt into, so the first paint stays fast.",
  },
  {
    icon: ShieldCheck,
    title: "Accessible primitives",
    body: "Interactive pieces delegate focus, keyboard, and ARIA behaviour to maintained Radix primitives.",
  },
];

/**
 * Feature grid island. Uses a lucide-react icon per item and a single motion
 * entrance that resolves immediately when the user prefers reduced motion.
 */
export default function StarterPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="grid gap-6 sm:grid-cols-3">
      {FEATURES.map((feature, index) => (
        <motion.li
          key={feature.title}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35, delay: index * 0.08 }}
          className="rounded-[var(--radius)] border border-border bg-card p-6 text-card-foreground"
        >
          <feature.icon aria-hidden="true" className="h-6 w-6 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
        </motion.li>
      ))}
    </ul>
  );
}
