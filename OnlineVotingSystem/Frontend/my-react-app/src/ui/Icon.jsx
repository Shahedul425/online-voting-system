// Thin wrapper over lucide-react so icon usage matches the prototype's `ic()` helper.
// npm i lucide-react (already in your package.json).
import * as LucideIcons from "lucide-react";

const toPascal = (kebab) =>
  kebab.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");

export default function Icon({ name, className = "w-5 h-5", strokeWidth = 2 }) {
  const Cmp = LucideIcons[toPascal(name)] || LucideIcons.Circle;
  return <Cmp className={className} strokeWidth={strokeWidth} />;
}
