import { useState, useCallback } from "react";

export function useAssessmentMobileLayout({
  matchDownMD,
  selectedDomain,
  selectedSubdomain,
  setSelectedSubdomain,
  setSelectedDomain,
  handleDomainSelect,
  handleSubdomainSelect,
  setAnswers,
  setTextAnswers,
}) {
  const [mobileStep, setMobileStep] = useState(0);

  const scrollMobileToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleMobileDomainSelect = (domain) => {
    const isSame = selectedDomain?.domainId === domain.domainId;
    if (isSame) {
      setMobileStep(1);
      scrollMobileToTop();
      return;
    }
    handleDomainSelect(domain);
    if (matchDownMD) {
      setMobileStep(1);
      scrollMobileToTop();
    }
  };

  const handleMobileSubdomainSelect = (subdomain) => {
    handleSubdomainSelect(subdomain);
    if (matchDownMD) {
      setMobileStep(2);
      scrollMobileToTop();
    }
  };

  const handleMobileStepChange = (step) => {
    if (step === 0) {
      setMobileStep(0);
      setSelectedSubdomain(null);
      scrollMobileToTop();
      return;
    }
    if (step === 1 && selectedDomain) {
      setMobileStep(1);
      setSelectedSubdomain(null);
      scrollMobileToTop();
      return;
    }
    if (step === 2 && selectedSubdomain) {
      setMobileStep(2);
      scrollMobileToTop();
    }
  };

  const handleMobileStepBack = () => {
    if (mobileStep === 2) {
      setSelectedSubdomain(null);
      setAnswers({});
      setTextAnswers({});
      setMobileStep(1);
      scrollMobileToTop();
      return;
    }
    if (mobileStep === 1) {
      setMobileStep(0);
      setSelectedDomain(null);
      setSelectedSubdomain(null);
      scrollMobileToTop();
    }
  };

  const showMobileNavigation = matchDownMD;
  const showMobileSubdomainsPanel =
    matchDownMD && mobileStep === 1 && !!selectedDomain;
  const showMobileQuestionsPanel =
    selectedSubdomain && (!matchDownMD || mobileStep === 2);
  const showMobileNavPanel =
    matchDownMD && (mobileStep === 0 || mobileStep === 1);

  return {
    mobileStep,
    showMobileNavigation,
    showMobileSubdomainsPanel,
    showMobileQuestionsPanel,
    showMobileNavPanel,
    handleMobileDomainSelect,
    handleMobileSubdomainSelect,
    handleMobileStepChange,
    handleMobileStepBack,
  };
}
