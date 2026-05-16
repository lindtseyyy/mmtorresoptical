import React from "react";

interface EmptyTableRowsProps {
  count: number;
  colSpan: number;
  className?: string;
}

const EmptyTableRows: React.FC<EmptyTableRowsProps> = ({ count, colSpan, className }) => {
  if (count <= 0) return null;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={`empty-${i}`} className="border-b">
          <td colSpan={colSpan} className={`py-3${className ? ` ${className}` : ""}`}>
            &nbsp;
          </td>
        </tr>
      ))}
    </>
  );
};

export default EmptyTableRows;
