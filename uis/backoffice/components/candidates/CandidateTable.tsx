import Link from "next/link";
import { mapStageLabel, mapStatusLabel } from "@/lib/mappers";
import type { ApiRecord } from "@/types/api";

interface CandidateTableProps {
  records: ApiRecord[];
}

export function CandidateTable({ records }: CandidateTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        No candidates found with the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Position</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Stage</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t border-slate-100 text-slate-700">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{record.full_name}</div>
                <div className="text-xs text-slate-500">{record.email}</div>
              </td>
              <td className="px-4 py-3">{record.position}</td>
              <td className="px-4 py-3">{mapStatusLabel(record.status)}</td>
              <td className="px-4 py-3">{mapStageLabel(record.stage)}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/candidates/${record.id}`}
                  className="rounded bg-blue-800 px-3 py-1.5 text-xs font-semibold !text-white visited:!text-white hover:!text-white focus:!text-white shadow-sm hover:bg-blue-700"
                >
                  View detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
