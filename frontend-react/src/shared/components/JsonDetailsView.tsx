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
  if (value === null || value === undefined || value === "" || value === "null") return "—";
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
  if (value === null || value === undefined || value === "" || value === "null") {
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
  ("issueDate" in obj && EYE_GROUP_KEYS.some((k) => k in obj))
  || ("issueDate" in obj && "prescriptionId" in obj && ("recommendations" in obj || "lensSpecifications" in obj));

const isEyeExamEvent = (obj: Record<string, unknown>): boolean =>
  "examNumber" in obj && "chiefComplaint" in obj && "clinicalMetrics" in obj;

const TRANSACTION_ITEM_LIST_KEY = "transactionItemAuditDTOList";

const isCreateTransactionEvent = (obj: Record<string, unknown>): boolean =>
  "transactionNumber" in obj && TRANSACTION_ITEM_LIST_KEY in obj && !("before" in obj);

// ── Create transaction event view ──

const CreateTransactionView: React.FC<{ obj: Record<string, unknown> }> = ({ obj }) => {
  const transactionItems = obj[TRANSACTION_ITEM_LIST_KEY];
  const itemsArray = Array.isArray(transactionItems) ? transactionItems : [];

  const preferredOrder = [
    "transactionNumber", "createdBy", "transactionDate", "totalAmount",
    "paymentMethod", "paymentReferenceNumber",
    "transactionStatus", "amountPaid", "totalAmountPaid", "totalRefundedCash", "balanceDue",
    "completedAt", "estimatedReadyDate",
  ];

  const mainFields = preferredOrder
    .filter((key) => obj[key] !== undefined && obj[key] !== null)
    .map((key) => [key, obj[key]] as [string, unknown]);

  const remainingKeys = Object.keys(obj).filter(
    (k) => !preferredOrder.includes(k) && k !== TRANSACTION_ITEM_LIST_KEY,
  );
  for (const key of remainingKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      mainFields.push([key, obj[key]]);
    }
  }

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

      {itemsArray.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
            Transaction Item List
          </h4>
          <div className="space-y-1.5">
            {itemsArray.map((item, idx) => {
              if (typeof item !== "object" || item === null) return null;
              const itemObj = item as Record<string, unknown>;
              const itemKeys = Object.keys(itemObj);

              return (
                <div
                  key={idx}
                  className="rounded border bg-background/50 px-2.5 py-1.5 text-xs"
                >
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                    {itemKeys.map((key) => (
                      <React.Fragment key={key}>
                        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap self-start">
                          {formatFieldName(key)}:
                        </span>
                        <span className="text-xs min-w-0 font-medium">
                          <JsonValue value={itemObj[key]} />
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Prescription event view ──

const PrescriptionEventView: React.FC<{ obj: Record<string, unknown> }> = ({ obj }) => {
  const lensSpecs = Array.isArray(obj.lensSpecifications)
    ? (obj.lensSpecifications as Record<string, unknown>[])
    : [];

  const recommendations = Array.isArray(obj.recommendations)
    ? (obj.recommendations as Record<string, unknown>[])
    : [];

  const mainFields = Object.entries(obj).filter(
    ([key]) => !EYE_GROUP_KEYS.includes(key) && key !== "recommendations" && key !== "lensSpecifications",
  );

  const SPEC_COLS = new Set(["sph", "cyl", "axis", "addPower", "pd"]);

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

      {lensSpecs.map((spec, specIdx) => {
        const correctionType = spec.correctionType != null ? formatValue(spec.correctionType) : null;
        const purpose = spec.lensTypePurpose != null ? formatValue(spec.lensTypePurpose) : null;
        const headerText = [correctionType, purpose].filter(Boolean).join(" — ");

        const rightEye = spec.rightEye as Record<string, unknown> | undefined;
        const leftEye = spec.leftEye as Record<string, unknown> | undefined;
        const lensMeta = spec.lensMeta as Record<string, unknown> | undefined;

        return (
          <div key={specIdx} className="rounded border bg-background/50 overflow-hidden">
            <div className="px-2.5 py-1.5 border-b bg-muted/30">
              <span className="text-xs font-medium">
                {headerText || `Specification ${specIdx + 1}`}
              </span>
            </div>

            {(rightEye && Object.keys(rightEye).some(k => SPEC_COLS.has(k))) || (leftEye && Object.keys(leftEye).some(k => SPEC_COLS.has(k))) ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-left">
                    <th className="py-1 px-2.5 font-medium text-muted-foreground w-16"></th>
                    {[...SPEC_COLS].filter(k => (rightEye && rightEye[k] != null) || (leftEye && leftEye[k] != null)).map(col => (
                      <th key={col} className="py-1 px-2.5 font-medium text-muted-foreground whitespace-nowrap">
                        {formatFieldName(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rightEye && Object.keys(rightEye).some(k => SPEC_COLS.has(k)) && (
                    <tr className="border-b last:border-b-0">
                      <td className="py-1 px-2.5 font-medium text-muted-foreground">Right Eye</td>
                      {[...SPEC_COLS].filter(k => (rightEye && rightEye[k] != null) || (leftEye && leftEye[k] != null)).map(col => (
                        <td key={col} className="py-1 px-2.5 align-top max-w-[150px] whitespace-pre-wrap break-words">
                          <JsonValue value={rightEye?.[col] ?? null} />
                        </td>
                      ))}
                    </tr>
                  )}
                  {leftEye && Object.keys(leftEye).some(k => SPEC_COLS.has(k)) && (
                    <tr className="border-b last:border-b-0">
                      <td className="py-1 px-2.5 font-medium text-muted-foreground">Left Eye</td>
                      {[...SPEC_COLS].filter(k => (rightEye && rightEye[k] != null) || (leftEye && leftEye[k] != null)).map(col => (
                        <td key={col} className="py-1 px-2.5 align-top max-w-[150px] whitespace-pre-wrap break-words">
                          <JsonValue value={leftEye?.[col] ?? null} />
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            ) : null}

            {lensMeta && Object.keys(lensMeta).filter(k => lensMeta[k] != null && lensMeta[k] !== "").length > 0 && (
              <div className="px-2.5 py-1.5 border-t bg-muted/10 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {Object.entries(lensMeta).filter(([, v]) => v != null && v !== "").map(([key, value]) => (
                  <React.Fragment key={key}>
                    <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap self-start">
                      {formatFieldName(key)}:
                    </span>
                    <span className="text-[11px] min-w-0 whitespace-pre-wrap break-words">
                      <JsonValue value={value} />
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {String(spec.notes ?? "") !== "" && (
              <div className="px-2.5 py-1.5 border-t bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-medium">Notes: </span>
                <span className="text-[11px] whitespace-pre-wrap break-words">
                  <JsonValue value={spec.notes} />
                </span>
              </div>
            )}
          </div>
        );
      })}

      {recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
            Product Recommendations
          </h4>
          <div className="space-y-1.5">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="rounded border bg-background/50 px-2.5 py-1.5 text-xs">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {rec.productName != null && (
                    <>
                      <span className="text-muted-foreground font-medium whitespace-nowrap">Product Name:</span>
                      <span className="min-w-0"><JsonValue value={rec.productName} /></span>
                    </>
                  )}
                  {rec.quantity != null && (
                    <>
                      <span className="text-muted-foreground font-medium whitespace-nowrap">Quantity:</span>
                      <span className="min-w-0"><JsonValue value={rec.quantity} /></span>
                    </>
                  )}
                  {rec.staffNotes != null && String(rec.staffNotes) !== "" && (
                    <>
                      <span className="text-muted-foreground font-medium whitespace-nowrap">Usage Notes:</span>
                      <span className="min-w-0 whitespace-pre-wrap break-words"><JsonValue value={rec.staffNotes} /></span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Eye exam event view ──

const EyeExamEventView: React.FC<{ obj: Record<string, unknown> }> = ({ obj }) => {
  const clinicalMetrics = obj.clinicalMetrics as Record<string, unknown> | undefined;
  const visualAcuity = clinicalMetrics?.visualAcuity as Record<string, Record<string, unknown>> | undefined;
  const iop = clinicalMetrics?.intraocularPressure as Record<string, unknown> | undefined;
  const examinations = obj.examinations as Record<string, unknown> | undefined;

  const skippedKeys = new Set(["clinicalMetrics", "examinations", "voidReason"]);
  const mainFields = Object.entries(obj).filter(
    ([key, value]) => !skippedKeys.has(key) && value !== undefined && value !== null,
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

      {visualAcuity && Object.keys(visualAcuity).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
            Visual Acuity
          </h4>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="py-1.5 px-2 font-medium whitespace-nowrap">Type</th>
                  <th className="py-1.5 px-2 font-medium whitespace-nowrap">OD</th>
                  <th className="py-1.5 px-2 font-medium whitespace-nowrap">OS</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(visualAcuity).map(([type, values]) => (
                  <tr key={type} className="border-b last:border-b-0">
                    <td className="py-1.5 px-2 font-medium">{type}</td>
                    <td className="py-1.5 px-2">
                      <JsonValue value={values?.od ?? null} />
                    </td>
                    <td className="py-1.5 px-2">
                      <JsonValue value={values?.os ?? null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {iop && (String(iop.od ?? "") !== "" || String(iop.os ?? "") !== "") && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
            Intraocular Pressure
          </h4>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="py-1.5 px-2 font-medium whitespace-nowrap">OD</th>
                  <th className="py-1.5 px-2 font-medium whitespace-nowrap">OS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b last:border-b-0">
                  <td className="py-1.5 px-2">
                    <JsonValue value={iop.od ?? null} />
                  </td>
                  <td className="py-1.5 px-2">
                    <JsonValue value={iop.os ?? null} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {examinations && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
            Examinations
          </h4>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            {Object.entries(examinations)
              .filter(([, v]) => v !== null && v !== undefined)
              .map(([key, value]) => (
                <React.Fragment key={key}>
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap self-start">
                    {formatFieldName(key)}:
                  </span>
                  <span className="text-xs min-w-0 font-medium whitespace-pre-wrap">
                    <JsonValue value={value} />
                  </span>
                </React.Fragment>
              ))}
          </div>
        </div>
      )}

      {obj.voidReason != null && String(obj.voidReason) !== "" && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">
            Void Reason
          </h4>
          <p className="text-xs whitespace-pre-wrap">
            <JsonValue value={obj.voidReason} />
          </p>
        </div>
      )}
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

  // Create transaction event → reordered fields + separate item list section
  if (isCreateTransactionEvent(obj)) {
    return <CreateTransactionView obj={obj} />;
  }

  // Prescription event → main fields grid + eye group tables
  if (isPrescriptionEvent(obj)) {
    return <PrescriptionEventView obj={obj} />;
  }

  // Eye exam event → main fields grid + clinical metrics tables
  if (isEyeExamEvent(obj)) {
    return <EyeExamEventView obj={obj} />;
  }

  // Flat object
  return <JsonObjectView obj={obj} />;
};

export default JsonDetailsView;
