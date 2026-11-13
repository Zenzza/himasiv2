"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "@phosphor-icons/react";
import Footer from "@/components/footer";
import type { VotingSesi, VotingKandidat, VotingDPT } from "@/lib/types/voting";
import {
  fetchActiveVotingSession,
  fetchCandidates,
} from "@/lib/supabase/voting";
import VotingStepper, { type StepNumber } from "@/components/voting/voting-stepper";
import VotingHeroCountdown from "@/components/voting/voting-hero-countdown";
import VotingClosedBanner from "@/components/voting/voting-closed-banner";
import StepVerification from "@/components/voting/step-verification";
import StepBallot from "@/components/voting/step-ballot";
import StepConfirmation from "@/components/voting/step-confirmation";
import StepCompleted from "@/components/voting/step-completed";

const VOTER_SESSION_STORAGE_KEY = "himasi_evoting_student_session";

interface StoredVoterSession {
  sesiId: string;
  voter: VotingDPT;
  selectedKandidatId: string | null;
  step: StepNumber;
  receiptId?: string | null;
}

export default function VotingPage() {
  const [sesi, setSesi] = useState<VotingSesi | null>(null);
  const [candidates, setCandidates] = useState<VotingKandidat[]>([]);
  const [voter, setVoter] = useState<VotingDPT | null>(null);
  const [selectedKandidatId, setSelectedKandidatId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load of Active Session & Candidate List
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const activeSesi = await fetchActiveVotingSession();
        if (!isMounted) return;
        setSesi(activeSesi);

        if (activeSesi) {
          const candList = await fetchCandidates(activeSesi.id);
          if (!isMounted) return;
          setCandidates(candList);

          // Check if there is an existing verified session in sessionStorage
          if (typeof window !== "undefined") {
            try {
              const raw = sessionStorage.getItem(VOTER_SESSION_STORAGE_KEY);
              if (raw) {
                const parsed: StoredVoterSession = JSON.parse(raw);
                if (parsed.sesiId === activeSesi.id && parsed.voter) {
                  setVoter(parsed.voter);
                  setSelectedKandidatId(parsed.selectedKandidatId || null);
                  setReceiptId(parsed.receiptId || null);
                  if (parsed.step === 3 && !parsed.selectedKandidatId) {
                    setCurrentStep(2);
                  } else if (parsed.step >= 1 && parsed.step <= 4) {
                    setCurrentStep(parsed.step);
                  }
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (err) {
        console.error("[VotingPage] Gagal memuat sesi pemilihan:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to persist session
  const saveSession = useCallback(
    (
      newVoter: VotingDPT | null,
      newStep: StepNumber,
      kandidatId: string | null = null,
      rcptId: string | null = null
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
      };
      try {
        sessionStorage.setItem(VOTER_SESSION_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage errors
      }
    },
    [sesi]
  );

  // Handlers for step transitions
  const handleVerified = (verifiedVoter: VotingDPT) => {
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
    setCurrentStep(3);
    saveSession(voter, 3, selectedKandidatId, null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToBallot = () => {
    setCurrentStep(2);
    if (voter) {
      saveSession(voter, 2, selectedKandidatId, null);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleVoteSuccess = (newReceiptId: string) => {
    setReceiptId(newReceiptId);
    setSelectedKandidatId(null);
    setCurrentStep(4);
    if (voter) {
      // Clear selectedKandidatId from storage immediately to protect secret ballot
      saveSession(voter, 4, null, newReceiptId);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    setVoter(null);
    setSelectedKandidatId(null);
    setReceiptId(null);
    setCurrentStep(1);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(VOTER_SESSION_STORAGE_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const selectedCandidateObj = candidates.find((c) => c.id === selectedKandidatId);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#0094e0]/20 selection:text-[#00296E] relative overflow-x-hidden">
      {/* Main Wrapper with generous gap from sticky Navbar */}
      <div className="flex-1 w-full relative z-10 flex flex-col pt-8 sm:pt-12">
        {/* Top Stepper Bar (Visible when session is active, hidden on print) */}
        {sesi && sesi.status === "open" && (
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
          ) : !sesi || sesi.status !== "open" ? (
            /* Closed / Inactive Session State */
            <VotingClosedBanner sesi={sesi} />
          ) : (
            /* Active Wizard Steps */
            <div>
              {/* STEP 1: VERIFIKASI IDENTITAS DPT (Split View matching mockup) */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-7">
                    <VotingHeroCountdown sesi={sesi} />
                  </div>
                  <div className="lg:col-span-5">
                    <StepVerification
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

              {/* STEP 4: TANDA TERIMA ELEKTRONIK RESMI */}
              {currentStep === 4 && voter && receiptId && (
                <StepCompleted
                  receiptId={receiptId}
                  voterName={voter.nama_lengkap}
                  voterNIM={voter.nim}
                  tahunPeriode={sesi.tahun_periode}
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
