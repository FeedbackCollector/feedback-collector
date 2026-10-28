
import { useEffect, useMemo, useState } from "react";
import type { Feedback } from "../types/feedback";
import { obtainFeedback } from "../service/ObtainFeedback";

type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
};

interface ICViewProps {
  ic: IC;
  onBack: () => void;
}

function ICView({ ic, onBack }: ICViewProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFeedbacks() {
      setLoading(true);
      setError("");

      try {
        const data = await obtainFeedback();

        if (active) {
          const filtered = data
            .filter((feedback) => feedback.ic_id === ic.IC_id)
            .sort((a, b) => b.date.localeCompare(a.date));

          setFeedbacks(filtered);
        }
      } catch (err) {
        if (active) {
          console.error("Error loading feedbacks:", err);
          setError("No se pudieron cargar los feedbacks.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFeedbacks();

    return () => {
      active = false;
    };
  }, [ic.IC_id]);

  const averageScore = useMemo(() => {
    if (feedbacks.length === 0) {
      return 0;
    }

    return (
      feedbacks.reduce((total, feedback) => total + feedback.score, 0) /
      feedbacks.length
    );
  }, [feedbacks]);

  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: "8px 14px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "white",
          cursor: "pointer",
        }}
      >
        ← Back to team
      </button>

      <header style={{ margin: "24px 0" }}>
        <h1 style={{ marginBottom: "6px" }}>{ic.name}</h1>
        <p style={{ color: "#666", marginTop: 0 }}>{ic.title}</p>
      </header>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <article
          style={{
            border: "1px solid #ccc",
            borderRadius: "12px",
            padding: "20px",
            minWidth: "180px",
          }}
        >
          <h3>Average score</h3>
          <p style={{ fontSize: "24px", marginBottom: 0 }}>
            {feedbacks.length > 0
              ? `${averageScore.toFixed(1)} / 5`
              : "No data"}
          </p>
        </article>

        <article
          style={{
            border: "1px solid #ccc",
            borderRadius: "12px",
            padding: "20px",
            minWidth: "180px",
          }}
        >
          <h3>Total feedbacks</h3>
          <p style={{ fontSize: "24px", marginBottom: 0 }}>
            {feedbacks.length}
          </p>
        </article>
      </section>

      <section>
        <h2>Feedback history</h2>

        {loading && <p>Loading feedbacks...</p>}

        {!loading && error && (
          <p role="alert" style={{ color: "#b42318" }}>
            {error}
          </p>
        )}

        {!loading && !error && feedbacks.length === 0 && (
          <p>This IC doesn't have any feedback yet.</p>
        )}

        {!loading && !error && feedbacks.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {feedbacks.map((feedback) => (
              <article
                key={feedback.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 6px" }}>
                      {feedback.source_name}
                    </h3>

                    <p style={{ color: "#666", margin: 0 }}>
                      {feedback.date}
                      {" · "}
                      {feedback.project_name ??
                        (feedback.project_id !== null
                          ? `Project #${feedback.project_id}`
                          : "No project")}
                    </p>
                  </div>

                  <strong>
                    {"★".repeat(
                      Math.max(0, Math.min(5, feedback.score))
                    )}
                    {"☆".repeat(
                      5 - Math.max(0, Math.min(5, feedback.score))
                    )}
                    {" "}
                    {feedback.score}/5
                  </strong>
                </div>

                {feedback.comment && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {feedback.comment}
                  </p>
                )}

                {feedback.screenshot_url && (
                  <a
                    href={feedback.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View screenshot
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ICView;
