import { DOMAINS } from '../../data/index';

export default function DomainChip({ domainId }) {
  const d = DOMAINS.find((x) => x.id === domainId);
  return (
    <span className={`dtag dtag-${d.color}`}>
      <span className="dtag-dot" />D{d.num} · {d.short}
    </span>
  );
}
