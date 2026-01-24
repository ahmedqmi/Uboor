import { useTravelContext } from '../context/TravelContext';
import { getSeverityColor, getSeverityLabel, getAuthorityLabel, getAuthorityIcon, getReportTypeLabel } from '../utils/suspiciousDetection';
import './AdminPage.css';

export function AdminPage() {
  const { travelRequests, suspiciousFlags, isLoading, updateRequestStatus, resetToSampleData } = useTravelContext();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">تمت الموافقة</span>;
      case 'flagged':
        return <span className="status-badge flagged">مشبوه</span>;
      default:
        return <span className="status-badge pending">قيد المراجعة</span>;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'passport' ? 'جواز سفر' : 'بطاقة هوية';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚫';
      case 'high':
        return '⛔';
      case 'medium':
        return '⚠️';
      default:
        return '⚡';
    }
  };

  const totalRequests = travelRequests.length;
  const flaggedRequests = travelRequests.filter((r) => r.status === 'flagged').length;
  const pendingRequests = travelRequests.filter((r) => r.status === 'pending').length;
  const approvedRequests = travelRequests.filter((r) => r.status === 'approved').length;

  // Count external reports
  const externalReportsCount = Array.from(suspiciousFlags.values()).filter(
    (f) => f.source === 'external_report'
  ).length;

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>لوحة التحكم</h1>
        <p>مراقبة وإدارة طلبات العبور</p>
        <button className="reset-btn" onClick={resetToSampleData}>
          🔄 تحميل بيانات تجريبية
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{totalRequests}</span>
            <span className="stat-label">إجمالي الطلبات</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{pendingRequests}</span>
            <span className="stat-label">قيد المراجعة</span>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <span className="stat-value">{approvedRequests}</span>
            <span className="stat-label">تمت الموافقة</span>
          </div>
        </div>

        <div className="stat-card flagged">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <span className="stat-value">{flaggedRequests}</span>
            <span className="stat-label">مشبوه</span>
          </div>
        </div>

        <div className="stat-card reports">
          <div className="stat-icon">📢</div>
          <div className="stat-info">
            <span className="stat-value">{externalReportsCount}</span>
            <span className="stat-label">بلاغات خارجية</span>
          </div>
        </div>
      </div>

      {/* Alerts Section - Suspicious Passengers */}
      {flaggedRequests > 0 && (
        <div className="alerts-section">
          <div className="alert-header">
            <span className="alert-icon">🚨</span>
            <h2>تنبيهات أمنية</h2>
            <span className="alert-count">{flaggedRequests} حالة مشبوهة</span>
          </div>
          <div className="alert-list">
            {travelRequests
              .filter((r) => r.status === 'flagged')
              .slice()
              .reverse()
              .map((request) => {
                const flaggedPassengers = request.passengers.filter((p) =>
                  suspiciousFlags.has(p.id)
                );
                return flaggedPassengers.map((passenger) => {
                  const flag = suspiciousFlags.get(passenger.id);
                  if (!flag) return null;
                  const isExternalReport = flag.source === 'external_report' && flag.externalReport;
                  return (
                    <div
                      key={passenger.id}
                      className={`alert-item ${isExternalReport ? 'external-report' : ''}`}
                      style={{ borderRightColor: getSeverityColor(flag.severity) }}
                    >
                      <div className="alert-severity" style={{ backgroundColor: getSeverityColor(flag.severity) }}>
                        {getSeverityIcon(flag.severity)}
                      </div>
                      <div className="alert-content">
                        <div className="alert-passenger">
                          <strong>{passenger.name}</strong>
                          <span className="alert-doc">
                            {getDocumentTypeLabel(passenger.documentType)}: {passenger.documentNumber}
                          </span>
                        </div>
                        <div className="alert-reason">
                          <span className="reason-text">{flag.reason}</span>
                          <span className="severity-badge" style={{ backgroundColor: getSeverityColor(flag.severity) }}>
                            {getSeverityLabel(flag.severity)}
                          </span>
                        </div>

                        {/* External Report Details */}
                        {isExternalReport && flag.externalReport && (
                          <div className="external-report-details">
                            <div className="report-source">
                              <span className="source-icon">{getAuthorityIcon(flag.externalReport.authority)}</span>
                              <span className="source-name">{getAuthorityLabel(flag.externalReport.authority)}</span>
                              <span className="report-type-badge">{getReportTypeLabel(flag.externalReport.reportType)}</span>
                            </div>
                            <div className="report-info">
                              <span className="case-number">رقم القضية: {flag.externalReport.caseNumber}</span>
                              <span className="report-date">تاريخ البلاغ: {formatDate(flag.externalReport.reportDate)}</span>
                            </div>
                          </div>
                        )}

                        {/* Source indicator */}
                        <div className="alert-source">
                          {flag.source === 'external_report' ? (
                            <span className="source-external">📢 بلاغ من جهة خارجية</span>
                          ) : (
                            <span className="source-system">🔍 كشف تلقائي من النظام</span>
                          )}
                        </div>

                        <div className="alert-car">
                          🚗 {request.carPlateNumber} - {request.carType}
                        </div>
                      </div>
                    </div>
                  );
                });
              })}
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="requests-section">
        <h2>طلبات العبور</h2>

        {travelRequests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>لا توجد طلبات عبور حتى الآن</p>
          </div>
        ) : (
          <div className="requests-list">
            {travelRequests
              .slice()
              .reverse()
              .map((request) => (
                <div
                  key={request.id}
                  className={`request-card ${request.status === 'flagged' ? 'flagged' : ''}`}
                >
                  <div className="request-header">
                    <div className="request-info">
                      <div className="car-info">
                        <span className="car-icon">🚗</span>
                        <span className="car-plate">{request.carPlateNumber}</span>
                        <span className="car-details">
                          {request.carType} - {request.carColor}
                        </span>
                      </div>
                      <div className="request-meta">
                        <span className="request-time">{formatDate(request.submittedAt)}</span>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>

                    <div className="request-actions">
                      {request.status === 'pending' && (
                        <>
                          <button
                            className="action-btn approve"
                            onClick={() => updateRequestStatus(request.id, 'approved')}
                          >
                            موافقة
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={() => updateRequestStatus(request.id, 'flagged')}
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {request.status === 'flagged' && (
                        <button
                          className="action-btn approve"
                          onClick={() => updateRequestStatus(request.id, 'approved')}
                        >
                          إلغاء التعليم
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="passengers-section">
                    <h4>المسافرون ({request.passengers.length})</h4>
                    <div className="passengers-grid">
                      {request.passengers.map((passenger) => {
                        const flag = suspiciousFlags.get(passenger.id);
                        const isExternalReport = flag?.source === 'external_report';
                        return (
                          <div
                            key={passenger.id}
                            className={`passenger-item ${flag ? 'flagged' : ''} ${isExternalReport ? 'has-report' : ''}`}
                          >
                            <div className="passenger-info">
                              <span className="passenger-name">{passenger.name}</span>
                              <span className="passenger-doc">
                                {getDocumentTypeLabel(passenger.documentType)}:{' '}
                                {passenger.documentNumber}
                              </span>
                            </div>

                            {flag && (
                              <div
                                className="flag-indicator"
                                style={{
                                  backgroundColor: getSeverityColor(flag.severity),
                                }}
                              >
                                <span className="flag-icon">{getSeverityIcon(flag.severity)}</span>
                                <div className="flag-details">
                                  <span className="flag-reason">{flag.reason}</span>
                                  <span className="flag-severity">
                                    {getSeverityLabel(flag.severity)}
                                  </span>
                                  {isExternalReport && flag.externalReport && (
                                    <span className="flag-authority">
                                      {getAuthorityIcon(flag.externalReport.authority)} {getAuthorityLabel(flag.externalReport.authority)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
