import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileJson, Filter, RotateCcw, Database } from "lucide-react";
import * as XLSX from "xlsx";

function secondsToHMS(totalSeconds) {
  if (totalSeconds == null || isNaN(totalSeconds)) return "";
  const sec = Math.floor(Number(totalSeconds));
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function extractCallsFromJson(data, timezone = "local") {
  const userIdentity = data?.userId || "";
  const userHandle = userIdentity.includes(":") ? userIdentity.split(":", 2)[1] : userIdentity;
  const calls = [];
  const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
  const tzFmt = (iso) => {
    try {
      const d = new Date(iso);
      if (timezone === "local") {
        return d.toLocaleString();
      }
      return new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d);
    } catch (e) {
      return iso || "";
    }
  };

  const partRegex = /<part\s+identity="([^"]+)">\s*<name>([^<]+)<\/name>(?:\s*<duration>([^<]+)<\/duration>)?\s*<\/part>/g;

  for (const conv of conversations) {
    const msgs = Array.isArray(conv?.MessageList) ? conv.MessageList : [];
    for (const msg of msgs) {
      if (msg?.messagetype === "Event/Call" && typeof msg?.content === "string") {
        const content = msg.content;
        if (content.includes('type="ended"') && content.includes("<duration>")) {
          const matches = [...content.matchAll(partRegex)].map(m => ({
            identity: m[1],
            name: m[2],
            duration: m[3] != null ? Number(m[3]) : null,
          }));
          if (!matches.length) continue;

          let called = null;
          for (const p of matches) {
            if (!(userHandle && (p.identity === userHandle || p.identity.endsWith(userHandle)))) called = p;
          }
          if (!called && matches.length >= 2) called = matches[1];

          const durSec = matches.find(p => p.duration != null)?.duration ?? null;
          const ts = Date.parse(msg?.originalarrivaltime);

          calls.push({
            ts,
            dateLocal: tzFmt(msg?.originalarrivaltime),
            rawDate: msg?.originalarrivaltime,
            calledPerson: called?.name || "",
            calledIdentity: called?.identity || "",
            durationSeconds: durSec != null ? Math.round(durSec * 1000) / 1000 : null,
            durationHMS: secondsToHMS(durSec),
          });
        }
      }
    }
  }
  return calls.sort((a, b) => a.ts - b.ts);
}

function downloadAsHTMLxls(rows) {
  const headers = ["Date (local)", "Called person", "Duration (HH:MM:SS)", "Duration (seconds)", "Called identity"];
  const tableRows = rows.map(r => `\n<tr>\n<td>${escapeHtml(r.dateLocal)}</td>\n<td>${escapeHtml(r.calledPerson)}</td>\n<td>${escapeHtml(r.durationHMS)}</td>\n<td>${r.durationSeconds ?? ""}</td>\n<td>${escapeHtml(r.calledIdentity)}</td>\n</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, "call_log.xls");
}

function downloadAsXLSX(rows) {
  const wsData = [
    ["Date (local)", "Called person", "Duration (HH:MM:SS)", "Duration (seconds)", "Called identity"],
    ...rows.map(r => [r.dateLocal, r.calledPerson, r.durationHMS, r.durationSeconds, r.calledIdentity])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Calls");
  XLSX.writeFile(wb, "call_log.xlsx");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [timezone, setTimezone] = useState("Europe/Vienna");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const matchQuery = query.trim().length === 0 || r.calledPerson.toLowerCase().includes(query.toLowerCase()) || r.calledIdentity.toLowerCase().includes(query.toLowerCase());
      const ts = r.ts;
      const matchStart = startDate ? ts >= Date.parse(startDate) : true;
      const matchEnd = endDate ? ts <= Date.parse(endDate) : true;
      return matchQuery && matchStart && matchEnd;
    });
  }, [rows, query, startDate, endDate]);

  const totalDurationSeconds = useMemo(() => filtered.reduce((acc, r) => acc + (r.durationSeconds || 0), 0), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const extracted = extractCallsFromJson(json, timezone || "local");
        setRows(extracted);
        setPage(1);
      } catch (err) {
        console.error(err);
        alert("Couldn't parse that JSON. Please ensure it's the Skype messages.json export.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7" />
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Skype Call Extractor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => downloadAsHTMLxls(filtered)} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" /> .xls
            </Button>
            <Button onClick={() => downloadAsXLSX(filtered)} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" /> .xlsx
            </Button>
          </div>
        </header>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">1) Upload your <code>messages.json</code></CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="file">Select file</Label>
              <div className="flex items-center gap-3">
                <Input id="file" type="file" accept="application/json,.json" onChange={handleFile} />
                <Badge variant="secondary" className="whitespace-nowrap"><FileJson className="w-3.5 h-3.5 mr-1" /> JSON</Badge>
              </div>
              <p className="text-xs text-muted-foreground">We process everything locally in your browser. No data leaves your device.</p>
            </div>
            <div className="space-y-2">
              <Label>Timezone for display</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-auto">
                  {["Europe/Vienna","local","UTC","Europe/Berlin","Europe/London","America/New_York","America/Los_Angeles","Asia/Dubai","Asia/Singapore"].map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">2) Filter & explore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-1">
                <Label htmlFor="search">Search</Label>
                <Input id="search" placeholder="Name or identity" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <div>
                <Label>Start date/time</Label>
                <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End date/time</Label>
                <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {setQuery(""); setStartDate(""); setEndDate("");}}>Clear</Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">Total duration (filtered): <span className="font-semibold">{secondsToHMS(totalDurationSeconds)}</span> ({Math.round(totalDurationSeconds)} sec)</div>

            <div className="rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Date (local)</TableHead>
                    <TableHead>Called person</TableHead>
                    <TableHead>Duration (HH:MM:SS)</TableHead>
                    <TableHead>Duration (seconds)</TableHead>
                    <TableHead>Called identity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.dateLocal}</TableCell>
                      <TableCell>{r.calledPerson}</TableCell>
                      <TableCell>{r.durationHMS}</TableCell>
                      <TableCell>{r.durationSeconds}</TableCell>
                      <TableCell className="text-muted-foreground">{r.calledIdentity}</TableCell>
                    </TableRow>
                  ))}
                  {!pageRows.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">No rows. Upload a file to begin.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filtered.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()} | Total: {secondsToHMS(totalDurationSeconds)}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">3) Export</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Button onClick={() => downloadAsHTMLxls(filtered)} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" /> Download .xls (legacy)
            </Button>
            <Button variant="secondary" onClick={() => downloadAsXLSX(filtered)} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" /> Download .xlsx
            </Button>
          </CardContent>
        </Card>

        <footer className="text-xs text-muted-foreground text-center py-4">
          Built with ❤️ — your data never leaves the browser
        </footer>
      </div>
    </div>
  );
}
