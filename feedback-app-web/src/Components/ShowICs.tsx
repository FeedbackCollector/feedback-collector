import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import './ShowICs.css';

type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
};

function ObtainICs() {
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);
  const managerId = useAuthStore((state) => state.user?.id);
  console.log("manager id:", managerId);

  useEffect(() => {
    if (!managerId) {
      setIcs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIcs([]);

    fetch(`https://feedback-api-latest-moe8.onrender.com/ics?manager_id=${managerId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load ICs');
        }
        return response.json();
      })
      .then((res) => {
        setIcs(res.data);
      })
      .catch((error) => {
        console.error('Error retrieving ICs:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [managerId]);

  const getBadgeColor = (entries: number) => {
    switch (entries) {
      case 1: return '#d31c37';
      case 2: return '#e65100';
      case 3: return '#e07b00';
      case 4: return '#55a613';
      case 5: return '#1b7800';
      default: return '#1318a6';
    }
  };

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (ics.length === 0) {
    return (
      <div className="show-ics-empty">
        <i className="fa-solid fa-user-group"></i>
        <p>You don't have any Individual Contributors assigned yet. The Director assigns ICs to each manager.</p>
      </div>
    );
  }

  return (
    <section className="team-page">
      <h2>Your Team</h2>
      <div className="team-metrics">
        {ics.map((item) => (
          <article className="team-metric-card" key={item.IC_id}>
            <div className="team-metric-avatar" />

            <div className="team-metric-info">
              <h3>{item.name}</h3>
              <p className="team-metric-role">{item.title}</p>
              
              <div className="team-metric-badge-row">
                <span 
                  className="team-metric-badge" 
                  style={{ backgroundColor: getBadgeColor(item.entries) }}
                >
                  {item.entries}
                </span>
                <span className="team-metric-detail">{item.entries} entries</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ObtainICs;
