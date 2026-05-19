import React from "react";

// ── Field name formatting ──

const ACRONYMS: Record<string, string> = {
  id: "ID",
  uuid: "UUID",
  url: "URL",
  dto: "",
};

const LOWERCASE_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in", "with", "from",
]);

const formatFieldName = (key: string): string => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      const a = ACRONYMS[word];
      if (a !== undefined) return a;
      if (i > 0 && LOWERCASE_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

// ── Value formatting ──

const looksLikeDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (looksLikeDate(value)) {
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return String(value);
};

// ── Sub-components ──

const JsonValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">—</span>;
  }
  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-xs">{String(value)}</span>;
  }
  if (looksLikeDate(value)) {
    return <span>{formatValue(value)}</span>;
  }
  if (typeof value === "string") {
    return <span className="whitespace-pre-wrap">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic text-xs">None</span>;
    }
    return (
      <div className="space-y-1.5 mt-0.5">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="rounded border bg-background/50 px-2.5 py-1.5 text-xs"
          >
            {typeof item === "object" && item !== null ? (
              <JsonObjectView obj={item as Record<string, unknown>} />
            ) : (
              <JsonValue value={item} />
            )}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="mt-0.5 rounded border bg-background/50 px-2.5 py-1.5">
        <JsonObjectView obj={value as Record<string, unknown>} />
      </div>
    );
  }
  return <span>{String(value)}</span>;
};

const JsonObjectView: React.FC<{ obj: Record<string, unknown> }> = ({ obj }) => {
  const entries = Object.entries(obj).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  if (entries.length === 0) {
    return <span className="text-muted-foreground italic text-xs">No data</span>;
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
      {entries.map(([key, value]) => (
        <React.Fragment key={key}>
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap self-start">
            {formatFieldName(key)}:
          </span>
          <span className="text-xs min-w-0 font-medium">
            <JsonValue value={value} />
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Predicates ──

const isUpdateEvent = (
  obj: Record<string, unknown>,
): obj is { before: Record<string, unknown>; after: Record<string, unknown> } =>
  Object.keys(obj).length === 2 && "before" in obj && "after" in obj;

const EYE_GROUP_KEYS = ["rightEye", "leftEye", "bothEyes"];

const isPrescriptionEvent = (obj: Record<string, unknown>): boolean =>
  "examDate" in obj && EYE_GROUP_KEYS.some((k) => k in obj);

// ── Prescription event view ──

const PrescriptionEventView: React.FC<{ obj: Record<string, unknown> }> = ({ obj }) => {
  const mainFields = Object.entries(obj).filter(
    ([key]) => !EYE_GROUP_KEYS.includes(key),
  );
  const eyeGroups = EYE_GROUP_KEYS.filter(
    (key) => Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {mainFields.map(([key, value]) => (
          <React.Fragment key={key}>
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap self-start">
              {formatFieldName(key)}:
            </span>
            <span className="text-xs min-w-0 font-medium">
              <JsonValue value={value} />
            </span>
          </React.Fragment>
        ))}
      </div>

      {eyeGroups.map((groupKey) => {
        const items = obj[groupKey] as Record<string, unknown>[];
        if (items.length === 0) return null;
        const columns = Object.keys(items[0]);

        return (
          <div key={groupKey}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
              {formatFieldName(groupKey)}
            </h4>
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    {columns.map((col) => (
                      <th key={col} className="py-1.5 px-2 font-medium whitespace-nowrap">
                        {formatFieldName(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      {columns.map((col) => (
                        <td key={col} className="py-1.5 px-2 align-top">
                          <JsonValue value={item[col]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main export ──

interface JsonDetailsViewProps {
  data: unknown;
}

const JsonDetailsView: React.FC<JsonDetailsViewProps> = ({ data }) => {
  if (typeof data !== "object" || data === null) {
    return <p className="text-sm">{formatValue(data)}</p>;
  }

  const obj = data as Record<string, unknown>;

  // Update event → before/after comparison table
  if (isUpdateEvent(obj)) {
    const { before, after } = obj;

    const allKeys = [
      ...new Set([
        ...Object.keys(before ?? {}),
        ...Object.keys(after ?? {}),
      ]),
    ].filter(
      (k) => before?.[k] !== undefined || after?.[k] !== undefined,
    );

    if (allKeys.length === 0) {
      return (
        <p className="text-sm text-muted-foreground italic">
          No changes recorded.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1.5 pr-3 font-medium w-[25%]">Field</th>
              <th className="py-1.5 pr-3 font-medium w-[37.5%]">Before</th>
              <th className="py-1.5 font-medium w-[37.5%]">After</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const beforeVal = before?.[key];
              const afterVal = after?.[key];
              const changed =
                JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
              return (
                <tr key={key} className="border-b">
                  <td className="py-1.5 pr-3 font-medium text-muted-foreground align-top">
                    {formatFieldName(key)}
                  </td>
                  <td
                    className={`py-1.5 pr-3 align-top ${
                      changed
                        ? "text-red-900 dark:text-red-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    <JsonValue value={beforeVal} />
                  </td>
                  <td className="py-1.5 align-top text-emerald-600 dark:text-emerald-400">
                    <JsonValue value={afterVal} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Prescription event → main fields grid + eye group tables
  if (isPrescriptionEvent(obj)) {
    return <PrescriptionEventView obj={obj} />;
  }

  // Flat object
  return <JsonObjectView obj={obj} />;
};

export default JsonDetailsView;
