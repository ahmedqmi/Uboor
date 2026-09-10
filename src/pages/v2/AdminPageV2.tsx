import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useTravelContext } from '../../context/TravelContext';
import {
  getSeverityColor,
  getSeverityLabel,
  getAuthorityLabel,
  getReportTypeLabel,
} from '../../utils/suspiciousDetection';
import { SeverityIcon, AuthorityIcon } from './icons';
import type { TravelRequest } from '../../types';
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
      {flaggedRequests > 0 && (
        <div className="av2-alerts v2-glass">
          <div className="av2-alerts-header">
            <span className="av2-alert-icon">
              <ShieldAlert size={20} strokeWidth={2.25} />
            </span>
            <h2>تنبيهات أمنية</h2>
            <span className="av2-alert-count">{flaggedRequests} حالة مشبوهة</span>
          </div>
          <div className="av2-alert-list">
            {travelRequests
              .filter((r) => r.status === 'flagged')
              .slice()
              .reverse()
              .map((request) => {
                const flaggedPassengers = request.passengers.filter((p) => suspiciousFlags.has(p.id));
                return flaggedPassengers.map((passenger) => {
                  const flag = suspiciousFlags.get(passenger.id);
                  if (!flag) return null;
                  const isExternalReport = flag.source === 'external_report' && flag.externalReport;
                  return (
                    <div
                      key={passenger.id}
                      className={`av2-alert-item ${isExternalReport ? 'external' : ''}`}
                      style={{ borderInlineStartColor: getSeverityColor(flag.severity) }}
                    >
                      <div className="av2-alert-severity" style={{ background: getSeverityColor(flag.severity) }}>
                        <SeverityIcon severity={flag.severity} className="av2-icon-on-color" />
                      </div>
                      <div className="av2-alert-content">
                        <div className="av2-alert-passenger">
                          <strong>{passenger.name}</strong>
                          <span>
                            {getDocumentTypeLabel(passenger.documentType)}: {passenger.documentNumber}
                          </span>
                        </div>
                        <div className="av2-alert-reason">
                          <span className="av2-reason-text">{flag.reason}</span>
                          <span
                            className="av2-severity-badge"
                            style={{ background: getSeverityColor(flag.severity) }}
                          >
                            {getSeverityLabel(flag.severity)}
                          </span>
                        </div>
                        {isExternalReport && flag.externalReport && (
                          <div className="av2-report-details">
                            <div className="av2-report-source">
                              <AuthorityIcon authority={flag.externalReport.authority} className="av2-authority-icon" />
                              <span className="av2-source-name">
                                {getAuthorityLabel(flag.externalReport.authority)}
                              </span>
                              <span className="av2-report-type-badge">
                                {getReportTypeLabel(flag.externalReport.reportType)}
                              </span>
                            </div>
                            <div className="av2-report-info">
                              <span>رقم القضية: {flag.externalReport.caseNumber}</span>
                              <span>تاريخ البلاغ: {formatDate(flag.externalReport.reportDate)}</span>
                            </div>
                          </div>
                        )}
                        <div className="av2-alert-car">
                          <Car size={14} strokeWidth={2} /> {request.carPlateNumber} - {request.carType}
                        </div>
                      </div>
                    </div>
                  );
                });
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
                    const isExternalReport = flag?.source === 'external_report';
                    return (
                      <div
                        key={passenger.id}
                        className={`av2-passenger-item ${flag ? 'flagged' : ''} ${isExternalReport ? 'has-report' : ''}`}
                      >
                        <span className="av2-passenger-avatar">{passenger.name ? passenger.name[0] : '?'}</span>
                        <div className="av2-passenger-info">
                          <span className="av2-passenger-name">{passenger.name}</span>
                          <span className="av2-passenger-doc">
                            {getDocumentTypeLabel(passenger.documentType)}: {passenger.documentNumber}
                          </span>
                          {flag && (
                            <div className="av2-flag-indicator" style={{ background: getSeverityColor(flag.severity) }}>
                              <SeverityIcon severity={flag.severity} className="av2-icon-on-color" />
                              <div>
                                <span className="av2-flag-reason">{flag.reason}</span>
                                {isExternalReport && flag.externalReport && (
                                  <span className="av2-flag-authority">
                                    <AuthorityIcon authority={flag.externalReport.authority} className="av2-authority-icon" />{' '}
                                    {getAuthorityLabel(flag.externalReport.authority)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
