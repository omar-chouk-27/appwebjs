"use client";

import { useState } from "react";
import { UserData } from "./AdminUserManagement";
import { LogSessionItem } from "./AdminSessionLogs";

interface AdminAnalyticsChartsProps {
  users: UserData[];
  sessions: LogSessionItem[];
}

export default function AdminAnalyticsCharts({ users, sessions }: AdminAnalyticsChartsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    tokens: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Global KPIs
  const totalSessions = sessions.length;
  const totalTokensSaved = sessions.reduce((acc, s) => acc + (s.tokensSaved || 0), 0);
  const totalQuota = users.reduce((acc, u) => acc + (u.tokenQuota || 0), 0);
  const totalTokensUsed = users.reduce((acc, u) => acc + (u.tokensUsed || 0), 0);

  // Average compression percentage
  const totalRawChars = sessions.reduce((acc, s) => acc + s.raw_prompt.length, 0);
  const totalOptChars = sessions.reduce((acc, s) => acc + s.opt_prompt.length, 0);
  const avgCompression =
    totalRawChars > 0 ? Math.round(((totalRawChars - totalOptChars) / totalRawChars) * 100) : 0;

  // Group sessions by day (YYYY-MM-DD)
  const dateMap: Record<string, { date: string; tokensSaved: number; count: number }> = {};
  sessions.forEach((s) => {
    const d = new Date(s.time).toLocaleDateString("fr-CA"); // YYYY-MM-DD
    if (!dateMap[d]) {
      dateMap[d] = { date: d, tokensSaved: 0, count: 0 };
    }
    dateMap[d].tokensSaved += s.tokensSaved || 0;
    dateMap[d].count += 1;
  });

  const timelineData = Object.values(dateMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Model usage distribution
  const modelMap: Record<string, { name: string; provider: string; count: number; tokensSaved: number }> = {};
  sessions.forEach((s) => {
    const key = s.model?.name || "Modèle Standard";
    if (!modelMap[key]) {
      modelMap[key] = {
        name: key,
        provider: s.model?.provider || "IA",
        count: 0,
        tokensSaved: 0,
      };
    }
    modelMap[key].count += 1;
    modelMap[key].tokensSaved += s.tokensSaved || 0;
  });
  const modelStats = Object.values(modelMap).sort((a, b) => b.count - a.count);

  // Top users by tokens used
  const topUsers = [...users].sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0)).slice(0, 5);

  // SVG Chart dimensions
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxTokens = Math.max(...timelineData.map((d) => d.tokensSaved), 10);
  const maxCount = Math.max(...timelineData.map((d) => d.count), 1);

  const points = timelineData.map((d, index) => {
    const x =
      timelineData.length > 1
        ? paddingX + (index / (timelineData.length - 1)) * (chartWidth - paddingX * 2)
        : chartWidth / 2;
    const y =
      chartHeight - paddingY - (d.tokensSaved / maxTokens) * (chartHeight - paddingY * 2);
    return { ...d, x, y };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
      : "";

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
          points[0].x
        } ${chartHeight - paddingY} Z`
      : "";

  return (
    <div className="space-y-6">
      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Optimisations</span>
            <span className="rounded-full bg-indigo-500/10 p-1.5 text-indigo-400">⚡</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalSessions}</span>
            <span className="text-xs text-slate-400">prompts traités</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            Moyenne: {totalSessions > 0 ? Math.round(totalTokensSaved / totalSessions) : 0} tokens/prompt
          </div>
        </div>

        {/* Tokens Saved */}
        <div className="rounded-2xl border border-emerald-900/40 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span>Tokens Économisés</span>
            <span className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-400">💰</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              +{totalTokensSaved.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">tokens</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Taux de compression : <span className="text-white font-bold">{avgCompression}%</span>
          </div>
        </div>

        {/* Token Quota Allocation */}
        <div className="rounded-2xl border border-purple-900/40 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <span>Quota Total Alloué</span>
            <span className="rounded-full bg-purple-500/10 p-1.5 text-purple-400">🎯</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-300">
              {totalQuota.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">tokens</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Consommés : <span className="text-amber-400 font-bold">{totalTokensUsed.toLocaleString()}</span> (
            {totalQuota > 0 ? Math.round((totalTokensUsed / totalQuota) * 100) : 0}%)
          </div>
        </div>

        {/* Users & Accounts */}
        <div className="rounded-2xl border border-blue-900/40 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>Utilisateurs Actifs</span>
            <span className="rounded-full bg-blue-500/10 p-1.5 text-blue-400">👥</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-300">{users.length}</span>
            <span className="text-xs text-slate-400">comptes</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {users.filter((u) => (u.totalPrompts || 0) > 0).length} ont déjà soumis des requêtes
          </div>
        </div>
      </div>

      {/* Main Chart: Activity & Tokens Saved Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              📈 Évolution Temporelle des Économies de Tokens
            </h3>
            <p className="text-xs text-slate-400">
              Volume quotidien de tokens économisés et nombre de sessions d'optimisation
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Tokens Économisés</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-indigo-500" />
              <span className="text-slate-300">Sessions</span>
            </div>
          </div>
        </div>

        {timelineData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Pas encore assez de données d'optimisation pour tracer le graphique temporel.
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto max-h-72 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="tokensGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const label = Math.round(ratio * maxTokens);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeOpacity="0.6"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 4}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Bar charts for sessions count */}
              {points.map((p) => {
                const barHeight = (p.count / maxCount) * (chartHeight - paddingY * 2) * 0.4;
                const barWidth = 14;
                return (
                  <rect
                    key={p.date}
                    x={p.x - barWidth / 2}
                    y={chartHeight - paddingY - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill="#6366f1"
                    opacity="0.4"
                  />
                );
              })}

              {/* Area under curve */}
              {areaD && <path d={areaD} fill="url(#tokensGradient)" />}

              {/* Line path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points & Interactive circles */}
              {points.map((p) => (
                <g key={p.date}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? 6 : 4}
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        date: p.date,
                        tokens: p.tokensSaved,
                        count: p.count,
                        x: p.x,
                        y: p.y,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Date labels on X-axis */}
                  <text
                    x={p.x}
                    y={chartHeight - 10}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {p.date.slice(5)}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                  transform: "translate(-50%, -120%)",
                }}
              >
                <div className="font-bold text-white">{hoveredPoint.date}</div>
                <div className="text-emerald-400 font-mono">
                  +{hoveredPoint.tokens} tokens économisés
                </div>
                <div className="text-indigo-300 font-mono">
                  {hoveredPoint.count} session(s)
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two Column Grid: Models distribution & Top Users Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            🤖 Répartition par Modèle IA
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Fréquence d'utilisation et gains par fournisseur
          </p>

          {modelStats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">Aucun modèle utilisé</div>
          ) : (
            <div className="space-y-4">
              {modelStats.map((m) => {
                const sharePct = totalSessions > 0 ? Math.round((m.count / totalSessions) * 100) : 0;
                return (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{m.name}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {m.provider}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold">
                          +{m.tokensSaved} tokens
                        </span>
                        <span className="text-slate-400 font-mono">
                          {m.count} ({sharePct}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Quota & Consumption Leaderboard */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            🏆 Consommation des Utilisateurs vs Quota
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Utilisateurs les plus actifs et statut de leur quota
          </p>

          {topUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">Aucun utilisateur enregistré</div>
          ) : (
            <div className="space-y-4">
              {topUsers.map((u, i) => {
                const quota = u.tokenQuota || 10000;
                const used = u.tokensUsed || 0;
                const pct = Math.min(100, Math.round((used / quota) * 100));
                const isOver = pct >= 100;
                const isNear = pct >= 80;

                return (
                  <div key={u.id} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">
                          #{i + 1}
                        </span>
                        <span className="font-semibold text-white">
                          {u.name} {u.surname}
                        </span>
                        <span className="text-slate-500 text-[11px]">({u.email})</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          isOver ? "text-red-400" : isNear ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {used.toLocaleString()} / {quota.toLocaleString()} ({pct}%)
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver
                            ? "bg-red-500"
                            : isNear
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-indigo-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
