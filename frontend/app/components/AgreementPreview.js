"use client";

import { useMemo } from "react";
import { buildAgreementPreview, normalizeType } from "@/lib/agreements";

export default function Page({ open, onClose, data }) {
  const text = useMemo(() => {
    try {
      return buildAgreementPreview(data || {});
    } catch {
      return "Preview unavailable.";
    }
  }, [data]);

  if (!open) return null;

  const t = normalizeType(data?.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white text-gray-900 shadow-lg">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold">Agreement Preview - {t?.toUpperCase()}</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
        <div className="p-4">
          <pre className="whitespace-pre-wrap text-sm leading-6">{text}</pre>
          <div className="mt-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-medium">Compliance Notice</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>No fixed-interest or guaranteed-return terms are permitted.</li>
              <li>Investments into haram industries are blocked.</li>
              <li>All agreements are subject to Shariah and SECP compliance review.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
