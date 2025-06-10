import React from 'react';
import InvoiceTemplate from './InvoiceTemplate';
import './invoicePreview.scss';

const InvoicePreview = ({ invoice, client, devisDetails = [], onClose }) => {
  return (
    <div className="invoice-preview-wrapper">
      <InvoiceTemplate 
        invoice={invoice}
        client={client}
        devisDetails={devisDetails}
        onClose={onClose}
      />
    </div>
  );
};

export default InvoicePreview;