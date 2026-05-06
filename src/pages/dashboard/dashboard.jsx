import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, IconButton } from "@mui/material";
import {
  Lock as LockIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
  Place as PlaceIcon,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import "./dashboard.css";

import LogoImg from "../../assets/logo_image.png";
import EmblemImg from "../../assets/emblem_india.png";
import GsqacLogoImg from "../../assets/gsqac_logo.png";
import HeroBgImg from "../../assets/students_image.jpeg";
import StudentCarouselImg from "../../assets/student_carousel.png";
import dashboardStudent from "../../assets/dashboard_image.jpeg";

const STATS = [
  {
    value: "53,000+",
    label: "Schools Registered",
    icon: SchoolIcon,
    tone: "orange",
  },
  {
    value: "1.2cr+",
    label: "Students Covered",
    icon: PeopleIcon,
    tone: "blue",
  },
  { value: "33", label: "Districts", icon: PlaceIcon, tone: "blue" },
  {
    value: "53,000+",
    label: "To be Accredited Schools",
    icon: EmojiEventsIcon,
    tone: "orange",
  },
];

const CAROUSEL_INTERVAL_MS = 4500;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, role } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const heroCarouselSlides = useMemo(
    () => [
      {
        src: dashboardStudent,
        alt: "Students in a quality classroom setting",
      },
      {
        src: HeroBgImg,
        alt: "School learning and classroom activity",
      },
      {
        src: dashboardStudent,
        alt: "Engaged learners in Gujarat schools",
      },
    ],
    [],
  );

  useEffect(() => {
    const isAuthenticated = !!(user && token);
    if (isAuthenticated && role) {
      const dashboardRoutes = {
        school: "/school-dashboard",
        parent: "/parent-dashboard",
        inspector: "/inspector-dashboard",
        admin: "/admin-dashboard",
        crc: "/crc-dashboard",
      };
      const dashboardRoute = dashboardRoutes[role];
      if (dashboardRoute) navigate(dashboardRoute, { replace: true });
    }
  }, [user, token, role, navigate]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (heroCarouselSlides.length <= 1) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % heroCarouselSlides.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [heroCarouselSlides.length]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const goCarouselPrev = () => {
    setCarouselIndex((i) => (i === 0 ? heroCarouselSlides.length - 1 : i - 1));
  };

  const goCarouselNext = () => {
    setCarouselIndex((i) => (i + 1) % heroCarouselSlides.length);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="logo-section">
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
          </div>

          <div className="header-right">
            <nav className="header-nav" aria-label="Primary">
              <a href="#" className="nav-link">
                Home
              </a>
              <a href="#" className="nav-link">
                Schools
              </a>
              <a href="#" className="nav-link">
                About
              </a>
              <a href="#" className="nav-link">
                Grievance
              </a>
            </nav>

            <Button
              variant="contained"
              startIcon={<LockIcon />}
              onClick={() => navigate("/login")}
              className="header-login-btn"
            >
              Login
            </Button>

            <IconButton
              className="mobile-toggle"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? "is-open" : ""}`}
        onClick={closeMobileMenu}
        onKeyDown={(e) => e.key === "Escape" && closeMobileMenu()}
        role="presentation"
        aria-hidden={!mobileMenuOpen}
      />
      <aside
        className={`mobile-nav-panel ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-nav-head">
          <span className="mobile-nav-title">Menu</span>
          <IconButton aria-label="Close menu" onClick={closeMobileMenu}>
            <CloseIcon />
          </IconButton>
        </div>
        <nav className="mobile-nav-links">
          {["Home", "Schools", "About", "Grievance"].map((label) => (
            <a
              key={label}
              href="#"
              className="mobile-nav-link"
              onClick={closeMobileMenu}
            >
              {label}
            </a>
          ))}
          <Button
            fullWidth
            variant="contained"
            startIcon={<LockIcon />}
            className="mobile-nav-login"
            onClick={() => {
              closeMobileMenu();
              navigate("/login");
            }}
          >
            Login
          </Button>
        </nav>
      </aside>

      <section
        className="hero-section"
        style={{ backgroundImage: `url(${HeroBgImg})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-split">
            <div className="hero-split-col hero-split-col--carousel">
              <div
                className="hero-carousel-shell"
                role="region"
                aria-roledescription="carousel"
                aria-label="School quality imagery"
              >
                <div className="hero-carousel-frame">
                  <button
                    type="button"
                    className="hero-carousel-nav hero-carousel-nav--prev"
                    aria-label="Previous slide"
                    onClick={goCarouselPrev}
                  >
                    <ChevronLeftIcon />
                  </button>
                  <div className="hero-carousel-viewport">
                    {heroCarouselSlides.map((slide, i) => (
                      <img
                        key={`${slide.src}-${i}`}
                        src={slide.src}
                        alt={slide.alt}
                        className={`hero-carousel-slide${i === carouselIndex ? " is-active" : ""}`}
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    ))}
                    <div className="hero-carousel-dots" aria-hidden>
                      {heroCarouselSlides.map((_, i) => (
                        <span
                          key={String(i)}
                          className={`hero-carousel-dot${i === carouselIndex ? " is-active" : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="hero-carousel-nav hero-carousel-nav--next"
                    aria-label="Next slide"
                    onClick={goCarouselNext}
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
                <p className="hero-carousel-caption">
                  <PeopleIcon
                    className="hero-carousel-caption-icon"
                    aria-hidden
                  />
                  <span>
                    Empowering schools. Enriching learning. Elevating quality
                    across Gujarat.
                  </span>
                </p>
              </div>
            </div>

            <div className="hero-split-col hero-split-col--copy">
              <div className="hero-copy">
                <p className="hero-drive-pill">
                  <StarIcon className="hero-drive-pill-star" aria-hidden />
                  Gujarat&apos;s school quality drive
                </p>
                <h1 className="hero-hero-title">
                  Gunotsav <span className="hero-hero-title-accent">2.0</span>
                </h1>
                <p className="hero-lede">
                  A statewide initiative to assess, assure and enhance the
                  quality of school education through data-driven insights,
                  accreditation and continuous improvement in context of
                  NEP-2020.
                </p>

                <div className="hero-mini-cards">
                  <article
                    className="hero-mini-card hero-mini-card--gsqac"
                    aria-label="GSQAC"
                  >
                    <EmojiEventsIcon
                      className="hero-mini-card-icon hero-mini-card-icon--gsqac"
                      aria-hidden
                    />
                    <p className="hero-mini-card-kicker">
                      Accreditation council
                    </p>
                    <h2 className="hero-mini-card-acronym">GSQAC</h2>
                    <p className="hero-mini-card-desc">
                      Gujarat State Quality Accreditation Council
                    </p>
                  </article>
                  <article
                    className="hero-mini-card hero-mini-card--sqaaf"
                    aria-label="SQAAF"
                  >
                    <ShieldIcon
                      className="hero-mini-card-icon hero-mini-card-icon--sqaaf"
                      aria-hidden
                    />
                    <h2 className="hero-mini-card-acronym">SQAAF</h2>
                    <p className="hero-mini-card-desc">
                      School Quality Assessment and Assurance Framework
                    </p>
                  </article>
                </div>

                <div className="hero-actions">
                  <button type="button" className="btn-main">
                    <SearchIcon fontSize="small" /> Find Schools
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => navigate("/login?role=school")}
                  >
                    School Login <SchoolIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section" aria-label="Key statistics">
        <div className="stats-section-inner">
          <div className="stats-grid">
            {STATS.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`stat-card stat-card--${stat.tone}`}
                >
                  <div className="stat-card-icon-wrap">
                    <StatIcon className="stat-card-icon" aria-hidden />
                  </div>
                  <div className="stat-card-text">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
