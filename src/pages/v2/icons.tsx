import {
  ShieldAlert,
  ShieldQuestion,
  Fingerprint,
  Globe2,
  PackageSearch,
  Lock,
  Scale,
  Landmark,
  Ban,
  OctagonAlert,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ReportingAuthority } from '../../types';

const AUTHORITY_ICONS: Record<ReportingAuthority, LucideIcon> = {
  police: ShieldAlert,
  immigration: Fingerprint,
  interpol: Globe2,
  customs: PackageSearch,
  security: Lock,
  court: Scale,
};

export function AuthorityIcon({ authority, className }: { authority: ReportingAuthority; className?: string }) {
  const Icon = AUTHORITY_ICONS[authority] ?? Landmark;
  return <Icon className={className} strokeWidth={2} />;
}

const SEVERITY_ICONS: Record<'low' | 'medium' | 'high' | 'critical', LucideIcon> = {
  critical: Ban,
  high: OctagonAlert,
  medium: TriangleAlert,
  low: Zap,
};

export function SeverityIcon({
  severity,
  className,
}: {
  severity: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
}) {
  const Icon = SEVERITY_ICONS[severity] ?? ShieldQuestion;
  return <Icon className={className} strokeWidth={2} />;
}
