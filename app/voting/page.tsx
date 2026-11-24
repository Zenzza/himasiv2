"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Spinner } from "@phosphor-icons/react";
import Footer from "@/components/footer";
import { supabase } from "@/lib/supabase/client";
import type { VotingSesi, VotingKandidat, VotingDPT } from "@/lib/types/voting";
import {
  clearLegacyVotingLocalCache,
  fetchActiveVotingSessionStatus,
  fetchCandidates,
} from "@/lib/supabase/voting";
import { resolveVotingSyncTransition } from "@/lib/utils/voting-helpers";
import VotingStepper, { type StepNumber } from "@/components/voting/voting-stepper";
import VotingHeroCountdown from "@/components/voting/voting-hero-countdown";
import VotingClosedBanner from "@/components/voting/voting-closed-banner";
import StepVerification from "@/components/voting/step-verification";
import StepBallot from "@/components/voting/step-ballot";
import StepConfirmation from "@/components/voting/step-confirmation";
import StepCompleted from "@/components/voting/step-completed";

const VOTER_SESSION_STORAGE_KEY = "himasi_evoting_student_session";
const FALLBACK_POLL_INTERVAL_MS = 15000;

interface StoredVoterSession {
  sesiId: string;
  voter: VotingDPT;
  selectedKandidatId: string | null;
  step: StepNumber;
  receiptId?: string | null;
  tahunPeriode?: string;
}

export default function VotingPage() {
  const [sesi, setSesi] = useState<VotingSesi | null>(null);
  const [candidates, setCandidates] = useState<VotingKandidat[]>([]);
  const [voter, setVoter] = useState<VotingDPT | null>(null);
  const [selectedKandidatId, setSelectedKandidatId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [completedPeriode, setCompletedPeriode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Refs to prevent stale closures & coalesce overlapping Realtime/polling sync events
  const currentStepRef = useRef<StepNumber>(currentStep);
  const voterRef = useRef<VotingDPT | null>(voter);
  const receiptIdRef = useRef<string | null>(receiptId);
  const sesiIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isSyncingRef = useRef<boolean>(false);
  const pendingSyncRef = useRef<boolean>(false);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    voterRef.current = voter;
  }, [voter]);

  useEffect(() => {
    receiptIdRef.current = receiptId;
  }, [receiptId]);

  useEffect(() => {
    sesiIdRef.current = sesi?.id ?? null;
  }, [sesi]);

  // Clear voter progress in Step 1–3 when session closes or switches
  const resetIncompleteVoterSession = useCallback(() => {
    voterRef.current = null;
    receiptIdRef.current = null;
    currentStepRef.current = 1;
    setVoter(null);
    setSelectedKandidatId(null);
    setReceiptId(null);
    setCurrentStep(1);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(VOTER_SESSION_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  // Synchronize active voting session strictly from Supabase
  const syncActiveSession = useCallback(
    async (isInitialLoad = false) => {
      // If voter is already viewing Step 4 receipt, skip unnecessary background fetches
      if (
        !isInitialLoad &&
        currentStepRef.current === 4 &&
        Boolean(voterRef.current) &&
        Boolean(receiptIdRef.current)
      ) {
        return;
      }

      // Coalesce Realtime/focus events arriving mid-flight instead of dropping them
      if (isSyncingRef.current) {
        pendingSyncRef.current = true;
        return;
      }

      isSyncingRef.current = true;

      try {
        const fetchResult = await fetchActiveVotingSessionStatus();
        if (!isMountedRef.current) return;

        const decision = resolveVotingSyncTransition({
          currentStep: currentStepRef.current,
          hasVoter: Boolean(voterRef.current),
          hasReceipt: Boolean(receiptIdRef.current),
          currentSesiId: sesiIdRef.current,
          isInitialLoad,
          fetchResult,
        });

        if (decision.action === "preserve_completed") {
          setSesi(decision.session);
          return;
        }

        if (decision.action === "keep_current_on_network_error") {
          return;
        }

        if (decision.action === "close_and_reset") {
          sesiIdRef.current = null;
          setSesi(null);
          setCandidates([]);
          resetIncompleteVoterSession();
          return;
        }

        if (decision.action === "update_metadata_only") {
          setSesi(decision.session);
          return;
        }

        // decision.action === "load_session"
        const activeSesi = decision.session;
        const candList = await fetchCandidates(activeSesi.id);
        if (!isMountedRef.current) return;

        // Re-check Step 4 after awaiting fetchCandidates to avoid wiping a receipt completed mid-flight
        if (
          currentStepRef.current === 4 &&
          Boolean(voterRef.current) &&
          Boolean(receiptIdRef.current)
        ) {
          setSesi(activeSesi);
          return;
        }

        sesiIdRef.current = activeSesi.id;
        setSesi(activeSesi);
        setCandidates(candList);

        if (isInitialLoad && typeof window !== "undefined") {
          try {
            const raw = sessionStorage.getItem(VOTER_SESSION_STORAGE_KEY);
            if (raw) {
              const parsed: StoredVoterSession = JSON.parse(raw);
              if (parsed.sesiId === activeSesi.id && parsed.voter) {
                voterRef.current = parsed.voter;
                setVoter(parsed.voter);
                const validSelected =
                  parsed.selectedKandidatId &&
                  candList.some((c) => c.id === parsed.selectedKandidatId)
                    ? parsed.selectedKandidatId
                    : null;
                setSelectedKandidatId(validSelected);
                receiptIdRef.current = parsed.receiptId || null;
                setReceiptId(parsed.receiptId || null);
                setCompletedPeriode(parsed.tahunPeriode || activeSesi.tahun_periode);

                let restoredStep: StepNumber = 1;
                if (parsed.step === 4 && parsed.receiptId) {
                  restoredStep = 4;
                } else if (parsed.step === 3 && validSelected) {
                  restoredStep = 3;
                } else if (parsed.step >= 2) {
                  restoredStep = 2;
                }
                currentStepRef.current = restoredStep;
                setCurrentStep(restoredStep);
              } else {
                sessionStorage.removeItem(VOTER_SESSION_STORAGE_KEY);
              }
            }
          } catch {
            // Ignore parse errors
          }
        } else if (decision.resetIncompleteVoter) {
          resetIncompleteVoterSession();
        }
      } catch (err) {
        console.error("[VotingPage] Gagal menyinkronkan sesi pemilihan:", err);
      } finally {
        isSyncingRef.current = false;
        if (isInitialLoad && isMountedRef.current) {
          setIsLoading(false);
        }
        if (pendingSyncRef.current && isMountedRef.current) {
          pendingSyncRef.current = false;
          void syncActiveSession(false);
        }
      }
    },
    [resetIncompleteVoterSession]
  );

  // 1. Initial Load + Hybrid Realtime (Supabase Realtime + visibilitychange/focus + fallback polling)
  useEffect(() => {
    isMountedRef.current = true;

    // Immediately purge any legacy himasi_evoting_* localStorage keys from older builds
    clearLegacyVotingLocalCache();

    void syncActiveSession(true);

    // A. Supabase Realtime subscription on public.voting_sesi
    const realtimeChannel = supabase
      ? supabase
          .channel("voting-sesi-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "voting_sesi",
            },
            () => {
              void syncActiveSession(false);
            }
          )
          .subscribe()
      : null;

    // B. Revalidate immediately when tab becomes visible or window regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncActiveSession(false);
      }
    };
    const handleFocus = () => {
      void syncActiveSession(false);
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }

    // C. Lightweight fallback polling in case mobile WebSocket drops
    const pollInterval =
      typeof window !== "undefined"
        ? window.setInterval(() => {
            if (currentStepRef.current !== 4) {
              void syncActiveSession(false);
            }
          }, FALLBACK_POLL_INTERVAL_MS)
        : null;

    return () => {
      isMountedRef.current = false;
      pendingSyncRef.current = false;
      if (realtimeChannel && supabase) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch {
          // Ignore cleanup errors
        }
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
        if (pollInterval !== null) {
          window.clearInterval(pollInterval);
        }
      }
    };
  }, [syncActiveSession]);

  // Helper to persist session in tab-scoped sessionStorage
  const saveSession = useCallback(
    (
      newVoter: VotingDPT | null,
      newStep: StepNumber,
      kandidatId: string | null = null,
      rcptId: string | null = null,
      periodeOverride?: string
    ) => {
      if (typeof window === "undefined" || !sesi) return;
      if (!newVoter) {
        sessionStorage.removeItem(VOTER_SESSION_STORAGE_KEY);
        return;
      }

      const payload: StoredVoterSession = {
        sesiId: sesi.id,
        voter: newVoter,
        selectedKandidatId: kandidatId,
        step: newStep,
        receiptId: rcptId,
        tahunPeriode: periodeOverride || sesi.tahun_periode,
      };
      try {
        sessionStorage.setItem(VOTER_SESSION_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage errors
      }
    },
    [sesi]
  );

  // Handlers for step transitions (synchronous ref updates prevent microtask race windows)
  const handleVerified = (verifiedVoter: VotingDPT) => {
    voterRef.current = verifiedVoter;
    currentStepRef.current = 2;
    setVoter(verifiedVoter);
    setCurrentStep(2);
    saveSession(verifiedVoter, 2, selectedKandidatId, null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectCandidate = (candId: string) => {
    setSelectedKandidatId(candId);
    if (voter) {
      saveSession(voter, currentStep, candId, receiptId);
    }
  };

  const handleProceedToConfirmation = () => {
    if (!selectedKandidatId || !voter) return;
    currentStepRef.current = 3;
    setCurrentStep(3);
    saveSession(voter, 3, selectedKandidatId, null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToBallot = () => {
    currentStepRef.current = 2;
    setCurrentStep(2);
    if (voter) {
      saveSession(voter, 2, selectedKandidatId, null);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleVoteSuccess = (newReceiptId: string) => {
    const periode = sesi?.tahun_periode || completedPeriode;
    receiptIdRef.current = newReceiptId;
    currentStepRef.current = 4;
    setCompletedPeriode(periode);
    setReceiptId(newReceiptId);
    setSelectedKandidatId(null);
    setCurrentStep(4);
    if (voter) {
      // Clear selectedKandidatId from storage immediately to protect secret ballot
      saveSession(voter, 4, null, newReceiptId, periode);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    resetIncompleteVoterSession();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const selectedCandidateObj = candidates.find((c) => c.id === selectedKandidatId);
  const isStep4Completed = currentStep === 4 && Boolean(voter) && Boolean(receiptId);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#0094e0]/20 selection:text-[#00296E] relative overflow-x-hidden">
      {/* Main Wrapper with generous gap from sticky Navbar */}
      <div className="flex-1 w-full relative z-10 flex flex-col pt-8 sm:pt-12">
        {/* Top Stepper Bar (Visible when session is active or voter is viewing Step 4 receipt) */}
        {(isStep4Completed || (sesi && sesi.status === "open")) && (
          <div className="print:hidden mb-6 sm:mb-8">
            <VotingStepper currentStep={currentStep} />
          </div>
        )}

        {/* Content Container */}
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 flex-1 font-poppins">
          {isLoading ? (
            /* Loading State */
            <div className="py-24 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#0094e0] shadow-sm">
                <Spinner className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs sm:text-sm font-mono text-slate-600 uppercase tracking-wider">
                Menghubungkan ke Bilik Suara E-Voting...
              </p>
            </div>
          ) : isStep4Completed && voter && receiptId ? (
            /* STEP 4: TANDA TERIMA ELEKTRONIK RESMI (Preserved even if session closes/deletes) */
            <StepCompleted
              receiptId={receiptId}
              voterName={voter.nama_lengkap}
              voterNIM={voter.nim}
              tahunPeriode={completedPeriode || sesi?.tahun_periode || ""}
            />
          ) : !sesi || sesi.status !== "open" ? (
            /* Closed / Inactive Session State */
            <VotingClosedBanner sesi={sesi} />
          ) : (
            /* Active Wizard Steps (Step 1–3) */
            <div>
              {/* STEP 1: VERIFIKASI IDENTITAS DPT (Split View matching mockup) */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-7">
                    <VotingHeroCountdown sesi={sesi} />
                  </div>
                  <div className="lg:col-span-5">
                    <StepVerification
                      key={sesi.id}
                      sesiId={sesi.id}
                      onVerified={handleVerified}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: BILIK SURAT SUARA (Candidate Selection Grid) */}
              {currentStep === 2 && voter && (
                <StepBallot
                  kandidatList={candidates}
                  voter={voter}
                  selectedKandidatId={selectedKandidatId}
                  onSelect={handleSelectCandidate}
                  onProceed={handleProceedToConfirmation}
                  onLogout={handleLogout}
                />
              )}

              {/* STEP 3: KONFIRMASI SURAT SUARA */}
              {currentStep === 3 && voter && selectedCandidateObj && (
                <StepConfirmation
                  selectedKandidat={selectedCandidateObj}
                  voter={voter}
                  sesiId={sesi.id}
                  onBack={handleBackToBallot}
                  onSuccess={handleVoteSuccess}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global HIMASI Footer (Print Hidden) */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
