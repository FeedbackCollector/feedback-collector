import '../styles/MyManagement.css';

const METRICS = [
  { label: 'Managers', value: '8', detail: 'Managers in your organization' },
  { label: 'Individual Contributors', value: '24', detail: 'Across all teams' },
  { label: 'Org-wide Average Score', value: '4.6', detail: 'Out of 5' },
];

export default function MyManagementComp() {
  return (
    <section className="my-management-metrics" aria-label="Organization overview">
      {METRICS.map(({ label, value, detail }) => (
        <article className="my-management-metric-card" key={label}>
          <h2>{label}</h2>
          <p className="my-management-metric-value">{value}</p>
          <p className="my-management-metric-detail">{detail}</p>
        </article>
      ))}
    </section>
  );
}
