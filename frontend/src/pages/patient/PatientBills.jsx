import React, { useState, useEffect } from 'react';
import { billService } from '../../services/billService';
import { CreditCard, Printer, CheckCircle, Receipt, DollarSign, Shield } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const PatientBills = () => {
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Invoice Modal State
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  const fetchBills = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await billService.getBills({ page, limit: 10 });
      if (res.success) {
        setBills(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load hospital invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page]);

  const handleOpenInvoice = (bill) => {
    setSelectedBill(bill);
    setPaymentSuccess('');
  };

  const handleProcessPayment = async () => {
    if (!selectedBill) return;
    setPaymentProcessing(true);
    try {
      const res = await billService.processPayment(selectedBill._id, {
        paymentMethod,
      });
      if (res.success && res.data) {
        setSelectedBill(res.data);
        setPaymentSuccess('Payment processed successfully! Your invoice is now marked PAID.');
        fetchBills();
      }
    } catch (err) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Hospital Invoices & Billing
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Inspect clinical line-item charges, print official invoices, and settle bills via safe demo gateway.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving billing history..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchBills} />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No bills on record"
          description="Invoices generated for consultations, tests, or inpatient care will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bills.map((bill) => (
            <div key={bill._id} className="sh-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Receipt size={20} color="var(--primary-600)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      Invoice #{bill._id.slice(-6).toUpperCase()}
                    </h3>
                    <StatusBadge status={bill.paymentStatus} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Issued on {new Date(bill.createdAt).toLocaleDateString()} • {bill.items?.length || 1} item(s)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Total Amount</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      ${bill.total?.toFixed(2)}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => handleOpenInvoice(bill)}>
                    View Invoice
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Printable Invoice Modal with Demo Payment */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title={`Invoice #${selectedBill._id.slice(-6).toUpperCase()}`}
          maxWidth="680px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Button variant="secondary" icon={Printer} onClick={handlePrint}>
                Print Invoice
              </Button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="secondary" onClick={() => setSelectedBill(null)}>
                  Close
                </Button>
                {selectedBill.paymentStatus === 'PENDING' && (
                  <Button
                    variant="success"
                    icon={DollarSign}
                    onClick={handleProcessPayment}
                    loading={paymentProcessing}
                  >
                    Pay ${selectedBill.total?.toFixed(2)} (Demo)
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {paymentSuccess && (
              <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> {paymentSuccess}
              </div>
            )}

            {/* Hospital Header for Printable Invoice */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--gray-200)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e3a8a', letterSpacing: '-0.01em' }}>
                  ELITECARE HOSPITAL
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: '600' }}>
                  100 Medical Plaza, Healthcare City
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  Emergency & Inpatient Billing Department
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Invoice Number</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>#{selectedBill._id.slice(-6).toUpperCase()}</div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedBill.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div className="sh-table-container">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{item.description}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: 'var(--gray-100)', borderRadius: '4px' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${item.price?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>${item.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-600)' }}>
                  <span>Subtotal:</span>
                  <span>${selectedBill.subtotal?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-600)' }}>
                  <span>Tax (5%):</span>
                  <span>${selectedBill.tax?.toFixed(2)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Discount:</span>
                    <span>-${selectedBill.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.2rem', color: 'var(--gray-900)', borderTop: '1px solid var(--gray-200)', paddingTop: '8px' }}>
                  <span>Total Due:</span>
                  <span>${selectedBill.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Demo Payment Method Selection */}
            {selectedBill.paymentStatus === 'PENDING' && (
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>
                  Select Demo Payment Gateway Method
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['CARD', 'ONLINE', 'CASH', 'INSURANCE'].map((method) => (
                    <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="payMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientBills;
