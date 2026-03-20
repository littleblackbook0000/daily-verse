"use client";

import { useEffect, useMemo, useState } from "react";

const OT_BOOKS = ["Gen", "Deut", "Isa", "Ps"];
const NT_BOOKS = ["Mk", "Jn", "Rom", "Heb", "Rev"];

function pad(num) {
  return String(num).padStart(2, "0");
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function formatParts(parts = []) {
  if (!parts.length) return "無詞性解析";
  return parts.map((part) => `${part.word} ${part.parsing}`.trim()).join("\n");
}

function HoverWord({ surface, parts = [], rtl = false, tone = "sky" }) {
  const hoverClass = tone === "amber" ? "hover:bg-amber-100" : "hover:bg-sky-100";
  const textClass = rtl
    ? "text-[1.7rem] leading-[3rem]"
    : "text-[1.35rem] leading-10";

  return (
    <span className={`group relative inline-block cursor-help rounded px-1 py-0.5 ${hoverClass}`}>
      <span className={`${textClass} text-slate-900`} dir={rtl ? "rtl" : "ltr"}>
        {surface}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-96 -translate-x-1/2 whitespace-pre-line rounded-xl bg-slate-900 px-4 py-3 text-left text-base leading-7 text-white shadow-xl group-hover:block">
        {formatParts(parts)}
      </span>
    </span>
  );
}

function HebrewSurface({ aligned = [] }) {
  if (!aligned.length) {
    return <div className="text-slate-500">尚無資料</div>;
  }

  return (
    <div dir="rtl" className="text-right leading-[3rem]">
      {aligned.map((item, idx) => (
        <span key={`${item.surface}-${idx}`} className="ml-1 inline-block align-middle">
          <HoverWord surface={item.surface} parts={item.parts || []} rtl tone="amber" />
        </span>
      ))}
    </div>
  );
}

function GreekSurface({ aligned = [] }) {
  if (!aligned.length) {
    return <div className="text-slate-500">尚無資料</div>;
  }

  return (
    <div className="leading-[3rem]">
      {aligned.map((item, idx) => (
        <span key={`${item.surface}-${idx}`} className="mr-1 inline-block align-middle">
          <HoverWord surface={item.surface} parts={item.parts || []} tone="sky" />
        </span>
      ))}
    </div>
  );
}

function InlineTranslation({ label, text }) {
  const labelMap = {
    YLT: "直譯",
    CU5: "中文",
    NRS: "英文",
    VUL: "拉丁文",
  };

  if (!text || !String(text).trim() || text === "Not available" || text === "尚無資料") {
    return null;
  }

  return (
    <div className="leading-7">
      <span className="mr-2 text-lg font-bold text-slate-900">{labelMap[label] || label}</span>
      <span className="text-[1.05rem] leading-7 text-slate-800">{text}</span>
    </div>
  );
}

function TranslationsBlock({ translations }) {
  const items = [
    { label: "YLT", text: translations?.YLT },
    { label: "CU5", text: translations?.CU5 },
    { label: "NRS", text: translations?.NRS },
    { label: "VUL", text: translations?.VUL },
  ].filter(
    (item) =>
      item.text &&
      String(item.text).trim() &&
      item.text !== "Not available" &&
      item.text !== "尚無資料"
  );

  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-slate-100">
      {items.map((item) => (
        <InlineTranslation key={item.label} label={item.label} text={item.text} />
      ))}
    </div>
  );
}

function Panel({
  title,
  badge,
  refText,
  aligned,
  translations,
  tone = "sky",
  rtl = false,
}) {
  const shadowClass = tone === "amber" ? "shadow-amber-100" : "shadow-sky-100";
  const badgeClass =
    tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : "bg-sky-100 text-sky-800";
  const blockClass = tone === "amber" ? "bg-amber-50/70" : "bg-sky-50/70";

  return (
    <div className={`rounded-[2rem] bg-white/85 p-6 shadow-xl ${shadowClass} md:p-8`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold tracking-tight text-slate-900">{title}</div>
          <div className="mt-1 text-xl text-slate-600">{refText || "尚未載入經文"}</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${badgeClass}`}>
          {badge}
        </div>
      </div>

      <div className="space-y-4">
        <div className={`rounded-3xl p-5 ${blockClass}`}>
          {rtl ? <HebrewSurface aligned={aligned} /> : <GreekSurface aligned={aligned} />}
        </div>

        <TranslationsBlock translations={translations} />
      </div>
    </div>
  );
}

function SmallButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-900 hover:bg-slate-300"
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });

  useEffect(() => {
    fetch("/data/books.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`載入 books.json 失敗: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "載入資料失敗");
      });
  }, []);

  const currentDate = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);

  const otVerses = useMemo(() => {
    if (!data) return [];
    return OT_BOOKS.flatMap((book) => data[book]?.verses || []);
  }, [data]);

  const ntVerses = useMemo(() => {
    if (!data) return [];
    return NT_BOOKS.flatMap((book) => data[book]?.verses || []);
  }, [data]);

  const dayIndex = getDayOfYear(currentDate) - 1;
  const otEntry = otVerses.length ? otVerses[dayIndex % otVerses.length] : null;
  const ntEntry = ntVerses.length ? ntVerses[dayIndex % ntVerses.length] : null;

  const shiftDate = (days) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(`${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`);
  };

  if (error) {
    return <div className="p-10 text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="p-10">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-sky-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-white/80 p-5 shadow-xl shadow-slate-200 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="text-sm font-medium tracking-wide text-slate-500">
                每日聖經對讀
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                希伯來文舊約與希臘文新約
              </h1>
              <p className="text-sm leading-7 text-slate-600 md:text-base">
                將滑鼠移到原文字詞上，可查看對應的詞性解析。
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-4 text-white shadow-lg md:p-5">
              <div className="mb-3 text-sm text-slate-300">選擇日期</div>
              <div className="flex items-center gap-2">
                <SmallButton onClick={() => shiftDate(-1)}>前一天</SmallButton>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
                <SmallButton onClick={() => shiftDate(1)}>後一天</SmallButton>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="希伯來文"
            badge="舊約"
            refText={otEntry?.ref}
            aligned={otEntry?.WTT_aligned || []}
            tone="amber"
            rtl
            translations={{
              YLT: otEntry?.YLT,
              CU5: otEntry?.CU5,
              NRS: otEntry?.NRS,
              VUL: otEntry?.VUL,
            }}
          />

          <Panel
            title="希臘文"
            badge="新約"
            refText={ntEntry?.ref}
            aligned={ntEntry?.BGT_aligned || []}
            tone="sky"
            translations={{
              YLT: ntEntry?.YLT,
              CU5: ntEntry?.CU5,
              NRS: ntEntry?.NRS,
              VUL: ntEntry?.VUL,
            }}
          />
        </div>
      </div>
    </div>
  );
}