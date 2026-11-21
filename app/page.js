
import Image from "next/image";
import Link from "next/link";
import Navbar from "./component/Navbar";

const features = [
  {
    image: "/card1.gif",
    alt: "Task clarity",
    title: "COMPLETE CLARITY",
    description:
      "Instantly visualize your task status and team progress.",
  },
  {
    image: "/card2.gif",
    alt: "Task organization",
    title: "EFFORTLESS ORGANIZATION",
    description:
      "Create, assign, and prioritize tasks with ease.",
  },
  {
    image: "/card3.gif",
    alt: "Team collaboration",
    title: "SEAMLESS COLLABORATION",
    description:
      "Real-time updates and integrated commenting.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white">

      <Navbar />

      {/* Hero Section */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-32 sm:px-8 sm:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-10 lg:pb-24 lg:pt-40">

        {/* Left Content */}
        <div className="flex min-w-0 flex-col gap-6">

          <div className="space-y-5">

        

            <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl">
              Work Smarter,
              <br />
              Not Harder.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Achieve Flow
              </span>{" "}
              with TaskFlow.
            </h1>

            <p className="max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Centralize tasks, track progress, and boost collaboration
              in one powerful, intuitive platform. Join thousands of
              high-performing teams.
            </p>

          </div>

          {/* Main CTA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            <Link
              href="/dashboard"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 sm:w-fit"
            >
              Start Your Free Trial

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

          </div>

          {/* Feature Cards */}
          <div
            id="features"
            className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3"
          >

            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-row items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 sm:flex-col sm:items-start sm:p-4"
              >

                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl p-2 sm:h-20 sm:w-20">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    width={100}
                    height={100}
                    unoptimized
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110 mix-blend-multiply"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-extrabold tracking-wide text-slate-800">
                    {feature.title}
                  </h2>

                  <p className="text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Right Content */}
        <div className="flex min-w-0 flex-col gap-5">

          {/* Hero Image */}
          <div className="relative w-full overflow-hidden rounded-3xl border border-blue-100/70 bg-gradient-to-br from-blue-50 to-cyan-50 p-2 shadow-xl shadow-blue-900/5 sm:p-4">

            <Image
              src="/hero.png"
              alt="TaskFlow project and task management dashboard"
              width={1000}
              height={750}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-auto w-full rounded-2xl object-contain"
            />

          </div>

          {/* Sponsor Logos */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Built for modern productivity
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">

              <div className="relative h-10 w-24 sm:h-12 sm:w-28">
                <Image
                  src="/sponserlogo1.jpg"
                  alt="Partner logo 1"
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>

              <div className="relative h-10 w-24 sm:h-12 sm:w-28">
                <Image
                  src="/sponserlogo2.jpg"
                  alt="Partner logo 2"
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>

              <div className="relative h-10 w-24 sm:h-12 sm:w-28">
                <Image
                  src="/sponserlogo34.jpg"
                  alt="Partner logo 3"
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>

            </div>

            <div className="border-t border-slate-100 pt-4">

              <p className="text-center text-sm font-medium italic leading-7 text-slate-600 sm:text-base">
                "TaskFlow transformed our product team's productivity.
                It's clean, powerful, and essential."
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Bottom CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8 lg:px-10 lg:pb-16">

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 px-6 py-12 shadow-xl shadow-blue-950/10 sm:px-10 sm:py-14 lg:px-16">

          {/* Decorative Background */}
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative flex flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-left">

            <div className="max-w-2xl space-y-3">

              <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                Ready to unlock your team's potential?
              </h2>

              <p className="text-sm leading-6 text-blue-100/80 sm:text-base">
                Bring your projects, tasks, and team together.
                Start organizing your work with TaskFlow.
              </p>

            </div>

            <Link
              href="/dashboard"
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 sm:w-fit sm:text-base"
            >
              Join For Free
              <span>→</span>
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}
