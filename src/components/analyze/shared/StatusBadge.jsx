import { CircleCheckBig, TriangleAlert, CircleX, Info } from "lucide-react";

/* Fixed, reserved severity scale — never repurposed for series identity.
   Always icon + label, per the dataviz skill's status-color rule. */
const CONFIG = {
  success:  { icon: CircleCheckBig, cls: "bg-success-tint text-success",   label: "Good" },
  warning:  { icon: TriangleAlert,  cls: "bg-warning-tint text-warning",   label: "Needs attention" },
  critical: { icon: CircleX,        cls: "bg-critical-tint text-critical", label: "Critical" },
  info:     { icon: Info,           cls: "bg-info-tint text-info",         label: "Info" },
};

function StatusBadge({ severity, children }) {
  const cfg = CONFIG[severity] ?? CONFIG.info;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${cfg.cls}`}>
      <Icon size={12} />
      {children ?? cfg.label}
    </span>
  );
}

export default StatusBadge;
