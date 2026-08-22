import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, CircularProgress, IconButton } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";
import { GrievanceFeedbackPanel } from "./components/GrievanceFeedbackPanel";
import { FaqChatAssistant } from "./components/faq-assistant/FaqChatAssistant";
import { generateGrievanceFormPdf } from "./utils/generateGrievanceFormPdf";
import "./dashboard.css";

import LogoImg from "../../assets/logo_image.png";
import EmblemImg from "../../assets/emblem_india.png";
import GsqacLogoImg from "../../assets/gsqac_new_logo.png";

const HARDCOPY_NOTE =
  "આપની રજૂઆત માટે સૌ પ્રથમ હાર્ડકોપીમાં ફોર્મ ડાઉનલોડ કરી અને ભરી ને રાખશો. જેથી ઓનલાઇન ભરતી વખતે સરળતા રહે";

const GrievancePage = () => {
  const navigate = useNavigate();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    setDownloadError("");
    try {
      await generateGrievanceFormPdf();
    } catch {
      setDownloadError("PDF ડાઉનલોડ થઈ શક્યું નહીં. ફરી પ્રયાસ કરો.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="dashboard-container grievance-page">
      <header className="dashboard-header">
        <div className="header-inner">
          <button
            type="button"
            className="logo-section grievance-page__brand"
            onClick={() => navigate("/")}
            aria-label="Go to home"
          >
            <img
              src={EmblemImg}
              alt="State Emblem of India"
              className="header-emblem-img"
            />
            <img src={LogoImg} alt="GCERT Logo" className="main-logo-img" />
            <img
              src={GsqacLogoImg}
              alt="Gujarat School Quality Assurance Council (GSQAC)"
              className="header-gsqac-logo"
            />
          </button>

          <div className="header-right">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/")}
              className="grievance-page__home-btn"
            >
              Home
            </Button>
            <Button
              variant="contained"
              startIcon={<LockIcon />}
              onClick={() => navigate("/login")}
              className="header-login-btn"
            >
              Login
            </Button>
            <IconButton
              className="mobile-login-btn"
              aria-label="Login"
              onClick={() => navigate("/login")}
            >
              <LockIcon />
            </IconButton>
          </div>
        </div>
      </header>

      <section className="grievance-section" aria-label="રજૂઆત / ફીડબેક">
        <div className="grievance-section-inner">
          <div className="grievance-section-head">
            <h1 className="grievance-title">રજૂઆત / ફીડબેક</h1>
            <p className="grievance-lede">
              શાળાનું નામ, મુખ્યક્ષેત્ર, પેટાક્ષેત્ર અને માપદંડ પસંદ કરીને તમારી
              રજૂઆતની જરૂરી વિગતો ભરી સબમિટ કરો.
            </p>
          </div>

          <aside className="grievance-hardcopy-note" aria-label="હાર્ડકોપી નોંધ">
            <p>{HARDCOPY_NOTE}</p>
            <button
              type="button"
              className="grievance-btn grievance-btn--pdf"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PictureAsPdfIcon fontSize="small" />
              )}
              ફોર્મ ડાઉનલોડ કરો (A4 PDF)
            </button>
            {downloadError ? (
              <small className="grievance-hardcopy-note__error">{downloadError}</small>
            ) : null}
          </aside>

          <div className="grievance-panel">
            <div className="grievance-tab-panel">
              <GrievanceFeedbackPanel feedbackSource="grievance" />
            </div>
          </div>
        </div>
      </section>

      <FaqChatAssistant />
    </div>
  );
};

export default GrievancePage;
