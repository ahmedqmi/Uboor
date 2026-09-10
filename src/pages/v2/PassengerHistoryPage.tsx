import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Users,
  FileWarning,
  ScrollText,
  UserSearch,
  ShieldCheck,
} from 'lucide-react';
import { useTravelContext } from '../../context/TravelContext';
import {
  getSeverityColor,
  getSeverityLabel,
  getAuthorityLabel,
  getReportTypeLabel,
} from '../../utils/suspiciousDetection';
import { AuthorityIcon, SeverityIcon } from './icons';
import { buildPassengerHistory } from './passengerHistory';
import './PassengerHistoryPage.css';

type TimelineFilter = 'all' | 'crossings' | 'cases';

const STATUS_LABELS: Record<string, string> = {
  approved: 'تمت الموافقة',
  flagged: 'مشبوه',
  pending: 'قيد المراجعة',
};

export function PassengerHistoryPage() {
  const { documentNumber = '' } = useParams();
  const { travelRequests, suspiciousFlags, isLoading } = useTravelContext();
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const history = useMemo(
    () => buildPassengerHistory(documentNumber, travelRequests, suspiciousFlags),
    [documentNumber, travelRequests, suspiciousFlags]
  );

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  const { identity, crossings, cases, systemFlags, highestSeverity } = history;

  const approvedCount = crossings.filter((c) => c.status === 'approved').length;
  const flaggedCount = crossings.filter((c) => c.status === 'flagged').length;

  const timeline = useMemo(() => {
    const items: { key: string; date: Date; type: 'crossing' | 'case'; data: unknown }[] = [];
    if (filter !== 'cases') {
      crossings.forEach((c) =>
        items.push({ key: `c-${c.requestId}`, date: c.date, type: 'crossing', data: c })
      );
    }
    if (filter !== 'crossings') {
      cases.forEach((r) => items.push({ key: `r-${r.id}`, date: r.reportDate, type: 'case', data: r }));
    }
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [crossings, cases, filter]);

  if (isLoading) {
    return (
      <div className="v2-page history-v2">
        <div className="ph2-loading">
          <div className="ph2-spinner" />
          <p>جاري تحميل السجل...</p>
        </div>
      </div>
    );
  }

  if (!identity && cases.length === 0) {
    return (
      <div className="v2-page history-v2">
        <Link to="/v2/admin" className="ph2-back">
          <ArrowRight size={16} strokeWidth={2.25} /> العودة للوحة التحكم
        </Link>
        <div className="ph2-empty v2-glass">
          <UserSearch size={44} strokeWidth={1.5} />
          <p>لا يوجد سجل لرقم الوثيقة {documentNumber}</p>
        </div>
      </div>
    );
  }

  const name = identity?.name ?? 'غير معروف';
  const docLabel = identity
    ? identity.documentType === 'passport'
      ? 'جواز سفر'
      : 'بطاقة هوية'
    : 'وثيقة';

  return (
    <div className="v2-page history-v2">
      <Link to="/v2/admin" className="ph2-back">
        <ArrowRight size={16} strokeWidth={2.25} /> العودة للوحة التحكم
      </Link>

      {/* Identity */}
      <section className="ph2-identity v2-glass">
        <span
          className="ph2-avatar"
          style={highestSeverity ? { boxShadow: `0 0 0 3px ${getSeverityColor(highestSeverity)}33` } : undefined}
        >
          {name[0]}
        </span>
        <div className="ph2-identity-info">
          <h1>{name}</h1>
          <span className="ph2-doc">
            {docLabel} · {documentNumber}
          </span>
        </div>
        <div className="ph2-identity-status">
          {highestSeverity ? (
            <span
              className="ph2-severity-pill"
              style={{
                color: getSeverityColor(highestSeverity),
                background: `${getSeverityColor(highestSeverity)}1a`,
              }}
            >
              <SeverityIcon severity={highestSeverity} className="ph2-pill-icon" />
              {getSeverityLabel(highestSeverity)}
            </span>
          ) : (
            <span className="ph2-severity-pill clean">
              <ShieldCheck size={14} strokeWidth={2.25} /> لا توجد بلاغات
            </span>
          )}
        </div>
      </section>

      {/* Summary */}
      <div className="ph2-summary">
        <div className="ph2-stat v2-glass">
          <span className="ph2-stat-value">{crossings.length}</span>
          <span className="ph2-stat-label">عمليات العبور</span>
        </div>
        <div className="ph2-stat v2-glass">
          <span className="ph2-stat-value">{approvedCount}</span>
          <span className="ph2-stat-label">تمت الموافقة</span>
        </div>
        <div className="ph2-stat v2-glass">
          <span className="ph2-stat-value">{flaggedCount}</span>
          <span className="ph2-stat-label">عبور مشبوه</span>
        </div>
        <div className="ph2-stat v2-glass">
          <span className="ph2-stat-value">{cases.length}</span>
          <span className="ph2-stat-label">القضايا والبلاغات</span>
        </div>
      </div>

      {/* System notes */}
      {systemFlags.length > 0 && (
        <section className="ph2-system v2-glass">
          <h2>
            <FileWarning size={17} strokeWidth={2} /> ملاحظات الفحص الآلي
          </h2>
          <ul>
            {systemFlags.map((flag) => (
              <li key={flag.reason}>
                <span className="ph2-dot" style={{ background: getSeverityColor(flag.severity) }} />
                {flag.reason}
                <span className="ph2-inline-severity" style={{ color: getSeverityColor(flag.severity) }}>
                  {getSeverityLabel(flag.severity)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Timeline */}
      <section className="ph2-timeline-section v2-glass">
        <div className="ph2-timeline-header">
          <h2>
            <ScrollText size={18} strokeWidth={2} /> السجل الزمني
          </h2>
          <div className="ph2-filter-chips">
            {(
              [
                { key: 'all', label: 'الكل', count: crossings.length + cases.length },
                { key: 'crossings', label: 'العبور', count: crossings.length },
                { key: 'cases', label: 'القضايا', count: cases.length },
              ] as { key: TimelineFilter; label: string; count: number }[]
            ).map((f) => (
              <button
                key={f.key}
                className={`ph2-chip ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="ph2-chip-count">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="ph2-timeline-empty">لا توجد سجلات في هذا التصنيف</div>
        ) : (
          <ol className="ph2-timeline">
            {timeline.map((item) => {
              if (item.type === 'crossing') {
                const crossing = item.data as (typeof crossings)[number];
                return (
                  <li key={item.key} className={`ph2-event crossing ${crossing.status}`}>
                    <span className="ph2-marker">
                      <Car size={14} strokeWidth={2.25} />
                    </span>
                    <div className="ph2-event-body">
                      <div className="ph2-event-top">
                        <span className="ph2-event-title">عبور حدودي</span>
                        <span className={`ph2-status-badge ${crossing.status}`}>
                          {STATUS_LABELS[crossing.status]}
                        </span>
                        <span className="ph2-event-date">{formatDate(crossing.date)}</span>
                      </div>
                      <div className="ph2-event-meta">
                        <span className="ph2-plate">{crossing.carPlateNumber}</span>
                        <span>
                          {crossing.carType} · {crossing.carColor}
                        </span>
                      </div>
                      {crossing.companions.length > 0 && (
                        <div className="ph2-companions">
                          <Users size={13} strokeWidth={2} />
                          {crossing.companions.map((c) => (
                            <Link
                              key={c.id}
                              to={`/v2/passenger/${encodeURIComponent(c.documentNumber)}`}
                              className="ph2-companion"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              }

              const report = item.data as (typeof cases)[number];
              return (
                <li key={item.key} className="ph2-event case">
                  <span className="ph2-marker" style={{ background: getSeverityColor(report.severity) }}>
                    <AuthorityIcon authority={report.authority} className="ph2-marker-icon" />
                  </span>
                  <div className="ph2-event-body">
                    <div className="ph2-event-top">
                      <span className="ph2-event-title">{getAuthorityLabel(report.authority)}</span>
                      <span
                        className="ph2-type-badge"
                        style={{
                          color: getSeverityColor(report.severity),
                          background: `${getSeverityColor(report.severity)}1a`,
                        }}
                      >
                        {getReportTypeLabel(report.reportType)}
                      </span>
                      <span className="ph2-event-date">{formatDate(report.reportDate)}</span>
                    </div>
                    <p className="ph2-case-description">{report.description}</p>
                    <div className="ph2-event-meta">
                      <span className="ph2-case-number">{report.caseNumber}</span>
                      <span style={{ color: getSeverityColor(report.severity) }}>
                        {getSeverityLabel(report.severity)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
