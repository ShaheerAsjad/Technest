import PolicyPage from '@/components/PolicyPage';

export const metadata = { title: 'Return Policy — TechNest' };

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      title="Return Policy"
      intro="We want you to be happy with your purchase. If something is wrong, contact us and we will make it right."
      sections={[
        { title: 'Damaged, defective or wrong item', body: 'If your parcel arrives damaged, defective or with the wrong item, contact us as soon as possible (ideally within 48 hours of delivery) with your order number and a photo. We will arrange a replacement or refund.' },
        { title: 'Change of mind', body: 'Unused items in original, sealed packaging may be returned within a reasonable period after delivery. Opened networking, cabling and electronic items cannot be returned unless faulty.' },
        { title: 'Warranty', body: 'Products carry the manufacturer or supplier warranty where applicable. Keep your order number as proof of purchase.' },
        { title: 'Refunds', body: 'Approved refunds are issued using the same method you paid with, or by bank transfer for Cash on Delivery orders.' },
      ]}
    />
  );
}
