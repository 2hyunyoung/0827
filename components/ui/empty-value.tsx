export default function EmptyValue({ reason }: { reason?: string | null }) { return <span className="ui-empty-value"><span>—</span>{reason && <small>{reason}</small>}</span>; }
