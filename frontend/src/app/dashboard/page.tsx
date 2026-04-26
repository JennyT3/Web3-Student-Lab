"use client";

import AuditLogList from "@/components/dashboard/AuditLogList";
import { useAuth } from "@/contexts/AuthContext";
import {
  Certificate,
  Course,
  Enrollment,
  certificatesAPI,
  coursesAPI,
  enrollmentsAPI,
} from "@/lib/api";
import {
  Award,
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/certificates", label: "Credentials", icon: Award },
  { href: "/simulator", label: "Simulator", icon: Route },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [_enrollments, setEnrollments] = useState<Enrollment[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    certificates: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [coursesData, certificatesData, enrollmentsData] =
          await Promise.all([
            coursesAPI.getAll(),
            user
              ? certificatesAPI.getByStudentId(user.id)
              : Promise.resolve([]),
            user ? enrollmentsAPI.getByStudentId(user.id) : Promise.resolve([]),
          ]);

        setCourses(coursesData);
        setCertificates(certificatesData);
        setEnrollments(enrollmentsData);

        setStats({
          totalCourses: coursesData.length,
          enrolledCourses: enrollmentsData.length,
          completedCourses: certificatesData.length,
          certificates: certificatesData.length,
        });
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  const statCards = useMemo(
    () => [
      {
        label: "Available Nodes",
        value: stats.totalCourses,
        icon: BookOpen,
      },
      {
        label: "Active Uplinks",
        value: stats.enrolledCourses,
        icon: ShieldCheck,
      },
      {
        label: "Executed Modules",
        value: stats.completedCourses,
        icon: LayoutDashboard,
      },
      {
        label: "Cryptographic Tokens",
        value: stats.certificates,
        icon: Award,
      },
    ],
    [stats],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const showSidebarLabels = isSidebarOpen || !isSidebarCollapsed;

  const sidebar = (
    <aside
      className={`flex h-full min-h-0 flex-col border-white/10 bg-zinc-950/95 text-white backdrop-blur-md transition-all duration-300 ${
        isSidebarCollapsed ? "xl:w-20" : "xl:w-72"
      } w-72 border-r`}
    >
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setIsSidebarOpen(false)}
        >
          <span className="h-3 w-3 shrink-0 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.7)]"></span>
          {showSidebarLabels && (
            <span className="truncate text-lg font-black uppercase tracking-tight">
              Control <span className="text-red-600">Center</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="rounded-lg p-3 text-gray-400 transition-colors hover:bg-white/10 hover:text-white xl:hidden"
          aria-label="Close side menu"
        >
          <X size={20} />
        </button>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          className="hidden rounded-lg p-3 text-gray-400 transition-colors hover:bg-white/10 hover:text-white xl:inline-flex"
          aria-label={
            isSidebarCollapsed ? "Expand side menu" : "Collapse side menu"
          }
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      <nav className="grid gap-2 p-4">
        {sidebarLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setIsSidebarOpen(false)}
            className={`grid min-h-12 grid-cols-[2.75rem_minmax(0,1fr)] items-center rounded-lg border border-transparent text-sm font-bold uppercase tracking-widest text-gray-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-white ${
              isSidebarCollapsed ? "xl:grid-cols-[2.75rem]" : ""
            }`}
          >
            <span className="flex justify-center">
              <Icon size={18} />
            </span>
            {showSidebarLabels && <span className="truncate">{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        {showSidebarLabels && (
          <div className="mb-4 min-w-0 rounded-lg border border-white/10 bg-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Active Operator
            </p>
            <p className="mt-1 truncate font-mono text-sm text-gray-300">
              {user?.name || "Unknown Entity"}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className={`grid min-h-12 w-full items-center rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500 hover:text-white ${
            isSidebarCollapsed
              ? "xl:grid-cols-[1fr] xl:place-items-center"
              : "grid-cols-[2.75rem_minmax(0,1fr)]"
          }`}
        >
          <span className="flex justify-center">
            <LogOut size={18} />
          </span>
          {showSidebarLabels && (
            <span className="truncate text-left">Disconnect</span>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white selection:bg-red-600 selection:text-white">
      <div className="pointer-events-none fixed right-0 top-0 h-[42rem] w-[42rem] rounded-full bg-red-600/5 blur-[150px]"></div>
      <div className="pointer-events-none fixed bottom-0 left-0 h-[34rem] w-[34rem] rounded-full bg-red-600/5 blur-[120px]"></div>

      <div
        className={`relative z-10 grid min-h-screen grid-cols-[minmax(0,1fr)] ${
          isSidebarCollapsed
            ? "xl:grid-cols-[5rem_minmax(0,1fr)]"
            : "xl:grid-cols-[18rem_minmax(0,1fr)]"
        }`}
      >
        <div className="hidden xl:block">{sidebar}</div>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 grid grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:hidden">
            {sidebar}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="bg-black/70"
              aria-label="Close side menu overlay"
            />
          </div>
        )}

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-lg border border-white/10 p-3 text-gray-300 transition-colors hover:border-red-500/40 hover:text-white xl:hidden"
                aria-label="Open side menu"
              >
                <Menu size={22} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-widest text-gray-500">
                  Dashboard
                </p>
                <h1 className="truncate text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                  Terminal <span className="text-red-600">Access</span>
                </h1>
              </div>
              <Link
                href="/playground"
                className="hidden min-h-11 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-xs font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500 hover:text-white sm:inline-flex"
              >
                Editor
                <ChevronRight size={16} />
              </Link>
            </div>
          </header>

          <main className="mx-auto grid w-full max-w-[96rem] gap-8 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="grid min-w-0 gap-8">
              <div className="border-l-4 border-red-600 py-2 pl-5">
                <h2 className="text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
                  Metrics <span className="text-gray-500">Online</span>
                </h2>
                <p className="mt-3 max-w-3xl text-base font-light tracking-wide text-gray-400 md:text-lg">
                  Operator{" "}
                  <span className="font-mono text-white">
                    {user?.name?.split(" ")[0] || "Student"}
                  </span>{" "}
                  - module connections active.
                </p>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4 lg:gap-6">
                {statCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="group relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-5 transition-all hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.1)]"
                  >
                    <div className="absolute right-0 top-0 h-14 w-14 rounded-bl-3xl bg-white/5 transition-colors group-hover:bg-red-500/10"></div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black transition-colors group-hover:border-white/30">
                        <Icon className="h-6 w-6 text-white group-hover:text-red-400" />
                      </div>
                      <p className="truncate font-mono text-3xl font-black text-white">
                        {value}
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <DashboardSection
                title="Directory Nodes"
                href="/courses"
                action="Scan All"
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 lg:gap-6">
                  {courses.slice(0, 3).map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group relative block min-w-0 border border-white/5 bg-zinc-950 p-6 transition-all hover:border-red-500/30 hover:bg-zinc-900"
                    >
                      <div className="absolute bottom-0 left-0 top-0 w-1 bg-transparent transition-colors group-hover:bg-red-600"></div>
                      <h4 className="mb-3 line-clamp-2 text-xl font-black uppercase tracking-tight text-white group-hover:text-red-50">
                        {course.title}
                      </h4>
                      <p className="mb-6 line-clamp-2 text-sm font-light text-gray-400">
                        {course.description || "System metadata missing"}
                      </p>
                      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-6">
                        <span className="rounded border border-white/10 bg-black px-2 py-1 font-mono text-xs text-gray-500">
                          {course.credits} UNIT
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-red-500 group-hover:text-red-400">
                          Connect
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </DashboardSection>

              {certificates.length > 0 && (
                <DashboardSection
                  title="Issued Credentials"
                  href="/certificates"
                  action="Vault"
                >
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 lg:gap-6">
                    {certificates.slice(0, 3).map((cert) => (
                      <Link
                        key={cert.id}
                        href={`/certificates/${cert.id}`}
                        className="group relative block min-w-0 overflow-hidden rounded-xl border border-red-500/20 bg-black p-6 shadow-[0_0_20px_rgba(220,38,38,0.05)] transition-all hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
                      >
                        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-red-900/10 transition-colors group-hover:bg-red-900/20"></div>
                        <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-zinc-950">
                            <Award className="h-6 w-6 text-red-500" />
                          </div>
                          <span className="rounded border border-white/10 bg-zinc-950 px-3 py-1 font-mono text-xs text-gray-400">
                            {new Date(cert.issuedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="mb-2 line-clamp-2 text-xl font-bold uppercase tracking-wide text-white group-hover:text-red-100">
                          {cert.course?.title || "Soroban Protocol"}
                        </h4>
                        <p className="text-sm font-light text-red-500/80">
                          On-Chain Certification
                        </p>
                      </Link>
                    ))}
                  </div>
                </DashboardSection>
              )}
            </section>

            <section className="min-w-0 2xl:pt-[13.5rem]">
              <div className="border-b border-white/10 pb-4">
                <h3 className="flex min-w-0 items-center gap-3 text-lg font-black uppercase tracking-widest text-white">
                  <span className="h-4 w-4 shrink-0 rounded-sm bg-red-600"></span>
                  <span className="truncate">Audit Trails</span>
                </h3>
                <span className="mt-3 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-500">
                  Live Monitoring
                </span>
              </div>
              <div className="mt-6 rounded-xl border border-white/5 bg-zinc-950/50 p-4 backdrop-blur-sm sm:p-6">
                <AuditLogList />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href: string;
  action: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h3 className="flex min-w-0 items-center gap-3 text-lg font-black uppercase tracking-widest text-white md:text-xl">
          <span className="h-4 w-4 shrink-0 rounded-sm bg-red-600"></span>
          <span className="truncate">{title}</span>
        </h3>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
        >
          {action}
          <ChevronRight size={16} />
        </Link>
      </div>
      {children}
    </section>
  );
}
