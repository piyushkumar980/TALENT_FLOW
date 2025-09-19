// // src/pages/JobSeekerDashboard.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";

// /* 
//    SMALL, PURE UI HELPERS
//    PURPOSE: RENDER COMPACT STAT CARDS AND BADGES WITHOUT HOLDING STATE
//    */
// function StatCard({ icon, title, value, delta, deltaText, darkMode }) {
//   return (
//     <div
//       className={`rounded-xl border shadow-sm p-4 ${
//         darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
//       }`}
//     >
//       <div className="flex items-center gap-3">
//         <div
//           className={`h-10 w-10 grid place-items-center rounded-lg ${
//             darkMode ? "bg-indigo-900 text-indigo-200" : "bg-indigo-50 text-indigo-600"
//           }`}
//         >
//           {icon}
//         </div>
//         <div>
//           <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{title}</div>
//           <div className={`text-xl font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>{value}</div>
//           <div className="text-[11px] text-emerald-500">
//             {delta} <span className={darkMode ? "text-slate-400" : "text-slate-500"}>{deltaText}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Badge({ children, color = "slate", darkMode }) {
//   const colorClassByName = {
//     slate: darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700",
//     blue: darkMode ? "bg-blue-800 text-blue-100" : "bg-blue-100 text-blue-700",
//     purple: darkMode ? "bg-violet-800 text-violet-100" : "bg-violet-100 text-violet-700",
//     green: darkMode ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-700",
//     orange: darkMode ? "bg-amber-800 text-amber-100" : "bg-amber-100 text-amber-700",
//     gray: darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700",
//   };
//   return <span className={`text-[11px] px-2 py-0.5 rounded-full ${colorClassByName[color]}`}>{children}</span>;
// }

// /* 
//    LOCAL PERSISTENCE KEYS AND SMALL PURE FUNCTIONS
//    PURPOSE: PROVIDE NAMES FOR LOCALSTORAGE AND SIMPLE DATA TRANSFORMS
//  */
// const LOCALSTORAGE_KEY_MY_APPLICATION_CANDIDATE_IDS = "my_app_candidate_ids";
// const LOCALSTORAGE_KEY_SAVED_JOB_IDS = "saved_jobs_ids";

// /* NORMALIZE ANY STRING VALUE TO LOWERCASE */
// const normalizeToLower = (s) => String(s || "").toLowerCase();

// /* MAP A CANDIDATE STAGE TO A RECENT-STATUS BADGE */
// const mapStageToRecentStatusBadge = (stage) => {
//   const s = normalizeToLower(stage);
//   if (s === "tech") return { text: "interview scheduled", color: "green" };
//   if (s === "offer" || s === "hired") return { text: "offer", color: "green" };
//   if (s === "rejected") return { text: "rejected", color: "gray" };
//   if (s === "screen") return { text: "reviewing", color: "blue" };
//   return { text: "applied", color: "blue" };
// };

// /* RETURN TRUE IF A TIMELINE ITEM IMPLIES AN INTERVIEW EVENT */
// const timelineItemLooksLikeInterview = (timelineItem) => {
//   const stageLower = normalizeToLower(timelineItem?.stage);
//   const noteLower = normalizeToLower(timelineItem?.note || "");
//   return stageLower === "tech" || noteLower.includes("interview");
// };

// /* HUMAN-READABLE DATE/TIME STRINGS */
// const formatDateOnly = (ms) => new Date(ms).toLocaleDateString();
// const formatTimeOnly = (ms) =>
//   new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// /* PICK N UNIQUE RANDOM ITEMS FROM AN ARRAY */
// function sampleUniqueItems(array, n) {
//   const copy = [...array];
//   for (let i = copy.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [copy[i], copy[j]] = [copy[j], copy[i]];
//   }
//   return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
// }

// /* 
//    JOB SEEKER DASHBOARD (DEFAULT EXPORT)
//    RESPONSIBILITY: LOAD JOBS/CANDIDATES, BOOTSTRAP FIRST-TIME VIEW,
//                    COMPUTE STATS/SECTIONS, AND RENDER DASHBOARD WIDGETS
//     */
// export default function JobSeekerDashboard({ darkMode }) {
//   /* NETWORK/ERROR STATE FOR PAGE LOAD */
//   const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
//   const [loadErrorMessage, setLoadErrorMessage] = useState("");

//   /* SECTION DATA ARRAYS */
//   const [recentApplicationActivities, setRecentApplicationActivities] = useState([]); // LAST FEW UPDATES
//   const [upcomingInterviewAppointments, setUpcomingInterviewAppointments] = useState([]); // LIMITED COUNT
//   const [recommendedJobCards, setRecommendedJobCards] = useState([]); // SUGGESTED JOBS

//   /* AGGREGATED METRICS */
//   const [totalApplicationCount, setTotalApplicationCount] = useState(0);
//   const [activeApplicationCount, setActiveApplicationCount] = useState(0);
//   const [savedJobsCount, setSavedJobsCount] = useState(0);
//   const [interviewEventCount, setInterviewEventCount] = useState(0);

//   /* 
//      INITIAL DATA LOAD
//      BEHAVIOR: FETCH JOBS AND CANDIDATES, BOOTSTRAP FIRST-TIME STATE,
//                COMPUTE RECENT/INTERVIEW/RECOMMENDATION DATA, AND STATS
//     */
//   useEffect(() => {
//     let didAbort = false;

//     async function loadDashboardDatasets() {
//       try {
//         setIsLoadingDashboard(true);
//         setLoadErrorMessage("");

//         // READ STORED CANDIDATE IDS THAT REPRESENT "MY APPLICATIONS"
//         let storedMyCandidateIds = [];
//         try {
//           storedMyCandidateIds = JSON.parse(
//             localStorage.getItem(LOCALSTORAGE_KEY_MY_APPLICATION_CANDIDATE_IDS) || "[]"
//           );
//         } catch {
//           storedMyCandidateIds = [];
//         }

//         // READ SAVED JOB IDS (OPTIONAL)
//         let storedSavedJobIds = [];
//         try {
//           storedSavedJobIds = JSON.parse(
//             localStorage.getItem(LOCALSTORAGE_KEY_SAVED_JOB_IDS) || "[]"
//           );
//         } catch {
//           storedSavedJobIds = [];
//         }

//         // FETCH LARGE PAGES OF JOBS AND CANDIDATES FROM MOCK API
//         const [jobsRes, candidatesRes] = await Promise.all([
//           fetch("/jobs?page=1&pageSize=3000"),
//           fetch("/candidates?page=1&pageSize=3000"),
//         ]);
//         if (!jobsRes.ok || !candidatesRes.ok) throw new Error("Failed to load data");

//         const jobsJson = await jobsRes.json();
//         const candidatesJson = await candidatesRes.json();

//         const jobRecords = jobsJson.items || [];
//         const candidateRecords = candidatesJson.items || [];

//         // BUILD A QUICK LOOKUP MAP FOR JOB BY ID
//         const jobMetadataById = new Map(
//           jobRecords.map((job) => [
//             job.id,
//             {
//               id: job.id,
//               title: job.title,
//               role: job.role,
//               company: job.company,
//               location: job.location,
//               status: job.status,
//               tags: job.tags || [],
//               team: job.team,
//               minSalary: job.minSalary,
//               maxSalary: job.maxSalary,
//             },
//           ])
//         );

//         // IF USER HAS NO SAVED APPLICATION IDS, BOOTSTRAP A SMALL SAMPLE
//         if (!storedMyCandidateIds.length) {
//           const candidatesWithValidJob = candidateRecords.filter(
//             (c) => c.jobId && jobMetadataById.has(c.jobId)
//           );
//           const sampled = sampleUniqueItems(candidatesWithValidJob, 6);
//           storedMyCandidateIds = sampled.map((c) => c.id);
//           localStorage.setItem(
//             LOCALSTORAGE_KEY_MY_APPLICATION_CANDIDATE_IDS,
//             JSON.stringify(storedMyCandidateIds)
//           );
//         }

//         // IF USER HAS NO SAVED JOBS, PICK A FEW ACTIVE JOBS
//         if (!storedSavedJobIds.length) {
//           const activeJobs = jobRecords.filter((j) => j.status === "active");
//           storedSavedJobIds = sampleUniqueItems(activeJobs, 3).map((j) => j.id);
//           localStorage.setItem(LOCALSTORAGE_KEY_SAVED_JOB_IDS, JSON.stringify(storedSavedJobIds));
//         }
//         setSavedJobsCount(storedSavedJobIds.length);

//         // FILTER TO ONLY THE CANDIDATES THAT REPRESENT "MY APPLICATIONS"
//         const myApplicationCandidates = candidateRecords.filter((c) =>
//           storedMyCandidateIds.includes(c.id)
//         );

//         // READ TIMELINES FOR EACH OF MY APPLICATIONS
//         const timelineItemsByCandidateId = new Map();
//         await Promise.all(
//           myApplicationCandidates.map(async (c) => {
//             try {
//               const r = await fetch(`/candidates/${c.id}/timeline`);
//               const t = await r.json();
//               const sortedItems = (t?.items || [])
//                 .slice()
//                 .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
//               timelineItemsByCandidateId.set(c.id, sortedItems);
//             } catch {
//               timelineItemsByCandidateId.set(c.id, []);
//             }
//           })
//         );

//         // AGGREGATE METRICS
//         const totalApps = myApplicationCandidates.length;
//         const activeApps = myApplicationCandidates.filter(
//           (c) => !["rejected", "hired"].includes(normalizeToLower(c.stage))
//         ).length;

//         // RECENT APPLICATION SECTION: ORDER BY MOST RECENT TIMELINE TIMESTAMP
//         const recentItems = myApplicationCandidates
//           .map((c) => {
//             const job = jobMetadataById.get(c.jobId) || {};
//             const timeline = timelineItemsByCandidateId.get(c.id) || [];
//             const last = timeline[timeline.length - 1];
//             const lastTs = last?.ts ?? Date.now();
//             return {
//               sortTs: lastTs,
//               title: job.role || c.position || "—",
//               company: job.company || "—",
//               date: formatDateOnly(lastTs),
//               status: mapStageToRecentStatusBadge(c.stage),
//               dept: job.team || "—",
//               location: job.location || c.location || "—",
//             };
//           })
//           .sort((a, b) => b.sortTs - a.sortTs)
//           .slice(0, 6);

//         // UPCOMING INTERVIEWS: EXTRACT INTERVIEW-LIKE TIMELINE EVENTS
//         const allInterviewEvents = [];
//         myApplicationCandidates.forEach((c) => {
//           const job = jobMetadataById.get(c.jobId) || {};
//           const timeline = timelineItemsByCandidateId.get(c.id) || [];
//           timeline.forEach((t) => {
//             if (timelineItemLooksLikeInterview(t)) {
//               allInterviewEvents.push({
//                 ts: t.ts,
//                 title: job.role || c.position || "—",
//                 company: job.company || "—",
//                 date: formatDateOnly(t.ts),
//                 time: formatTimeOnly(t.ts),
//                 type: { text: "video", color: "blue" }, // SIMPLE DEFAULT LABEL
//               });
//             }
//           });
//         });
//         allInterviewEvents.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
//         const limitedUpcomingInterviews = allInterviewEvents.slice(0, 3);

//         // RECOMMENDATION CARDS: TAKE FIRST FEW ACTIVE JOBS
//         const recommendationItems = jobRecords
//           .filter((j) => j.status === "active")
//           .slice(0, 3)
//           .map((j) => ({
//             id: j.id,
//             title: j.role || j.title || "—",
//             company: j.company || "—",
//             location: j.location || "—",
//             salary:
//               j.minSalary && j.maxSalary ? `$${j.minSalary} – $${j.maxSalary}` : "",
//             posted: "",
//             tags: j.tags || [],
//             raw: j,
//           }));

//         // ABORT-SAFE COMMIT BACK TO STATE
//         if (didAbort) return;

//         setTotalApplicationCount(totalApps);
//         setActiveApplicationCount(activeApps);
//         setUpcomingInterviewAppointments(limitedUpcomingInterviews);
//         setInterviewEventCount(allInterviewEvents.length);
//         setRecentApplicationActivities(recentItems);
//         setRecommendedJobCards(recommendationItems);
//       } catch (e) {
//         if (!didAbort) setLoadErrorMessage(e?.message || "Failed to load dashboard");
//       } finally {
//         if (!didAbort) setIsLoadingDashboard(false);
//       }
//     }

//     loadDashboardDatasets();
//     return () => {
//       didAbort = true;
//     };
//   }, []);

//   /* 
//      TOP SUMMARY CARDS
//      BEHAVIOR: MEMOIZE THE FOUR HIGH-LEVEL KPIS FOR THE HEADER GRID
// */
//   const topSummaryCards = useMemo(
//     () => [
//       {
//         icon: <span>📥</span>,
//         title: "Total Applications",
//         value: String(totalApplicationCount),
//         delta: "+",
//         deltaText: "this week",
//       },
//       {
//         icon: <span>✅</span>,
//         title: "Active Applications",
//         value: String(activeApplicationCount),
//         delta: "+",
//         deltaText: "this week",
//       },
//       {
//         icon: <span>🔖</span>,
//         title: "Saved Jobs",
//         value: String(savedJobsCount),
//         delta: "",
//         deltaText: "saved",
//       },
//       {
//         icon: <span>📅</span>,
//         title: "Interviews Scheduled",
//         value: String(interviewEventCount),
//         delta: "+",
//         deltaText: "this week",
//       },
//     ],
//     [totalApplicationCount, activeApplicationCount, savedJobsCount, interviewEventCount]
//   );

//   /* LOADING/ERROR GATES*/
//   if (isLoadingDashboard) {
//     return (
//       <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
//         Loading dashboard…
//       </div>
//     );
//   }
//   if (loadErrorMessage) {
//     return (
//       <div className="rounded-xl border bg-white p-8 text-center text-rose-600">
//         {loadErrorMessage}
//       </div>
//     );
//   }

//   /* 
//      MAIN RENDER
//     */
//   return (
//     <div className="space-y-6">
//       {/* TOP KPI CARDS */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {topSummaryCards.map((card) => (
//           <StatCard
//             key={card.title}
//             icon={card.icon}
//             title={card.title}
//             value={card.value}
//             delta={card.delta}
//             deltaText={card.deltaText}
//             darkMode={darkMode}
//           />
//         ))}
//       </div>

//       {/* MIDDLE GRID: RECENT APPLICATIONS + UPCOMING INTERVIEWS + QUICK ACTIONS */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         {/* RECENT APPLICATIONS SECTION */}
//         <div
//           className={`lg:col-span-2 rounded-xl border shadow-sm ${
//             darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
//           }`}
//         >
//           <div
//             className={`flex items-center justify-between px-5 py-4 border-b ${
//               darkMode ? "border-slate-700" : "border-slate-200"
//             }`}
//           >
//             <div className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
//               Recent Applications
//             </div>
//           </div>

//           <ul className="divide-y">
//             {recentApplicationActivities.length === 0 ? (
//               <li className="px-5 py-6 text-sm text-slate-500">No recent updates yet.</li>
//             ) : (
//               recentApplicationActivities.map((entry, idx) => (
//                 <li key={idx} className="px-5 py-4">
//                   <div className="flex items-center gap-3">
//                     <div
//                       className={`h-10 w-10 rounded-lg grid place-items-center ${
//                         darkMode ? "bg-slate-700" : "bg-slate-100"
//                       }`}
//                     >
//                       🧑‍💻
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3">
//                         <div className={`font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>
//                           {entry.title}
//                         </div>
//                         <div className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>•</div>
//                         <div className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
//                           {entry.company}
//                         </div>
//                         <div className="ml-auto flex items-center gap-3">
//                           <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
//                             {entry.date}
//                           </div>
//                           <Badge color={entry.status.color} darkMode={darkMode}>
//                             {entry.status.text}
//                           </Badge>
//                         </div>
//                       </div>
//                       <div
//                         className={`text-[12px] mt-1 ${
//                           darkMode ? "text-slate-400" : "text-slate-600"
//                         }`}
//                       >
//                         {entry.dept} · {entry.location}
//                       </div>
//                     </div>
//                   </div>
//                 </li>
//               ))
//             )}
//           </ul>
//         </div>

//         {/* RIGHT COLUMN: UPCOMING INTERVIEWS + QUICK ACTIONS */}
//         <div className="space-y-4">
//           {/* UPCOMING INTERVIEWS SECTION */}
//           <div
//             className={`rounded-xl border shadow-sm ${
//               darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
//             }`}
//           >
//             <div
//               className={`flex items-center justify-between px-5 py-4 border-b ${
//                 darkMode ? "border-slate-700" : "border-slate-200"
//               }`}
//             >
//               <div className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
//                 Upcoming Interviews
//               </div>
//               <button
//                 className={
//                   darkMode ? "text-slate-300 hover:text-slate-100" : "text-slate-500 hover:text-slate-700"
//                 }
//                 title="Expand"
//               >
//                 ▸
//               </button>
//             </div>
//             <ul className="divide-y">
//               {upcomingInterviewAppointments.length === 0 ? (
//                 <li className="px-5 py-6 text-sm text-slate-500">No interviews found.</li>
//               ) : (
//                 upcomingInterviewAppointments.map((iv, idx) => (
//                   <li key={idx} className="px-5 py-4">
//                     <div className="flex gap-3">
//                       <div
//                         className={`h-10 w-10 rounded-lg grid place-items-center ${
//                           darkMode ? "bg-slate-700" : "bg-slate-100"
//                         }`}
//                       >
//                         📞
//                       </div>
//                       <div className="flex-1">
//                         <div className={`font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>
//                           {iv.title}
//                         </div>
//                         <div className={`text-[12px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
//                           {iv.company}
//                         </div>
//                         <div className="mt-1 flex items-center gap-3 text-sm">
//                           <span className={darkMode ? "text-slate-300" : "text-slate-700"}>📅 {iv.date}</span>
//                           <span className={darkMode ? "text-slate-300" : "text-slate-700"}>🕑 {iv.time}</span>
//                           <Badge color={iv.type.color} darkMode={darkMode}>
//                             {iv.type.text}
//                           </Badge>
//                         </div>
//                       </div>
//                     </div>
//                   </li>
//                 ))
//               )}
//             </ul>
//           </div>

//           {/* QUICK ACTIONS SECTION */}
//           <div
//             className={`rounded-xl border shadow-sm p-4 ${
//               darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
//             }`}
//           >
//             <div className={`font-semibold px-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
//               Quick Actions
//             </div>
//             <div className="mt-3 grid grid-cols-2 gap-3">
//               {[
//                 { icon: "🔎", label: "Find Jobs", sub: "Discover new opportunities" },
//                 { icon: "📝", label: "Update Resume", sub: "Keep your profile fresh" },
//                 { icon: "👤", label: "View Profile", sub: "Check your visibility" },
//                 { icon: "💬", label: "Messages", sub: "Connect with recruiters" },
//               ].map((action) => (
//                 <button
//                   key={action.label}
//                   className={`rounded-lg border px-3 py-4 text-left hover:shadow-sm transition ${
//                     darkMode
//                       ? "bg-slate-700 border-slate-600 hover:bg-slate-600"
//                       : "bg-white border-slate-200 hover:bg-slate-50"
//                   }`}
//                 >
//                   <div className="flex items-center gap-3">
//                     <div
//                       className={`h-9 w-9 grid place-items-center rounded-md ${
//                         darkMode ? "bg-indigo-900 text-indigo-200" : "bg-indigo-50 text-indigo-600"
//                       }`}
//                     >
//                       {action.icon}
//                     </div>
//                     <div>
//                       <div className={`text-sm font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>
//                         {action.label}
//                       </div>
//                       <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
//                         {action.sub}
//                       </div>
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* RECOMMENDED JOBS SECTION */}
//       <div
//         className={`rounded-xl border shadow-sm ${
//           darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
//         }`}
//       >
//         <div
//           className={`flex items-center justify-between px-5 py-4 border-b ${
//             darkMode ? "border-slate-700" : "border-slate-200"
//           }`}
//         >
//           <div className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
//             Recommended For You
//           </div>
//         </div>

//         <ul className="divide-y">
//           {recommendedJobCards.length === 0 ? (
//             <li className="px-5 py-6 text-sm text-slate-500">No recommendations right now.</li>
//           ) : (
//             recommendedJobCards.map((job) => (
//               <li key={job.id} className="px-5 py-5">
//                 <div className="flex items-center gap-3">
//                   <div
//                     className={`h-11 w-11 rounded-lg grid place-items-center ${
//                       darkMode ? "bg-slate-700" : "bg-slate-100"
//                     }`}
//                   >
//                     🏢
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3">
//                       <div className={`font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>
//                         {job.title}
//                       </div>
//                       <div className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>•</div>
//                       <div className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
//                         {job.company}
//                       </div>
//                     </div>
//                     <div
//                       className={`mt-1 text-[12px] flex items-center gap-4 ${
//                         darkMode ? "text-slate-400" : "text-slate-600"
//                       }`}
//                     >
//                       {job.location ? <span>📍 {job.location}</span> : null}
//                       {job.salary ? <span>💰 {job.salary}</span> : null}
//                       {job.posted ? <span>🗓 {job.posted}</span> : null}
//                     </div>
//                     <div className="mt-2 flex gap-2">
//                       {(job.tags || []).map((t) => (
//                         <Badge
//                           key={t}
//                           color={t === "Featured" ? "green" : t === "remote" ? "blue" : "green"}
//                           darkMode={darkMode}
//                         >
//                           {t}
//                         </Badge>
//                       ))}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Link
//                       to={`/jobseeker/apply/${job.id}`}
//                       state={{ job: job.raw || job }}
//                       className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
//                     >
//                       Apply Now
//                     </Link>
//                   </div>
//                 </div>
//               </li>
//             ))
//           )}
//         </ul>
//       </div>

//       {/* BOTTOM SAMPLE METRICS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {[
//           { label: "Profile Views", value: "127", delta: "+23% this week" },
//           { label: "Applications This Week", value: String(totalApplicationCount), delta: "+ this week" },
//           { label: "Response Rate", value: "68%", delta: "+15% this week" },
//         ].map((b) => (
//           <div
//             key={b.label}
//             className={`rounded-xl border shadow-sm p-5 ${
//               darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
//             }`}
//           >
//             <div className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{b.label}</div>
//             <div className={`mt-1 text-2xl font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
//               {b.value}
//             </div>
//             <div className="text-[11px] text-emerald-500 mt-1">{b.delta}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// } 



































// // src/pages/JobsPage.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate, Link, useLocation } from "react-router-dom";
// import Toasts from "../components/common/Toasts.jsx";
// import { useToastStore } from "../store/index.js";

// /* ICONS USED FOR ROW ACTIONS */
// import {
//   Archive,
//   ArchiveRestore,
//   Pencil,
//   Trash2,
//   ChevronUp,
//   ChevronDown,
// } from "lucide-react";

// /* READ-ONLY API SERVICE FOR JOB LISTING */
// import { listJobs } from "../api/services/jobs.js";

// /* 
//    IN-MEMORY, SESSION-SCOPED PATCH STORE
//    PURPOSE: HOLD UI-ONLY EDITS (REORDER/ARCHIVE/DELETE/RENAME) THAT DO NOT HIT THE SERVER
//    LIFETIME: CLEARED WHEN THE PAGE IS RELOADED OR THE APP IS RESTARTED
//    KEY: JOB ID → VALUE: PARTIAL PATCH { title?, company?, status?, order?, __deleted? }
//    */
// const __sessionScopedJobPatchMap = new Map();

// /* 
//    APPLY SESSION PATCHES AND PRODUCE A SORTED LIST
//    INPUT: RAW ITEMS FROM SERVER (READ-ONLY)
//    OUTPUT: ARRAY AFTER (1) FILTERING TEMP DELETES (2) APPLYING PATCHES (3) ORDERING BY "order" */
// function applySessionPatchesAndSortByOrder(rawItems) {
//   const patched = rawItems
//     .filter((job) => !(__sessionScopedJobPatchMap.get(job.id)?.__deleted))
//     .map((job, indexFromServer) => {
//       const pendingPatch = __sessionScopedJobPatchMap.get(job.id) || {};
//       const computedOrder =
//         pendingPatch.order !== undefined
//           ? pendingPatch.order
//           : job.order !== undefined
//           ? job.order
//           : indexFromServer; // FALLBACK TO ORIGINAL SERVER ORDER
//       return { ...job, ...pendingPatch, order: computedOrder };
//     });

//   patched.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
//   return patched;
// }

// /* 
//    REMEMBER A SESSION-ONLY EDIT FOR A GIVEN JOB
//    MERGE STRATEGY: SHALLOW MERGE OF EXISTING PATCH OBJECT WITH NEW FIELDS*/
// function rememberSessionScopedEdit(jobId, partialPatch) {
//   const previous = __sessionScopedJobPatchMap.get(jobId) || {};
//   __sessionScopedJobPatchMap.set(jobId, { ...previous, ...partialPatch });
// }

// /* EDIT JOB MODAL */
// function EditJobModal({ job, onClose, onSave }) {
//   const [editedJobTitleInput, setEditedJobTitleInput] = useState(job.title || "");
//   const [editedCompanyNameInput, setEditedCompanyNameInput] = useState(job.company || "");

//   const handleSubmitEditedFields = (e) => {
//     e.preventDefault();
//     onSave({ ...job, title: editedJobTitleInput, company: editedCompanyNameInput });
//   };

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
//       <div className="absolute inset-0 flex items-center justify-center p-4">
//         <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border p-5">
//           <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Job</h2>

//           <form onSubmit={handleSubmitEditedFields} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
//               <input
//                 type="text"
//                 value={editedJobTitleInput}
//                 onChange={(e) => setEditedJobTitleInput(e.target.value)}
//                 className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
//               <input
//                 type="text"
//                 value={editedCompanyNameInput}
//                 onChange={(e) => setEditedCompanyNameInput(e.target.value)}
//                 className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
//                 required
//               />
//             </div>

//             <div className="flex items-center gap-2 pt-4 border-t">
//               <button
//                 type="submit"
//                 className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
//               >
//                 Save
//               </button>
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200"
//               >
//                 Cancel
//               </button>
//             </div>

//             <p className="text-xs text-slate-500 pt-2">
//               This change is <strong>temporary</strong> and will reset on page refresh.
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ROW ITEM */
// function RowItem({
//   job,
//   isHR,
//   isJobSeeker,
//   onRowClick,
//   onApply,
//   onEdit,
//   onDelete,
//   onToggleArchive,
//   onMoveUp,
//   onMoveDown,
//   canMoveUp,
//   canMoveDown,
// }) {
//   const isArchived = job.status === "archived";
//   const archivedOpacityClass = isArchived ? "opacity-60" : "";

//   /* 
//     Responsive polish for archived rows on very small screens:
//     - stack content, add top border before actions, let text wrap
//     - keep paddings comfy and buttons wrap nicely
//   */
//   const archivedTinyScreenRow =
//     "max-[400px]:flex-col max-[400px]:items-stretch max-[400px]:gap-3 max-[400px]:p-3";
//   const archivedTinyScreenLeft =
//     "max-[400px]:w-full max-[400px]:min-w-0";
//   const archivedTinyScreenRight =
//     "max-[400px]:w-full max-[400px]:justify-between max-[400px]:flex-wrap max-[400px]:gap-2 max-[400px]:pt-2 max-[400px]:border-t";

//   return (
//     <div
//       onClick={() => onRowClick(job)}
//       className={`flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer ${archivedOpacityClass} ${
//         isArchived ? archivedTinyScreenRow : ""
//       }`}
//     >
//       {/* LEFT SIDE: ORDER CONTROLS + TITLE/COMPANY */}
//       <div className={`flex items-center gap-2 min-w-0 ${isArchived ? archivedTinyScreenLeft : ""}`}>
//         {isHR && (
//           <div className="flex flex-col gap-1 mr-1">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onMoveUp(job);
//               }}
//               disabled={!canMoveUp}
//               className="h-7 w-7 grid place-items-center rounded-md border text-slate-600 disabled:opacity-30"
//               title="Move up (temp)"
//             >
//               <ChevronUp className="h-4 w-4" />
//             </button>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onMoveDown(job);
//               }}
//               disabled={!canMoveDown}
//               className="h-7 w-7 grid place-items-center rounded-md border text-slate-600 disabled:opacity-30"
//               title="Move down (temp)"
//             >
//               <ChevronDown className="h-4 w-4" />
//             </button>
//           </div>
//         )}

//         <div className="min-w-0">
//           <div className="font-semibold text-slate-900 flex items-center gap-2 break-words">
//             {job.title}
//             {isArchived && (
//               <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 max-[400px]:mt-0.5">
//                 Archived
//               </span>
//             )}
//           </div>
//           <div className="text-sm text-slate-500 break-words">{job.company}</div>
//         </div>
//       </div>

//       {/* RIGHT SIDE: ACTION BUTTONS */}
//       <div
//         className={`flex items-center gap-2 ${isArchived ? archivedTinyScreenRight : ""}`}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {isJobSeeker && (
//           <>
//             {!isArchived && (
//               <button
//                 onClick={() => onApply(job)}
//                 className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
//               >
//                 Apply
//               </button>
//             )}
//             <button
//               onClick={() => onToggleArchive(job)}
//               className="p-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
//               title={isArchived ? "Unarchive (temp)" : "Archive (temp)"}
//             >
//               {isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
//             </button>
//           </>
//         )}

//         {isHR && (
//           <>
//             <button
//               onClick={() => onEdit(job)}
//               className="p-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
//               title="Edit (temp)"
//             >
//               <Pencil className="h-4 w-4" />
//             </button>

//             <button
//               onClick={() => onToggleArchive(job)}
//               className="p-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
//               title={isArchived ? "Unarchive (temp)" : "Archive (temp)"}
//             >
//               {isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
//             </button>

//             <button
//               onClick={() => onDelete(job)}
//               className="p-2 rounded-lg border bg-white hover:bg-slate-50 text-rose-600"
//               title="Delete (temp)"
//             >
//               <Trash2 className="h-4 w-4" />
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// /* JOBS PAGE (DEFAULT EXPORT) */
// export default function JobsPage() {
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const pushToast = useToastStore((s) => s.push);

//   const isJobSeekerRoute = pathname.startsWith("/jobseeker");
//   const isHrRoute = pathname.startsWith("/hr");

//   const [jobListForUi, setJobListForUi] = useState([]);
//   const [searchQueryText, setSearchQueryText] = useState("");
//   const [jobRecordCurrentlyBeingEdited, setJobRecordCurrentlyBeingEdited] = useState(null);

//   const page = 1;
//   const pageSize = 2000;

//   useEffect(() => {
//     (async () => {
//       const response = await listJobs({ search: searchQueryText, page, pageSize, sort: "order" });
//       const patched = applySessionPatchesAndSortByOrder(response.items || []);
//       setJobListForUi(patched);
//     })();
//   }, [searchQueryText]);

//   function handleToggleArchiveStatus(job) {
//     const nextStatus = job.status === "archived" ? "active" : "archived";

//     rememberSessionScopedEdit(job.id, { status: nextStatus });

//     setJobListForUi((prev) =>
//       applySessionPatchesAndSortByOrder(
//         prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
//       )
//     );

//     pushToast?.(`${nextStatus === "archived" ? "Archived" : "Unarchived"} "${job.title}" (temp)`, "ok");
//   }

//   function handleMoveJobOnePosition(job, direction) {
//     setJobListForUi((prev) => {
//       const snapshot = [...prev];
//       const index = snapshot.findIndex((j) => j.id === job.id);
//       if (index < 0) return prev;

//       const delta = direction === "up" ? -1 : 1;
//       const swapIndex = index + delta;
//       if (swapIndex < 0 || swapIndex >= snapshot.length) return prev;

//       const a = snapshot[index];
//       const b = snapshot[swapIndex];

//       const orderA = a.order ?? index;
//       const orderB = b.order ?? swapIndex;

//       rememberSessionScopedEdit(a.id, { order: orderB });
//       rememberSessionScopedEdit(b.id, { order: orderA });

//       return applySessionPatchesAndSortByOrder(snapshot);
//     });

//     pushToast?.(`Moved "${job.title}" ${direction} (temp)`, "ok");
//   }

//   function handleTemporaryDelete(job) {
//     rememberSessionScopedEdit(job.id, { __deleted: true });
//     setJobListForUi((prev) => prev.filter((j) => j.id !== job.id));
//     pushToast?.(`Deleted "${job.title}" (temp)`, "ok");
//   }

//   return (
//     <div className="space-y-4">
//       <Toasts />

//       <div className="flex items-center justify-between bg-white border rounded-2xl p-3 shadow-sm">
//         <input
//           value={searchQueryText}
//           onChange={(e) => setSearchQueryText(e.target.value)}
//           placeholder="Search jobs or companies..."
//           className="w-1/2 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
//         />
//         {isHrRoute && (
//           <Link
//             to="/hr/jobs/new"
//             className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
//           >
//             + New Job
//           </Link>
//         )}
//       </div>

//       <div className="space-y-3">
//         {jobListForUi.length === 0 ? (
//           <div className="text-center text-slate-500 py-10">No jobs found</div>
//         ) : (
//           jobListForUi.map((job, indexInList) => (
//             <RowItem
//               key={job.id}
//               job={job}
//               isHR={isHrRoute}
//               isJobSeeker={isJobSeekerRoute}
//               onRowClick={(j) => {
//                 const base = isJobSeekerRoute ? "/jobseeker/jobs" : "/hr/jobs";
//                 navigate(`${base}/${j.id}`, {
//                   state: {
//                     fromRole: isJobSeekerRoute ? "jobseeker" : "hr",
//                     archived: j.status === "archived",
//                   },
//                 });
//               }}
//               onApply={(j) =>
//                 navigate(`/jobseeker/apply/${j.id}`, {
//                   state: { title: j.title, company: j.company },
//                 })
//               }
//               onEdit={(j) => setJobRecordCurrentlyBeingEdited(j)}
//               onDelete={(j) => isHrRoute && handleTemporaryDelete(j)}
//               onToggleArchive={handleToggleArchiveStatus}
//               onMoveUp={(j) => handleMoveJobOnePosition(j, "up")}
//               onMoveDown={(j) => handleMoveJobOnePosition(j, "down")}
//               canMoveUp={indexInList > 0}
//               canMoveDown={indexInList < jobListForUi.length - 1}
//             />
//           ))
//         )}
//       </div>

//       {jobRecordCurrentlyBeingEdited && isHrRoute && (
//         <EditJobModal
//           job={jobRecordCurrentlyBeingEdited}
//           onClose={() => setJobRecordCurrentlyBeingEdited(null)}
//           onSave={(updated) => {
//             rememberSessionScopedEdit(updated.id, {
//               title: updated.title,
//               company: updated.company,
//             });

//             setJobListForUi((prev) =>
//               applySessionPatchesAndSortByOrder(
//                 prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
//               )
//             );

//             setJobRecordCurrentlyBeingEdited(null);
//             useToastStore.getState().push?.(`Updated "${updated.title}" (temp)`, "ok");
//           }}
//         />
//       )}
//     </div>
//   );
// }







































































































