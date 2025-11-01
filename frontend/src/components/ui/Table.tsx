import React from 'react';

interface TableProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

interface TableHeadProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

interface TableBodyProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

interface TableRowProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

interface TableCellProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

function Table({ children, className = '' }: Readonly<TableProps>) {
  return (
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {children}
    </table>
  );
}

function TableHead({ children, className = '' }: Readonly<TableHeadProps>) {
  return <thead className={`bg-gray-50 ${className}`}>{children}</thead>;
}

function TableBody({ children, className = '' }: Readonly<TableBodyProps>) {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
}

function TableRow({ children, className = '' }: Readonly<TableRowProps>) {
  return <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>;
}

function TableCell({ children, className = '' }: Readonly<TableCellProps>) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}

function TableHeader({ children, className = '' }: Readonly<TableCellProps>) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
export default Table;
