import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  SmartToy as SmartToyIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { FAQ_CATEGORIES } from "../../data/sqaafFaqData";
import "./FaqChatAssistant.css";

const WELCOME_TEXT =
  "નમસ્તે! હું SQAAF FAQ સહાયક છું. નીચેની કેટેગરી પસંદ કરો અને પ્રશ્ન પસંદ કરી જવાબ મેળવો.\n\nHello! I’m the SQAAF FAQ assistant. Pick a category, then a question to get the answer.";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function TypingDots() {
  return (
    <span className="faq-chat-typing" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

export function FaqChatAssistant() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("categories"); // categories | questions
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: WELCOME_TEXT,
      complete: true,
    },
  ]);
  const [typingId, setTypingId] = useState(null);
  const [pulse, setPulse] = useState(true);

  const panelRef = useRef(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);

  const activeCategory = useMemo(
    () => FAQ_CATEGORIES.find((c) => c.id === activeCategoryId) || null,
    [activeCategoryId],
  );

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingId, open, scrollToBottom]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const stopTyping = () => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  const typeAnswer = useCallback(
    (messageId, fullText) => {
      stopTyping();
      setTypingId(messageId);

      let index = 0;
      const step = () => {
        index += 1;
        const next = fullText.slice(0, index);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, text: next, complete: index >= fullText.length }
              : m,
          ),
        );

        if (index < fullText.length) {
          const ch = fullText[index - 1];
          const delay =
            ch === "\n"
              ? 28
              : /[.,।?]/.test(ch)
                ? 42
                : ch === " "
                  ? 12
                  : 10 + Math.floor(Math.random() * 10);
          typingTimerRef.current = window.setTimeout(step, delay);
        } else {
          setTypingId(null);
          typingTimerRef.current = null;
        }
      };

      typingTimerRef.current = window.setTimeout(step, 220);
    },
    [],
  );

  const handleOpen = () => {
    setOpen(true);
    setPulse(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleReset = () => {
    stopTyping();
    setTypingId(null);
    setView("categories");
    setActiveCategoryId(null);
    setMessages([
      {
        id: createId(),
        role: "bot",
        text: WELCOME_TEXT,
        complete: true,
      },
    ]);
  };

  const handleSelectCategory = (category) => {
    if (typingId) return;
    setActiveCategoryId(category.id);
    setView("questions");
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "user",
        text: `${category.titleGu}\n${category.titleEn}`,
        complete: true,
      },
      {
        id: createId(),
        role: "bot",
        text: `આ કેટેગરીમાંથી પ્રશ્ન પસંદ કરો / Choose a question from ${category.titleEn}.`,
        complete: true,
        showQuestions: true,
        categoryId: category.id,
      },
    ]);
  };

  const handleSelectQuestion = (question) => {
    if (typingId || !activeCategory) return;

    const userMsg = {
      id: createId(),
      role: "user",
      text: `પ્રશ્ન ${question.number}: ${question.question}`,
      complete: true,
    };
    const botId = createId();
    const botMsg = {
      id: botId,
      role: "bot",
      text: "",
      complete: false,
      accent: activeCategory.accent,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    typeAnswer(botId, question.answer);
  };

  const handleBackToCategories = () => {
    if (typingId) return;
    setView("categories");
    setActiveCategoryId(null);
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "bot",
        text: "બીજી કેટેગરી પસંદ કરો / Pick another category.",
        complete: true,
      },
    ]);
  };

  return (
    <div className="faq-chat-root">
      {open && (
        <div
          className="faq-chat-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="SQAAF FAQ Assistant"
        >
          <header className="faq-chat-header">
            <div className="faq-chat-header__brand">
              <span className="faq-chat-header__avatar" aria-hidden>
                <SmartToyIcon fontSize="small" />
              </span>
              <div>
                <p className="faq-chat-header__title">SQAAF FAQ Assistant</p>
                <p className="faq-chat-header__sub">
                  Gunotsav 2.0 · GCERT & GSQAC
                </p>
              </div>
            </div>
            <div className="faq-chat-header__actions">
              <button
                type="button"
                className="faq-chat-icon-btn"
                onClick={handleReset}
                aria-label="Reset chat"
                title="Reset"
              >
                <RefreshIcon fontSize="small" />
              </button>
              <button
                type="button"
                className="faq-chat-icon-btn"
                onClick={handleClose}
                aria-label="Close assistant"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
          </header>

          <div className="faq-chat-messages" ref={listRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`faq-chat-bubble faq-chat-bubble--${message.role}`}
                style={
                  message.role === "bot" && message.accent
                    ? { borderLeftColor: message.accent }
                    : undefined
                }
              >
                {message.role === "bot" && (
                  <span className="faq-chat-bubble__label">Assistant</span>
                )}
                <p className="faq-chat-bubble__text">
                  {message.text}
                  {typingId === message.id && !message.complete ? (
                    <span className="faq-chat-caret" aria-hidden>
                      |
                    </span>
                  ) : null}
                </p>
                {typingId === message.id && !message.text ? <TypingDots /> : null}
              </div>
            ))}
          </div>

          <footer className="faq-chat-footer">
            {view === "categories" && (
              <div className="faq-chat-chips" aria-label="FAQ categories">
                {FAQ_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="faq-chat-chip"
                    style={{
                      "--chip-accent": category.accent,
                    }}
                    onClick={() => handleSelectCategory(category)}
                    disabled={Boolean(typingId)}
                  >
                    <span className="faq-chat-chip__gu">{category.titleGu}</span>
                    <span className="faq-chat-chip__en">{category.titleEn}</span>
                  </button>
                ))}
              </div>
            )}

            {view === "questions" && activeCategory && (
              <div className="faq-chat-questions">
                <div className="faq-chat-questions__bar">
                  <button
                    type="button"
                    className="faq-chat-back"
                    onClick={handleBackToCategories}
                    disabled={Boolean(typingId)}
                  >
                    <ArrowBackIcon fontSize="inherit" />
                    Categories
                  </button>
                  <span
                    className="faq-chat-questions__cat"
                    style={{ color: activeCategory.accent }}
                  >
                    {activeCategory.titleEn}
                  </span>
                </div>
                <div
                  className="faq-chat-question-list"
                  aria-label={`${activeCategory.titleEn} questions`}
                >
                  {activeCategory.questions.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      className="faq-chat-question"
                      onClick={() => handleSelectQuestion(question)}
                      disabled={Boolean(typingId)}
                    >
                      <span className="faq-chat-question__num">
                        {String(question.number).padStart(2, "0")}
                      </span>
                      <span className="faq-chat-question__text">
                        {question.question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </div>
      )}

      <button
        type="button"
        className={`faq-chat-fab${open ? " is-open" : ""}${pulse ? " is-pulse" : ""}`}
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? "Close FAQ assistant" : "Open FAQ assistant"}
        aria-expanded={open}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}

export default FaqChatAssistant;
