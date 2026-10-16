"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useGame } from "@/context/GameContext";
import DifficultySlider from "@/components/DifficultySlider";
import ScrollDownReveal from "@/components/ScrollDownReveal";
import {
    Skull,
    Search,
    MessageCircle,
    Gavel,
    Fingerprint,
    AlertTriangle,
    ShieldCheck,
    BadgeAlert,
    CheckCircle2,
    Loader2,
    ArrowRight,
    FolderOpen,
    FileText,
} from "lucide-react";
import { DIFFICULTY_CONFIGS, type Difficulty } from "@/types/case";

const PROTOCOL_STEPS = [
    {
        step: "01",
        title: "Crime Scene Setup",
        desc: "A fresh crime report is generated with the victim details, cause of death, murder weapon, and scene description.",
        icon: <Search className="w-5 h-5 text-amber-400" />,
    },
    {
        step: "02",
        title: "Examine Evidence",
        desc: "Inspect your clue notebook. Every clue contains physical traces, locations, or items left behind during the struggle.",
        icon: <Fingerprint className="w-5 h-5 text-amber-400" />,
    },
    {
        step: "03",
        title: "Interrogate Suspects",
        desc: "You have a strict shared question limit. Grill suspects individually on their claimed alibis, motives, and whereabouts.",
        icon: <MessageCircle className="w-5 h-5 text-amber-400" />,
    },
    {
        step: "04",
        title: "File Indictment",
        desc: "Submit your final accusation: name the killer, specify the weapon, and explain the evidence. The judge renders the verdict.",
        icon: <Gavel className="w-5 h-5 text-amber-400" />,
    },
];

const FIELD_RULES = [
    {
        title: "1. The Question Limit Is Shared",
        desc: "Your questions are tracked as a single combined pool across all suspects. Asking one suspect four questions leaves fewer questions for the others. Don't waste inquiries on trivialities.",
    },
    {
        title: "2. Exactly One Killer and One Weapon",
        desc: "Every case is generated with strict consistency: exactly one suspect committed the crime and has an alibi with a logical contradiction. The remaining suspects are innocent.",
    },
    {
        title: "3. Red Herrings on Higher Difficulties",
        desc: "On Hard and Noir levels, innocent suspects will also appear suspicious, abrasive, or secretive to test your judgment. Having a motive or an attitude does not prove they are the killer.",
    },
    {
        title: "4. The Three-Part Conviction Test",
        desc: "To win the case, you must correctly choose the suspect, name the murder weapon, and summarize how the evidence connects them. The judge evaluates all three components.",
    },
    {
        title: "5. Early Accusation Is Permitted",
        desc: "If you spot an incontrovertible contradiction after just a few questions, you can file your accusation immediately without having to use up your remaining question count.",
    },
];

export default function LandingPage() {
    const { state, dispatch, generateCase } = useGame();
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(state.difficulty || "medium");
    const router = useRouter();
    const reduceMotion = useReducedMotion();

    const hasActiveCase = state.isHydrated && Boolean(state.activeCase && !state.verdict);

    // Window scroll progress indicator
    const { scrollYProgress } = useScroll();
    const scrollBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
    const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, 45]);

    const handleDifficultyChange = (diff: Difficulty) => {
        setSelectedDifficulty(diff);
        dispatch({ type: "SET_DIFFICULTY", payload: diff });
    };

    const handleLaunchCase = async () => {
        await generateCase(selectedDifficulty);
        router.push("/game");
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative dossier-grid selection:bg-amber-600/35 selection:text-amber-100 overflow-x-hidden">
            {/* Top Scrubber / Timeline Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-900/80">
                <motion.div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                    style={{ width: reduceMotion ? "100%" : scrollBarWidth }}
                />
            </div>

            {/* Top Sticky Header with Direct "Start Case" or "Return to Case" Action */}
            <header className="fixed left-0 right-0 top-0 z-40 backdrop-blur-md bg-zinc-950/90 border-b border-zinc-800 px-4 sm:px-6 py-3 transition-colors">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800/80 flex items-center justify-center shrink-0">
                            <Skull className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <span className="font-mono text-sm sm:text-base font-black tracking-wider text-zinc-100 uppercase">
                                Noir Casefile
                            </span>
                            <span className="hidden sm:inline-block ml-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
                                · AI Murder Mystery
                            </span>
                        </div>
                    </div>

                    {hasActiveCase ? (
                        <button
                            onClick={() => router.push("/game")}
                            className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ring-1 ring-amber-400/40"
                        >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-200" />
                            <span>Return to Case</span>
                            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                        </button>
                    ) : (
                        <button
                            onClick={handleLaunchCase}
                            disabled={state.isLoading}
                            className="bg-amber-700 hover:bg-amber-600 active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {state.isLoading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Starting...</span>
                                </>
                            ) : (
                                <>
                                    <Skull className="w-3.5 h-3.5 text-amber-200" />
                                    <span>Start Case</span>
                                    <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* ─────────────────────────────────────────────────────────────
          HERO & INVESTIGATION LAUNCHPAD (Slider + Start Case Together)
         ───────────────────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 pt-20 sm:pt-24 pb-14 sm:pb-20 max-w-5xl mx-auto w-full border-b border-zinc-800/80 relative">
                {/* Ambient Parallax Light behind Hero */}
                <motion.div
                    style={{ y: reduceMotion ? 0 : heroParallax }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[350px] bg-amber-950/20 rounded-full blur-[90px] sm:blur-[110px] pointer-events-none -z-10"
                />

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-6 sm:mb-8"
                >
                    <div className="inline-block border border-amber-800/80 bg-amber-950/40 text-amber-300 font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-3 sm:mb-4">
                        Unsolved Homicide Dossier
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-amber-100 leading-[1.08] mb-3 sm:mb-4">
                        SOLVE THE MURDER.
                        <br />
                        <span className="text-zinc-300 font-serif italic font-normal">
                            Find the crack in the alibi.
                        </span>
                    </h1>

                    <p className="text-zinc-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed px-2">
                        Every case generates a unique crime scene, clues, and suspects with full alibis. Exactly one
                        suspect is the killer. Interrogate them and bring formal charges before your question budget
                        expires.
                    </p>
                </motion.div>

                {/* Error Notification */}
                {state.error && (
                    <div className="mb-6 bg-red-950/60 border border-red-800 text-red-200 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm max-w-md mx-auto flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                        <span>{state.error}</span>
                    </div>
                )}

                {/* Active Case Banner if player has an ongoing investigation */}
                {hasActiveCase && state.activeCase && (
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 bg-gradient-to-r from-amber-950/50 via-zinc-900 to-zinc-900 border border-amber-700/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-600/70 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                                <FolderOpen className="w-5 h-5 text-amber-300" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                                        Investigation in Progress
                                    </span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800 uppercase">
                                        {DIFFICULTY_CONFIGS[state.difficulty]?.label || state.difficulty}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate mt-0.5">
                                    {state.activeCase.title}
                                </h3>
                                <p className="text-xs text-zinc-300 font-mono mt-0.5">
                                    Victim: <span className="text-zinc-200">{state.activeCase.victim.name}</span> · <span className="text-amber-400 font-bold">{state.questionsRemaining}</span> Qs remaining
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push("/game")}
                            className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center shrink-0 ring-1 ring-amber-400/40"
                        >
                            <span>Return to Case</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* The Difficulty Slider & Case Launcher */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="mt-3 sm:mt-4"
                >
                    <DifficultySlider
                        difficulty={selectedDifficulty}
                        onChange={handleDifficultyChange}
                        onLaunch={handleLaunchCase}
                        onResume={() => router.push("/game")}
                        hasActiveCase={hasActiveCase}
                        isLoading={state.isLoading}
                    />
                </motion.div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          HOW IT WORKS (Scroll-Down-Only Protocol Cards)
         ───────────────────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 py-14 sm:py-20 max-w-5xl mx-auto w-full border-b border-zinc-800/80">
                <ScrollDownReveal className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-2 block">
                        Investigation Protocol
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-100">
                        Four Steps to a Conviction
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-2">
                        The standard procedure for every homicide file in the city.
                    </p>
                </ScrollDownReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {PROTOCOL_STEPS.map((item, idx) => (
                        <ScrollDownReveal key={item.step} delay={idx * 0.08} className="h-full">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-600/50 flex flex-col justify-between shadow-lg h-full">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-mono text-lg font-black text-amber-500">{item.step}</span>
                                        <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-100 mb-1.5 sm:mb-2">{item.title}</h3>
                                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        </ScrollDownReveal>
                    ))}
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          INTERROGATION PSYCHOLOGY (Scroll-Down-Only Dynamics)
         ───────────────────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 py-14 sm:py-20 max-w-5xl mx-auto w-full border-b border-zinc-800/80">
                <ScrollDownReveal className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-2 block">
                        Interrogation Dynamics
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-100">
                        How Suspects Respond
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-2">
                        Responses are kept short and hardboiled (1–2 sentences). Notice how guilty vs. innocent behavior
                        differs under questioning.
                    </p>
                </ScrollDownReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Card A: Innocent Suspect */}
                    <ScrollDownReveal direction="left" delay={0.05} className="h-full">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700 h-full">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span className="font-mono text-sm font-bold text-zinc-100">Innocent Person</span>
                                </div>
                                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    Verifiable Alibi
                                </span>
                            </div>

                            <div className="space-y-3 font-mono text-xs sm:text-sm">
                                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 sm:p-3.5">
                                    <span className="text-amber-400 font-bold block mb-1">
                                        Detective: &quot;Where were you when the murder took place?&quot;
                                    </span>
                                    <span className="text-zinc-200 italic">
                                        &quot;I was in the cellar doing inventory with the night manager. Check the
                                        delivery log on the front desk.&quot;
                                    </span>
                                </div>

                                <div className="text-zinc-200 text-xs sm:text-sm leading-relaxed space-y-1 pt-1 font-sans">
                                    <p>• Statements remain consistent when questioned repeatedly.</p>
                                    <p>• Readily provides specific names, places, and witnesses.</p>
                                    <p>• May express natural grief, surprise, or irritation.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollDownReveal>

                    {/* Card B: The Killer */}
                    <ScrollDownReveal direction="right" delay={0.1} className="h-full">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700 h-full">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <BadgeAlert className="w-5 h-5 text-red-400 shrink-0" />
                                    <span className="font-mono text-sm font-bold text-zinc-100">The Actual Killer</span>
                                </div>
                                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                                    Flawed Alibi
                                </span>
                            </div>

                            <div className="space-y-3 font-mono text-xs sm:text-sm">
                                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 sm:p-3.5">
                                    <span className="text-amber-400 font-bold block mb-1">
                                        Detective: &quot;A piece of your velvet cape was found near the body.&quot;
                                    </span>
                                    <span className="text-zinc-200 italic">
                                        &quot;I haven&apos;t worn that coat in weeks. Ask Marcus about his gambling
                                        debts instead of hounding me.&quot;
                                    </span>
                                </div>

                                <div className="text-zinc-200 text-xs sm:text-sm leading-relaxed space-y-1 pt-1 font-sans">
                                    <p>• Deflects scrutiny toward other suspects.</p>
                                    <p>• Becomes evasive when pressed on physical clues.</p>
                                    <p>• Contains subtle timing cracks that contradict evidence.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollDownReveal>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          FIELD MANUAL (Scroll-Down-Only Rules)
         ───────────────────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 py-14 sm:py-20 max-w-4xl mx-auto w-full border-b border-zinc-800/80">
                <ScrollDownReveal className="text-center max-w-xl mx-auto mb-10">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-2 block">
                        Rules of Engagement
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-100">
                        Detective Field Manual
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-2">
                        Read these guidelines before opening your first case file.
                    </p>
                </ScrollDownReveal>

                <div className="space-y-3.5">
                    {FIELD_RULES.map((rule, idx) => (
                        <ScrollDownReveal key={idx} delay={idx * 0.05}>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-700 transition-colors">
                                <h3 className="text-sm sm:text-base font-bold text-amber-200 mb-1.5 font-mono flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    {rule.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed pl-6 font-sans">
                                    {rule.desc}
                                </p>
                            </div>
                        </ScrollDownReveal>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 sm:px-6 text-center text-xs font-mono text-zinc-300 bg-zinc-950">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>Noir Casefile — Procedural Murder Mystery Game</div>
                    <div className="text-zinc-400">
                        Every case is procedurally generated with full alibi consistency.
                    </div>
                </div>
            </footer>
        </div>
    );
}
