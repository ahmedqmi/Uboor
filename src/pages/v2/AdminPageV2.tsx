import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  RotateCcw,
  ClipboardList,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Megaphone,
  Search,
  Car,
  Inbox,
  XCircle,
  Undo2,
  ChevronLeft,
} from 'lucide-react';
import { useTravelContext } from '../../context/TravelContext';
import {
  getSeverityColor,
  getSeverityLabel,
  getAuthorityLabel,
  getReportTypeLabel,
} from '../../utils/suspiciousDetection';
import { SeverityIcon, AuthorityIcon } from './icons';
import type { Passenger, SuspiciousFlag, TravelRequest } from '../../types';
import './AdminPageV2.css';

type StatusFilter = 'all' | TravelRequest['status'];

export function AdminPageV2() {
  const { travelRequests, suspiciousFlags, isLoading, updateRequestStatus, resetToSampleData } =
    useTravelContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  const getDocumentTypeLabel = (type: string) => (type === 'passport' ? 'جواز سفر' : 'بطاقة هوية');

  const totalRequests = travelRequests.length;
  const flaggedRequests = travelRequests.filter((r) => r.status === 'flagged').length;
  const pendingRequests = travelRequests.filter((r) => r.status === 'pending').length;
  const approvedRequests = travelRequests.filter((r) => r.status === 'approved').length;

  const externalReportsCount = Array.from(suspiciousFlags.values()).filter(
    (f) => f.source === 'external_report'
  ).length;

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'الكل', count: totalRequests },
    { key: 'pending', label: 'قيد المراجعة', count: pendingRequests },
    { key: 'approved', label: 'تمت الموافقة', count: approvedRequests },
    { key: 'flagged', label: 'مشبوه', count: flaggedRequests },
  ];

  // One alert per flagged person (their most recent flagged crossing), not per crossing
  const alerts = useMemo(() => {
    const seen = new Set<string>();
    const rows: { passenger: Passenger; flag: SuspiciousFlag; request: TravelRequest }[] = [];
    const newestFirst = [...travelRequests].sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );
    for (const request of newestFirst) {
      if (request.status !== 'flagged') continue;
      for (const passenger of request.passengers) {
        const flag = suspiciousFlags.get(passenger.id);
        if (!flag || seen.has(passenger.documentNumber)) continue;
        seen.add(passenger.documentNumber);
        rows.push({ passenger, flag, request });
      }
    }
    return rows;
  }, [travelRequests, suspiciousFlags]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return travelRequests
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => {
        if (!query) return true;
        const haystack = [
          r.carPlateNumber,
          r.carType,
          r.carColor,
          ...r.passengers.map((p) => `${p.name} ${p.documentNumber}`),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice()
      .reverse();
  }, [travelRequests, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="av2-status-badge approved">تمت الموافقة</span>;
      case 'flagged':
        return <span className="av2-status-badge flagged">مشبوه</span>;
      default:
        return <span className="av2-status-badge pending">قيد المراجعة</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="v2-page admin-v2">
        <div className="av2-loading">
          <div className="av2-spinner"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-page admin-v2">
      <div className="v2-page-header">
        <span className="v2-eyebrow">
          <ShieldCheck size={14} strokeWidth={2.25} /> مركز المراقبة
        </span>
        <h1>لوحة التحكم</h1>
        <p>مراقبة وإدارة طلبات العبور في الوقت الحقيقي</p>
        <button className="v2-btn v2-btn-ghost av2-reset-btn" onClick={resetToSampleData}>
          <RotateCcw size={16} strokeWidth={2.25} /> تحميل بيانات تجريبية
        </button>
      </div>

      {/* KPI cards */}
      <div className="av2-stats-grid">
        <div className="av2-stat-card v2-glass total">
          <div className="av2-stat-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div className="av2-stat-info">
            <span className="av2-stat-value">{totalRequests}</span>
            <span className="av2-stat-label">إجمالي الطلبات</span>
          </div>
        </div>
        <div className="av2-stat-card v2-glass pending">
          <div className="av2-stat-icon">
            <Clock size={22} strokeWidth={2} />
          </div>
          <div className="av2-stat-info">
            <span className="av2-stat-value">{pendingRequests}</span>
            <span className="av2-stat-label">قيد المراجعة</span>
          </div>
        </div>
        <div className="av2-stat-card v2-glass approved">
          <div className="av2-stat-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div className="av2-stat-info">
            <span className="av2-stat-value">{approvedRequests}</span>
            <span className="av2-stat-label">تمت الموافقة</span>
          </div>
        </div>
        <div className="av2-stat-card v2-glass flagged">
          <div className="av2-stat-icon">
            <ShieldAlert size={22} strokeWidth={2} />
          </div>
          <div className="av2-stat-info">
            <span className="av2-stat-value">{flaggedRequests}</span>
            <span className="av2-stat-label">مشبوه</span>
          </div>
        </div>
        <div className="av2-stat-card v2-glass reports">
          <div className="av2-stat-icon">
            <Megaphone size={22} strokeWidth={2} />
          </div>
          <div className="av2-stat-info">
            <span className="av2-stat-value">{externalReportsCount}</span>
            <span className="av2-stat-label">بلاغات خارجية</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="av2-alerts v2-glass">
          <div className="av2-alerts-header">
            <span className="av2-alert-icon">
              <ShieldAlert size={20} strokeWidth={2.25} />
            </span>
            <h2>تنبيهات أمنية</h2>
            <span className="av2-alert-count">
              {alerts.length} {alerts.length >= 3 && alerts.length <= 10 ? 'حالات مشبوهة' : 'حالة مشبوهة'}
            </span>
          </div>
          <div className="av2-alert-list">
            {alerts.map(({ passenger, flag, request }) => {
                  const report = flag.source === 'external_report' ? flag.externalReport : undefined;
                  return (
                    <Link
                      key={passenger.id}
                      to={`/v2/passenger/${encodeURIComponent(passenger.documentNumber)}`}
                      className="av2-alert-item"
                      style={{ borderInlineStartColor: getSeverityColor(flag.severity) }}
                    >
                      <span
                        className="av2-alert-severity"
                        style={{ color: getSeverityColor(flag.severity) }}
                      >
                        <SeverityIcon severity={flag.severity} className="av2-icon-on-color" />
                      </span>
                      <div className="av2-alert-main">
                        <strong>{passenger.name}</strong>
                        <span className="av2-alert-doc">{passenger.documentNumber}</span>
                      </div>
                      <span className="av2-alert-reason">{flag.reason}</span>
                      <div className="av2-alert-tags">
                        {report && (
                          <span className="av2-tag neutral">
                            <AuthorityIcon authority={report.authority} className="av2-tag-icon" />
                            {getReportTypeLabel(report.reportType)}
                          </span>
                        )}
                        <span className="av2-alert-plate">
                          <Car size={13} strokeWidth={2} /> {request.carPlateNumber}
                        </span>
                      </div>
                      <ChevronLeft size={16} strokeWidth={2.25} className="av2-passenger-chevron" />
                    </Link>
                  );
            })}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="av2-toolbar v2-glass">
        <div className="av2-search">
          <Search size={17} strokeWidth={2.25} className="av2-search-icon" />
          <input
            type="text"
            placeholder="ابحث برقم اللوحة، الاسم أو رقم الوثيقة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="av2-filter-chips">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`av2-chip ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label} <span className="av2-chip-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests */}
      <div className="av2-requests v2-glass">
        <h2>طلبات العبور</h2>

        {filteredRequests.length === 0 ? (
          <div className="av2-empty">
            <Inbox size={44} strokeWidth={1.5} />
            <p>{travelRequests.length === 0 ? 'لا توجد طلبات عبور حتى الآن' : 'لا توجد نتائج مطابقة'}</p>
          </div>
        ) : (
          <div className="av2-requests-list">
            {filteredRequests.map((request) => (
              <div key={request.id} className={`av2-request-card ${request.status}`}>
                <div className="av2-request-header">
                  <div className="av2-request-info">
                    <div className="av2-car-info">
                      <span className="av2-car-avatar">
                        <Car size={17} strokeWidth={2} />
                      </span>
                      <span className="av2-car-plate">{request.carPlateNumber}</span>
                      <span className="av2-car-details">
                        {request.carType} - {request.carColor}
                      </span>
                    </div>
                    <div className="av2-request-meta">
                      <span className="av2-request-time">{formatDate(request.submittedAt)}</span>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <div className="av2-request-actions">
                    {request.status === 'pending' && (
                      <>
                        <button
                          className="av2-action-btn approve"
                          onClick={() => updateRequestStatus(request.id, 'approved')}
                        >
                          <CheckCircle2 size={15} strokeWidth={2.25} /> موافقة
                        </button>
                        <button
                          className="av2-action-btn reject"
                          onClick={() => updateRequestStatus(request.id, 'flagged')}
                        >
                          <XCircle size={15} strokeWidth={2.25} /> رفض
                        </button>
                      </>
                    )}
                    {request.status === 'flagged' && (
                      <button
                        className="av2-action-btn approve"
                        onClick={() => updateRequestStatus(request.id, 'approved')}
                      >
                        <Undo2 size={15} strokeWidth={2.25} /> إلغاء التعليم
                      </button>
                    )}
                  </div>
                </div>

                <div className="av2-passengers-grid">
                  {request.passengers.map((passenger) => {
                    const flag = suspiciousFlags.get(passenger.id);
                    const report = flag?.source === 'external_report' ? flag.externalReport : undefined;
                    return (
                      <Link
                        key={passenger.id}
                        to={`/v2/passenger/${encodeURIComponent(passenger.documentNumber)}`}
                        className={`av2-passenger-item ${flag ? 'flagged' : ''}`}
                        style={flag ? { borderInlineStartColor: getSeverityColor(flag.severity) } : undefined}
                      >
                        <span className="av2-passenger-avatar">{passenger.name ? passenger.name[0] : '?'}</span>
                        <div className="av2-passenger-info">
                          <span className="av2-passenger-name">{passenger.name}</span>
                          <span className="av2-passenger-doc">
                            {getDocumentTypeLabel(passenger.documentType)} · {passenger.documentNumber}
                          </span>
                          {flag && (
                            <>
                              <div className="av2-flag-tags">
                                <span
                                  className="av2-tag"
                                  style={{
                                    color: getSeverityColor(flag.severity),
                                    background: `${getSeverityColor(flag.severity)}1a`,
                                  }}
                                >
                                  <SeverityIcon severity={flag.severity} className="av2-tag-icon" />
                                  {getSeverityLabel(flag.severity)}
                                </span>
                                {report && (
                                  <span className="av2-tag neutral">
                                    <AuthorityIcon authority={report.authority} className="av2-tag-icon" />
                                    {getAuthorityLabel(report.authority)}
                                  </span>
                                )}
                              </div>
                              <span className="av2-flag-reason">{flag.reason}</span>
                            </>
                          )}
                        </div>
                        <ChevronLeft size={16} strokeWidth={2.25} className="av2-passenger-chevron" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
